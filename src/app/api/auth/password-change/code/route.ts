import { proxyBackendResponse } from "@/lib/backend";

export async function POST(request: Request) {
  try {
    return await proxyBackendResponse("/api/auth/password-change/code", request);
  } catch {
    return Response.json(
      { message: "Không kết nối được hệ thống gửi mã xác nhận." },
      { status: 502 },
    );
  }
}
