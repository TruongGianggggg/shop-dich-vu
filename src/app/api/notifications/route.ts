import { proxyBackendResponse } from "@/lib/backend";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    return await proxyBackendResponse(
      `/api/notifications${url.search}`,
      request,
    );
  } catch {
    return Response.json(
      { message: "Không kết nối được máy chủ thông báo." },
      { status: 502 },
    );
  }
}
