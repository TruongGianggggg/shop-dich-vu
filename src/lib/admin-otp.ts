import "server-only";

import {
  createHmac,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import nodemailer from "nodemailer";

export const ADMIN_ACCESS_COOKIE_NAME = "shop_admin_access";
export const ADMIN_OTP_CHALLENGE_COOKIE_NAME = "shop_admin_otp_challenge";

const OTP_TTL_MS = 3 * 60 * 1000;
const ACCESS_TTL_SECONDS = 60 * 60;
const RESEND_COOLDOWN_MS = 60 * 1000;
const SEND_WINDOW_MS = 60 * 60 * 1000;
const MAX_SENDS_PER_WINDOW = 5;
const MAX_ATTEMPTS = 3;

type OtpChallenge = {
  attempts: number;
  codeHash: string;
  createdAt: number;
  expiresAt: number;
  id: string;
  userId: string;
};

type AdminOtpState = {
  challenges: Map<string, OtpChallenge>;
  lockedUsers: Set<string>;
  sendHistory: Map<string, number[]>;
};

const globalOtpState = globalThis as typeof globalThis & {
  __shopAdminOtpState?: AdminOtpState;
};

const state: AdminOtpState =
  globalOtpState.__shopAdminOtpState ??
  (globalOtpState.__shopAdminOtpState = {
    challenges: new Map<string, OtpChallenge>(),
    lockedUsers: loadLockedUsers(),
    sendHistory: new Map<string, number[]>(),
  });

export const adminAccessCookieOptions = {
  httpOnly: true,
  maxAge: ACCESS_TTL_SECONDS,
  path: "/",
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
};

export const adminOtpChallengeCookieOptions = {
  httpOnly: true,
  maxAge: Math.floor(OTP_TTL_MS / 1000),
  path: "/",
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
};

export async function createAndSendAdminOtp(userId: string) {
  if (isAdminOtpAccountLocked(userId)) {
    const error = new Error("ADMIN_OTP_ACCOUNT_LOCKED");
    error.name = "AdminOtpAccountLockedError";
    throw error;
  }

  const now = Date.now();
  cleanupExpiredState(now);

  const activeChallenge = findActiveChallenge(userId, now);
  if (activeChallenge) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil(
        (activeChallenge.createdAt + RESEND_COOLDOWN_MS - now) / 1000,
      ),
    );

    if (retryAfterSeconds > 0 && now < activeChallenge.createdAt + RESEND_COOLDOWN_MS) {
      return {
        challengeId: activeChallenge.id,
        email: maskEmail(getAdminOtpEmail()),
        expiresIn: Math.max(1, Math.ceil((activeChallenge.expiresAt - now) / 1000)),
        retryAfterSeconds,
        sent: false,
      };
    }
  }

  enforceSendLimit(userId, now);

  if (activeChallenge) {
    state.challenges.delete(activeChallenge.id);
  }

  const code = randomInt(0, 100_000_000).toString().padStart(8, "0");
  const challengeId = randomUUID();
  const challenge: OtpChallenge = {
    attempts: 0,
    codeHash: hashOtp(challengeId, userId, code),
    createdAt: now,
    expiresAt: now + OTP_TTL_MS,
    id: challengeId,
    userId,
  };

  // Store before awaiting SMTP so duplicate requests cannot send two codes.
  state.challenges.set(challengeId, challenge);

  try {
    await sendOtpEmail(code);
  } catch (error) {
    state.challenges.delete(challengeId);
    throw error;
  }

  const recentSends = state.sendHistory.get(userId) ?? [];
  state.sendHistory.set(userId, [...recentSends, now]);

  return {
    challengeId,
    email: maskEmail(getAdminOtpEmail()),
    expiresIn: Math.floor(OTP_TTL_MS / 1000),
    retryAfterSeconds: Math.floor(RESEND_COOLDOWN_MS / 1000),
    sent: true,
  };
}

export function verifyAdminOtp(
  challengeId: string,
  userId: string,
  code: string,
) {
  const now = Date.now();
  cleanupExpiredState(now);

  const challenge = state.challenges.get(challengeId);
  if (!challenge || challenge.userId !== userId) {
    return { ok: false as const, reason: "expired" as const };
  }

  challenge.attempts += 1;
  const candidateHash = hashOtp(challengeId, userId, code);
  const matches = safeEqualHex(challenge.codeHash, candidateHash);

  if (matches) {
    state.challenges.delete(challengeId);
    return { ok: true as const, accessToken: createAdminAccessToken(userId) };
  }

  if (challenge.attempts >= MAX_ATTEMPTS) {
    state.challenges.delete(challengeId);
    state.lockedUsers.add(userId);
    persistLockedUsers();
    return { ok: false as const, reason: "locked" as const };
  }

  return {
    ok: false as const,
    reason: "invalid" as const,
    attemptsRemaining: MAX_ATTEMPTS - challenge.attempts,
  };
}

export function isAdminOtpAccountLocked(userId: string) {
  return state.lockedUsers.has(userId);
}

