import { proxyBackendResponse, requireCollaboratorRequest } from "@/lib/backend";
import type { ServiceOrder } from "@/lib/shop-api";

export async function GET(request: Request) {
  try {
    const forbidden = await requireCollaboratorRequest(request);
    if (forbidden) return forbidden;
    const response = await proxyBackendResponse("/api/collaborators/service-orders/received", request);
    if (!response.ok) return response;

    const orders = (await response.json()) as ServiceOrder[];
    return Response.json(orders.map((order) => ({ ...order, contactInfo: null })));
  } catch {
    return Response.json({ message: "Không kết nối được backend." }, { status: 502 });
  }
}
