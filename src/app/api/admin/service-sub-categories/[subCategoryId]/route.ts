import { proxyBackendResponse } from "@/lib/backend";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ subCategoryId: string }> },
) {
  const { subCategoryId } = await params;

  try {
    const payload = (await request.json()) as { parentId?: string };

    if (!payload.parentId) {
      return Response.json(
        { message: "parentId is required to update service sub-category." },
        { status: 400 },
      );
    }

    return await proxyBackendResponse(
      `/api/service-categories/${encodeURIComponent(
        payload.parentId,
      )}/children/${encodeURIComponent(subCategoryId)}`,
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
  { params }: { params: Promise<{ subCategoryId: string }> },
) {
  const { subCategoryId } = await params;

  try {
    const url = new URL(request.url);
    const parentId = url.searchParams.get("parentId");

    if (!parentId) {
      return Response.json(
        { message: "parentId is required to delete service sub-category." },
        { status: 400 },
      );
    }

    return await proxyBackendResponse(
      `/api/service-categories/${encodeURIComponent(
        parentId,
      )}/children/${encodeURIComponent(subCategoryId)}`,
      request,
    );
  } catch {
    return Response.json(
      { message: "Khong ket noi duoc backend. Hay kiem tra server Spring Boot." },
      { status: 502 },
    );
  }
}
