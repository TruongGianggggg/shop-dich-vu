import { proxyBackendResponse } from "@/lib/backend";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ subCategoryId: string }> },
) {
  const { subCategoryId } = await params;

  try {
    return await proxyBackendResponse(
      `/api/service-sub-categories/${encodeURIComponent(
        subCategoryId,
      )}/packages`,
      request,
    );
  } catch {
    return Response.json(
      { message: "Khong ket noi duoc backend. Hay kiem tra server Spring Boot." },
      { status: 502 },
    );
  }
}
