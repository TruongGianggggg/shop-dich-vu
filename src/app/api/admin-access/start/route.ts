import { NextResponse } from "next/server";
import {
  appendClientRequestHeaders,
  getAuthenticatedBackendSession,
  getBackendUrl,
  getRequestAuthToken,
} from "@/lib/backend";

const CHALLENGE_COOKIE_NAME = "shop_admin_otp_challenge";

type BackendStartResponse = {
  challengeId?: unknown;
  email?: unknown;
  expiresIn?: unknown;
  message?: unknown;
  retryAfterSeconds?: unknown;
};

export async function POST(request: Request) {
  const session = await getAuthenticatedBackendSession(request);
  const token = getRequestAuthToken(request);
  if (!session || !token) {
    return Response.json({ message: "Vui lòng đăng nhập lại." }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return Response.json(
      { message: "Chỉ tài khoản ADMIN mới được yêu cầu mã xác minh." },
      { status: 403 },
    );
  }

  try {
    const headers = new Headers({ Authorization: `Bearer ${token}` });
    appendClientRequestHeaders(headers, request);
    const backendResponse = await fetch(getBackendUrl("/api/admin-access/start"), {
      method: "POST",
      headers,
      cache: "no-store",
    });
    const responseText = await backendResponse.text();
    if (!backendResponse.ok) {
      return new Response(responseText, {
        status: backendResponse.status,
        headers: { "Content-Type": backendResponse.headers.get("Content-Type") ?? "application/json" },
      });
    }

    const result = JSON.parse(responseText) as BackendStartResponse;
    if (typeof result.challengeId !== "string" || !result.challengeId) {
      return Response.json(
        { message: "Backend trả về yêu cầu xác minh không hợp lệ." },
        { status: 502 },
      );
    }

    const response = NextResponse.json({
      email: result.email,
      expiresIn: result.expiresIn,
      message: result.message,
      retryAfterSeconds: result.retryAfterSeconds,
    });
    response.cookies.set(CHALLENGE_COOKIE_NAME, result.challengeId, {
      httpOnly: true,
      maxAge: 3 * 60,
      path: "/",
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
    response.cookies.delete("shop_admin_access");
    return response;
  } catch (error) {
    console.error("Unable to start backend Admin OTP challenge", error);
    return Response.json(
      { message: "Không kết nối được hệ thống gửi mã." },
      { status: 502 },
    );
  }
}
