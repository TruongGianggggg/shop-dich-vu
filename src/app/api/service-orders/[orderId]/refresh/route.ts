import { proxyBackendResponse } from "@/lib/backend";

export async function POST(request: Request, context: RouteContext<"/api/service-orders/[orderId]/refresh">) {
  const { orderId } = await context.params;
  try {
    return await proxyBackendResponse(`/api/service-orders/${encodeURIComponent(orderId)}/refresh`, request);
  } catch {
    return Response.json({ message: "Không kết nối được hệ thống trạng thái đơn." }, { status: 502 });
  }
}
