import { proxyBackendResponse } from "@/lib/backend";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const subCategoryId = url.searchParams.get("subCategoryId");

    if (!subCategoryId) {
      return Response.json(
        { message: "subCategoryId is required to list service packages." },
        { status: 400 },
      );
    }

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

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { subCategoryId?: string };

    if (!payload.subCategoryId) {
      return Response.json(
        { message: "subCategoryId is required to create service package." },
        { status: 400 },
      );
    }

    return await proxyBackendResponse(
      `/api/service-sub-categories/${encodeURIComponent(
        payload.subCategoryId,
      )}/packages`,
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
