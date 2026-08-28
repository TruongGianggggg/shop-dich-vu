import { proxyBackendResponse, requireCollaboratorRequest } from "@/lib/backend";

export async function PUT(
  request: Request,
  context: RouteContext<"/api/collaborators/service-orders/[orderId]/status">,
) {
  try {
    const forbidden = await requireCollaboratorRequest(request);
    if (forbidden) return forbidden;
    const { orderId } = await context.params;
    return await proxyBackendResponse(
      `/api/collaborators/service-orders/${encodeURIComponent(orderId)}/status`,
      request,
    );
  } catch {
    return Response.json({ message: "Không kết nối được backend." }, { status: 502 });
  }
}
