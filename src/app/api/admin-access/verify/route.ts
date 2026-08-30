import { NextResponse } from "next/server";
import {
  ADMIN_ACCESS_COOKIE_NAME,
  ADMIN_OTP_CHALLENGE_COOKIE_NAME,
  adminAccessCookieOptions,
  verifyAdminOtp,
} from "@/lib/admin-otp";
import { AUTH_TOKEN_COOKIE_NAME } from "@/lib/auth-cookie";
import { getAuthenticatedBackendSession } from "@/lib/backend";

export async function POST(request: Request) {
  const session = await getAuthenticatedBackendSession(request);
  if (!session) {
    return Response.json({ message: "Vui lòng đăng nhập lại." }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return Response.json(
      { message: "Tài khoản không có quyền ADMIN." },
      { status: 403 },
    );
  }

  let code = "";
  try {
    const payload = (await request.json()) as { code?: unknown };
    code = typeof payload.code === "string" ? payload.code.trim() : "";
  } catch {}

  if (!/^\d{8}$/.test(code)) {
    return Response.json(
      { message: "Mã xác minh phải gồm đúng 8 chữ số." },
      { status: 400 },
    );
  }

  const challengeId = getCookieValue(
    request,
    ADMIN_OTP_CHALLENGE_COOKIE_NAME,
  );
  if (!challengeId) {
    return Response.json(
      { message: "Yêu cầu xác minh đã hết hạn. Vui lòng gửi mã mới." },
      { status: 410 },
    );
  }

  const result = verifyAdminOtp(challengeId, session.userId, code);
  if (!result.ok) {
    const response = NextResponse.json(
      {
        attemptsRemaining:
          "attemptsRemaining" in result ? result.attemptsRemaining : 0,
        message:
          result.reason === "invalid"
            ? `Mã không đúng. Bạn còn ${result.attemptsRemaining} lần thử.`
            : result.reason === "locked"
              ? "Bạn đã nhập sai quá số lần cho phép. Vui lòng gửi mã mới."
              : "Mã đã hết hạn. Vui lòng gửi mã mới.",
      },
      { status: result.reason === "invalid" ? 400 : 410 },
    );

    if (result.reason !== "invalid") {
      response.cookies.delete(ADMIN_OTP_CHALLENGE_COOKIE_NAME);
    }
    if (result.reason === "locked") {
      response.cookies.delete(AUTH_TOKEN_COOKIE_NAME);
      response.cookies.delete(ADMIN_ACCESS_COOKIE_NAME);
    }
    return response;
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(
    ADMIN_ACCESS_COOKIE_NAME,
    result.accessToken,
    adminAccessCookieOptions,
  );
  response.cookies.delete(ADMIN_OTP_CHALLENGE_COOKIE_NAME);
  return response;
}

function getCookieValue(request: Request, name: string) {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const value = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);

  return value ? decodeURIComponent(value) : undefined;
}
