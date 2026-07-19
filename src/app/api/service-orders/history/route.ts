import { proxyBackendResponse } from "@/lib/backend";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    return await proxyBackendResponse(
      `/api/service-orders/history${url.search}`,
      request,
    );
  } catch {
    return Response.json(
      { message: "Không kết nối được backend shop-game." },
      { status: 502 },
    );
  }
}
