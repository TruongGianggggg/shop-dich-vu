import { proxyBackendResponse } from "@/lib/backend";

export async function GET(request: Request) {
  try {
    return await proxyBackendResponse("/api/auth/me", request);
  } catch {
    return Response.json(
      { message: "Không kết nối được hệ thống xác thực." },
      { status: 502 },
    );
  }
}