export function clearAdminOtpAccountLock(userId: string) {
  if (state.lockedUsers.delete(userId)) persistLockedUsers();
}

export function isAdminAccessGranted(token: string | undefined, userId: string) {
  if (!token) return false;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return false;

  const expectedSignature = sign(encodedPayload);
  if (!safeEqualText(signature, expectedSignature)) return false;

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as { exp?: unknown; sub?: unknown };

    return (
      payload.sub === userId &&
      typeof payload.exp === "number" &&
      payload.exp > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

function createAdminAccessToken(userId: string) {
  const payload = Buffer.from(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + ACCESS_TTL_SECONDS,
      nonce: randomUUID(),
      sub: userId,
    }),
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

function findActiveChallenge(userId: string, now: number) {
  return [...state.challenges.values()].find(
    (challenge) => challenge.userId === userId && challenge.expiresAt > now,
  );
}

function enforceSendLimit(userId: string, now: number) {
  const recentSends = (state.sendHistory.get(userId) ?? []).filter(
    (sentAt) => sentAt > now - SEND_WINDOW_MS,
  );
  state.sendHistory.set(userId, recentSends);

  if (recentSends.length >= MAX_SENDS_PER_WINDOW) {
    const error = new Error("OTP_SEND_LIMIT");
    error.name = "OtpSendLimitError";
    throw error;
  }
}

function cleanupExpiredState(now: number) {
  for (const [id, challenge] of state.challenges) {
    if (challenge.expiresAt <= now) state.challenges.delete(id);
  }

  for (const [userId, sends] of state.sendHistory) {
    const recentSends = sends.filter((sentAt) => sentAt > now - SEND_WINDOW_MS);
    if (recentSends.length) state.sendHistory.set(userId, recentSends);
    else state.sendHistory.delete(userId);
  }
}

function getLockFilePath() {
  return join(
    process.cwd(),
    ".data",
    "admin-otp-locked-users.json",
  );
}

function loadLockedUsers() {
  try {
    const filePath = getLockFilePath();
    if (!existsSync(filePath)) return new Set<string>();
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
    if (!Array.isArray(parsed)) return new Set<string>();
    return new Set(parsed.filter((value): value is string => typeof value === "string"));
  } catch (error) {
    console.error("Unable to load locked Admin OTP accounts", error);
    return new Set<string>();
  }
}

function persistLockedUsers() {
  try {
    const filePath = getLockFilePath();
    const temporaryPath = `${filePath}.${process.pid}.tmp`;
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(
      temporaryPath,
      JSON.stringify([...state.lockedUsers].sort()),
      { encoding: "utf8", mode: 0o600 },
    );
    renameSync(temporaryPath, filePath);
  } catch (error) {
    console.error("Unable to persist locked Admin OTP accounts", error);
  }
}

function hashOtp(challengeId: string, userId: string, code: string) {
  return createHmac("sha256", getOtpSecret())
    .update(`${challengeId}:${userId}:${code}`)
    .digest("hex");
}

function sign(value: string) {
  return createHmac("sha256", getOtpSecret()).update(value).digest("base64url");
}

function safeEqualHex(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function safeEqualText(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function getOtpSecret() {
  const secret = process.env.ADMIN_OTP_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_OTP_SECRET must contain at least 32 characters.");
  }
  return secret;
}

function getAdminOtpEmail() {
  const email = process.env.ADMIN_OTP_EMAIL?.trim();
  if (!email) throw new Error("ADMIN_OTP_EMAIL is not configured.");
  return email;
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT ?? "465");
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD?.replace(/\s+/g, "");

  if (!user || !password || !Number.isInteger(port)) {
    throw new Error("SMTP configuration is incomplete.");
  }

  return { host, password, port, user };
}

async function sendOtpEmail(code: string) {
  const { host, password, port, user } = getSmtpConfig();
  const recipient = getAdminOtpEmail();
  const transporter = nodemailer.createTransport({
    auth: { pass: password, user },
    host,
    port,
    secure: port === 465,
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM?.trim() || `Shoppro247 Admin <${user}>`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172036">
        <h2>Xác minh truy cập Admin Panel</h2>
        <p>Mã xác minh của bạn là:</p>
        <div style="font-size:34px;font-weight:800;letter-spacing:8px;padding:18px;background:#f1f5f9;border-radius:10px;text-align:center">${code}</div>
        <p>Mã có hiệu lực trong 3 phút và chỉ dùng được một lần.</p>
        <p>Nếu bạn không yêu cầu mã này, hãy đổi mật khẩu tài khoản ngay.</p>
      </div>
    `,
    subject: "[Shoppro247] Mã xác minh truy cập Admin Panel",
    text: `Mã xác minh Admin Panel của bạn là ${code}. Mã có hiệu lực trong 3 phút và chỉ dùng được một lần.`,
    to: recipient,
  });
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "email quản trị";
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${"*".repeat(Math.max(3, name.length - visible.length))}@${domain}`;
}
