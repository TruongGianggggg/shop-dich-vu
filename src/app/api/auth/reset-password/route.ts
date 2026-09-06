import { proxyBackendResponse } from "@/lib/backend";

export async function POST(request: Request) {
  try {
    return await proxyBackendResponse("/api/auth/reset-password", request);
  } catch {
    return Response.json(
      { message: "Không kết nối được hệ thống đặt lại mật khẩu." },
      { status: 502 },
    );
  }
}
