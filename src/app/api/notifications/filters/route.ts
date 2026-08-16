import { proxyBackendResponse } from "@/lib/backend";

export async function GET(request: Request) {
  try {
    return await proxyBackendResponse("/api/notifications/filters", request);
  } catch {
    return Response.json(
      { message: "Không tải được bộ lọc thông báo." },
      { status: 502 },
    );
  }
}
