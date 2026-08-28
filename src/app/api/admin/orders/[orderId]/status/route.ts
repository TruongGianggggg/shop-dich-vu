import { proxyBackendResponse, requireAdminRequest } from "@/lib/backend";

export async function PUT(
  request: Request,
  context: RouteContext<"/api/admin/orders/[orderId]/status">,
) {
  try {
    const forbidden = await requireAdminRequest(request);
    if (forbidden) return forbidden;

    const { orderId } = await context.params;
    return await proxyBackendResponse(
      `/api/admin/service-orders/${encodeURIComponent(orderId)}/status`,
      request,
    );
  } catch {
    return Response.json(
      { message: "Không kết nối được backend." },
      { status: 502 },
    );
  }
}
