import { proxyBackendResponse } from "@/lib/backend";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> },
) {
  const { categoryId } = await params;

  try {
    return await proxyBackendResponse(
      `/api/service-categories/${encodeURIComponent(categoryId)}`,
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
  { params }: { params: Promise<{ categoryId: string }> },
) {
  const { categoryId } = await params;

  try {
    return await proxyBackendResponse(
      `/api/service-categories/${encodeURIComponent(categoryId)}`,
      request,
    );
  } catch {
    return Response.json(
      { message: "Khong ket noi duoc backend. Hay kiem tra server Spring Boot." },
      { status: 502 },
    );
  }
}
