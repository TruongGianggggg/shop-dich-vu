import { proxyBackendResponse, requireAdminRequest } from "@/lib/backend";

export async function PUT(
  request: Request,
  context: RouteContext<"/api/admin/currency-orders/[orderId]/status">,
) {
  try {
    const forbidden = requireAdminRequest(request);
    if (forbidden) return forbidden;
    const { orderId } = await context.params;
    return await proxyBackendResponse(
      `/api/admin/currency-orders/${encodeURIComponent(orderId)}/status`,
      request,
    );
  } catch {
    return Response.json({ message: "Không kết nối được backend." }, { status: 502 });
  }
}
