import { proxyBackendResponse } from "@/lib/backend";

export async function GET(request: Request) {
  try {
    return await proxyBackendResponse("/api/agency/me", request);
  } catch {
    return Response.json(
      { message: "Không kết nối được hệ thống đại lý." },
      { status: 502 },
    );
  }
}
