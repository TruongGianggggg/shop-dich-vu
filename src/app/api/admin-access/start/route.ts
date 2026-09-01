import { NextResponse } from "next/server";
import {
  ADMIN_ACCESS_COOKIE_NAME,
  ADMIN_OTP_CHALLENGE_COOKIE_NAME,
  adminOtpChallengeCookieOptions,
  createAndSendAdminOtp,
} from "@/lib/admin-otp";
import {
  getAuthenticatedBackendSession,
  getBackendUrl,
  getRequestAuthToken,
} from "@/lib/backend";

export async function POST(request: Request) {
  const session = await getAuthenticatedBackendSession(request);

  if (!session) {
    return Response.json({ message: "Vui lòng đăng nhập lại." }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return Response.json(
      { message: "Chỉ tài khoản ADMIN mới được yêu cầu mã xác minh." },
      { status: 403 },
    );
  }

  try {
    const token = getRequestAuthToken(request);
    if (!token) {
      return Response.json({ message: "Vui lòng đăng nhập lại." }, { status: 401 });
    }

    const result = await createAndSendAdminOtp(
      session.userId,
      session.email,
      async (code) => {
        const deliveryResponse = await fetch(getBackendUrl("/api/admin-access/code"), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
          cache: "no-store",
        });

        if (!deliveryResponse.ok) {
          throw new Error(`Backend mail delivery returned ${deliveryResponse.status}`);
        }
      },
    );
    const response = NextResponse.json({
      email: result.email,
      expiresIn: result.expiresIn,
      message: result.sent
        ? "Mã xác minh đã được gửi."
        : "Mã đã được gửi trước đó và vẫn còn hiệu lực.",
      retryAfterSeconds: result.retryAfterSeconds,
    });

    response.cookies.delete(ADMIN_ACCESS_COOKIE_NAME);
    response.cookies.set(
      ADMIN_OTP_CHALLENGE_COOKIE_NAME,
      result.challengeId,
      adminOtpChallengeCookieOptions,
    );
    return response;
  } catch (error) {
    console.error("Unable to send admin OTP", error);
    const isRateLimited =
      error instanceof Error && error.name === "OtpSendLimitError";
    const isAccountLocked =
      error instanceof Error && error.name === "AdminOtpAccountLockedError";

    return Response.json(
      {
        message: isAccountLocked
          ? "Tài khoản đã bị khóa do nhập sai mã xác minh quá 3 lần."
          : isRateLimited
            ? "Bạn đã yêu cầu quá nhiều mã. Vui lòng thử lại sau 1 giờ."
            : "Không gửi được mã xác minh. Hãy kiểm tra cấu hình SMTP.",
      },
      { status: isAccountLocked ? 423 : isRateLimited ? 429 : 503 },
    );
  }
}
