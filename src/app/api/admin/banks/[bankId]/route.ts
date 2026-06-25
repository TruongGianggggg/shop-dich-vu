import { proxyBackendResponse } from "@/lib/backend";

export async function PUT(
  request: Request,
  context: { params: Promise<{ bankId: string }> },
) {
  try {
    const { bankId } = await context.params;
    return await proxyBackendResponse(
      `/api/banks/${encodeURIComponent(bankId)}`,
      request,
    );
  } catch {
    return Response.json(
      { message: "Khong ket noi duoc backend. Hay kiem tra server Spring Boot." },
      { status: 502 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ bankId: string }> },
) {
  try {
    const { bankId } = await context.params;
    return await proxyBackendResponse(
      `/api/banks/${encodeURIComponent(bankId)}`,
      request,
    );
  } catch {
    return Response.json(
      { message: "Khong ket noi duoc backend. Hay kiem tra server Spring Boot." },
      { status: 502 },
    );
  }
}
