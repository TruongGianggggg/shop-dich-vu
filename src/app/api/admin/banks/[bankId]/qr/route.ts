import { proxyBackendResponse } from "@/lib/backend";

export async function GET(
  request: Request,
  context: { params: Promise<{ bankId: string }> },
) {
  try {
    const { bankId } = await context.params;
    const url = new URL(request.url);
    return await proxyBackendResponse(
      `/api/banks/${encodeURIComponent(bankId)}/qr${url.search}`,
      request,
    );
  } catch {
    return Response.json(
      { message: "Khong ket noi duoc backend. Hay kiem tra server Spring Boot." },
      { status: 502 },
    );
  }
}
