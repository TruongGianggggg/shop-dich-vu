import { proxyBackendResponse } from "@/lib/backend";

export async function POST(request: Request) {
  try {
    return await proxyBackendResponse(
      "/api/auth/password-change/confirm",
      request,
    );
  } catch {
    return Response.json(
      { message: "Không kết nối được hệ thống đổi mật khẩu." },
      { status: 502 },
    );
  }
}
