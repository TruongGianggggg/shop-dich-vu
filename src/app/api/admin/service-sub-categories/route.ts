import { proxyBackendResponse } from "@/lib/backend";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parentId = url.searchParams.get("parentId");

    if (parentId) {
      return await proxyBackendResponse(
        `/api/service-categories/${encodeURIComponent(parentId)}`,
        request,
      );
    }

    return await proxyBackendResponse(
      `/api/service-categories${url.search}`,
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
    const payload = (await request.json()) as { parentId?: string };

    if (!payload.parentId) {
      return Response.json(
        { message: "parentId is required to create service sub-category." },
        { status: 400 },
      );
    }

    return await proxyBackendResponse(
      `/api/service-categories/${encodeURIComponent(payload.parentId)}/children`,
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
