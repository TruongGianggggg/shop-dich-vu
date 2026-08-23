import { proxyBackendResponse, requireAdminRequest } from "@/lib/backend";

export async function GET(request: Request) {
  try {
    const forbidden = await requireAdminRequest(request);

    if (forbidden) {
      return forbidden;
    }

    const url = new URL(request.url);
    return await proxyBackendResponse(
      `/api/service-orders/history/deposits${url.search}`,
      request,
    );
  } catch {
    return Response.json(
      { message: "Khong ket noi duoc backend. Hay kiem tra server Spring Boot." },
      { status: 502 },
    );
  }
}
