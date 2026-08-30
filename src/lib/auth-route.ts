import "server-only";

import { NextResponse } from "next/server";
import {
  ADMIN_ACCESS_COOKIE_NAME,
  ADMIN_OTP_CHALLENGE_COOKIE_NAME,
  isAdminOtpAccountLocked,
} from "@/lib/admin-otp";
import { AUTH_TOKEN_COOKIE_NAME, authCookieOptions } from "@/lib/auth-cookie";
import { appendClientRequestHeaders, getBackendUrl } from "@/lib/backend";
import { AuthResponse } from "@/lib/shop-api";

type BackendAuthResponse = AuthResponse & {
  token: string;
  tokenType: string;
};

export async function createAuthSessionResponse(
  backendPath: string,
  request: Request,
) {
  const headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set(
    "Content-Type",
    request.headers.get("Content-Type") ?? "application/json",
  );
  appendClientRequestHeaders(headers, request);

  const rawBody = await request.text();
  const { body, turnstileToken } = extractTurnstileToken(rawBody);
  if (turnstileToken) {
    headers.set("X-Turnstile-Token", turnstileToken);
  }

  const backendResponse = await fetch(getBackendUrl(backendPath), {
    method: "POST",
    headers,
    body,
    cache: "no-store",
  });
  const responseText = await backendResponse.text();

  if (!backendResponse.ok) {
    return new Response(responseText, {
      status: backendResponse.status,
      headers: { "Content-Type": backendResponse.headers.get("Content-Type") ?? "application/json" },
    });
  }

  const backendSession = JSON.parse(responseText) as BackendAuthResponse;
  if (!backendSession.token || !backendSession.userId || !backendSession.role) {
    return Response.json(
      { message: "Backend returned an invalid authentication response." },
      { status: 502 },
    );
  }

  if (
    backendSession.role === "ADMIN" &&
    isAdminOtpAccountLocked(backendSession.userId)
  ) {
    return Response.json(
      {
        message:
          "Tài khoản đã bị khóa do nhập sai mã xác minh Admin quá 3 lần.",
      },
      { status: 423 },
    );
  }

  const token = backendSession.token;
  const clientSession: AuthResponse = {
    expiresIn: backendSession.expiresIn,
    userId: backendSession.userId,
    username: backendSession.username,
    email: backendSession.email,
    role: backendSession.role,
  };
  const response = NextResponse.json(clientSession, {
    status: backendResponse.status,
  });
  response.cookies.set(AUTH_TOKEN_COOKIE_NAME, token, {
    ...authCookieOptions,
    maxAge: backendSession.expiresIn,
  });
  response.cookies.delete(ADMIN_ACCESS_COOKIE_NAME);
  response.cookies.delete(ADMIN_OTP_CHALLENGE_COOKIE_NAME);
  response.cookies.delete("shop_game_auth");
  return response;
}

function extractTurnstileToken(rawBody: string) {
  try {
    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    const turnstileToken =
      typeof payload.turnstileToken === "string"
        ? payload.turnstileToken.trim()
        : "";
    delete payload.turnstileToken;
    return { body: JSON.stringify(payload), turnstileToken };
  } catch {
    return { body: rawBody, turnstileToken: "" };
  }
}
