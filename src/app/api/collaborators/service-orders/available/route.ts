import { proxyBackendResponse, requireCollaboratorRequest } from "@/lib/backend";
import type { ServiceOrder } from "@/lib/shop-api";

export async function GET(request: Request) {
  try {
    const forbidden = await requireCollaboratorRequest(request);
    if (forbidden) return forbidden;
    const response = await proxyBackendResponse(
      "/api/collaborators/service-orders/available",
      request,
    );

    if (!response.ok) return response;

    const orders = (await response.json()) as ServiceOrder[];
    return Response.json(orders.map(redactUnreceivedOrder));
  } catch {
    return Response.json({ message: "Không kết nối được backend." }, { status: 502 });
  }
}

function redactUnreceivedOrder(order: ServiceOrder): ServiceOrder {
  return {
    ...order,
    userId: null,
    customerUsername: null,
    username: null,
    password: null,
    contactInfo: null,
    note: null,
    adminNote: null,
  };
}
