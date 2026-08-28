import { proxyBackendResponse, requireCollaboratorRequest } from "@/lib/backend";

export async function POST(
  request: Request,
  context: RouteContext<"/api/collaborators/service-orders/[orderId]/receive">,
) {
  try {
    const forbidden = await requireCollaboratorRequest(request);
    if (forbidden) return forbidden;
    const { orderId } = await context.params;
    return await proxyBackendResponse(
      `/api/collaborators/service-orders/${encodeURIComponent(orderId)}/receive`,
      request,
    );
  } catch {
    return Response.json({ message: "Không kết nối được backend." }, { status: 502 });
  }
}
