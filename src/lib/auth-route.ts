import "server-only";

import { NextResponse } from "next/server";
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

  const backendResponse = await fetch(getBackendUrl(backendPath), {
    method: "POST",
    headers,
    body: await request.text(),
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
  response.cookies.delete("shop_game_auth");
  return response;
}
