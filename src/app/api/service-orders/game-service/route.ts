import { proxyBackendResponse } from "@/lib/backend";

export async function POST(request: Request) {
  try {
    return await proxyBackendResponse(
      "/api/service-orders/game-service",
      request,
    );
  } catch {
    return Response.json(
      { message: "Không kết nối được backend shop-game." },
      { status: 502 },
    );
  }
}
