import { proxyBackendResponse } from "@/lib/backend";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ packageId: string }> },
) {
  const { packageId } = await params;

  try {
    const payload = (await request.json()) as { subCategoryId?: string };

    if (!payload.subCategoryId) {
      return Response.json(
        { message: "subCategoryId is required to update service package." },
        { status: 400 },
      );
    }

    return await proxyBackendResponse(
      `/api/service-sub-categories/${encodeURIComponent(
        payload.subCategoryId,
      )}/packages/${encodeURIComponent(packageId)}`,
      request,
      { body: JSON.stringify(payload) },
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
  { params }: { params: Promise<{ packageId: string }> },
) {
  const { packageId } = await params;

  try {
    const url = new URL(request.url);
    const subCategoryId = url.searchParams.get("subCategoryId");

    if (!subCategoryId) {
      return Response.json(
        { message: "subCategoryId is required to delete service package." },
        { status: 400 },
      );
    }

    return await proxyBackendResponse(
      `/api/service-sub-categories/${encodeURIComponent(
        subCategoryId,
      )}/packages/${encodeURIComponent(packageId)}`,
      request,
    );
  } catch {
    return Response.json(
      { message: "Khong ket noi duoc backend. Hay kiem tra server Spring Boot." },
      { status: 502 },
    );
  }
}
