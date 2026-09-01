import { NextResponse } from "next/server";
import { AUTH_TOKEN_COOKIE_NAME, authCookieOptions } from "@/lib/auth-cookie";
import {
  getAuthenticatedBackendSession,
  getBackendUrl,
  getRequestAuthToken,
} from "@/lib/backend";

const CHALLENGE_COOKIE_NAME = "shop_admin_otp_challenge";

type BackendVerifyResponse = {
  expiresIn?: unknown;
  success?: unknown;
  token?: unknown;
};

export async function POST(request: Request) {
  const session = await getAuthenticatedBackendSession(request);
  const token = getRequestAuthToken(request);
  if (!session || !token) {
    return Response.json({ message: "Vui lòng đăng nhập lại." }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return Response.json({ message: "Tài khoản không có quyền ADMIN." }, { status: 403 });
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

  const challengeId = getCookieValue(request, CHALLENGE_COOKIE_NAME);
  if (!challengeId) {
    return Response.json(
      { message: "Yêu cầu xác minh đã hết hạn. Vui lòng gửi mã mới." },
      { status: 410 },
    );
  }

  try {
    const backendResponse = await fetch(getBackendUrl("/api/admin-access/verify"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ challengeId, code }),
      cache: "no-store",
    });
    const responseText = await backendResponse.text();
    if (!backendResponse.ok) {
      const response = new NextResponse(responseText, {
        status: backendResponse.status,
        headers: { "Content-Type": backendResponse.headers.get("Content-Type") ?? "application/json" },
      });
      if (backendResponse.status === 410 || backendResponse.status === 423) {
        response.cookies.delete(CHALLENGE_COOKIE_NAME);
      }
      return response;
    }

    const result = JSON.parse(responseText) as BackendVerifyResponse;
    if (result.success !== true || typeof result.token !== "string") {
      return Response.json(
        { message: "Backend trả về phiên Admin không hợp lệ." },
        { status: 502 },
      );
    }
    const expiresIn =
      typeof result.expiresIn === "number" && result.expiresIn > 0
        ? result.expiresIn
        : 3600;
    const response = NextResponse.json({ success: true });
    response.cookies.set(AUTH_TOKEN_COOKIE_NAME, result.token, {
      ...authCookieOptions,
      maxAge: expiresIn,
    });
    response.cookies.delete(CHALLENGE_COOKIE_NAME);
    response.cookies.delete("shop_admin_access");
    return response;
  } catch (error) {
    console.error("Unable to verify backend Admin OTP challenge", error);
    return Response.json(
      { message: "Không kết nối được hệ thống xác minh." },
      { status: 502 },
    );
  }
}

function getCookieValue(request: Request, name: string) {
  const rawValue = (request.headers.get("Cookie") ?? "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
  return rawValue ? decodeURIComponent(rawValue) : null;
}
