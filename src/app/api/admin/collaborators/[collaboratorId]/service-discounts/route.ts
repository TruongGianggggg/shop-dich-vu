import { proxyBackendResponse } from "@/lib/backend";

type RouteContext = { params: Promise<{ collaboratorId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { collaboratorId } = await context.params;
    return await proxyBackendResponse(
      `/api/collaborators/${encodeURIComponent(collaboratorId)}/service-discounts`,
      request,
    );
  } catch {
    return Response.json(
      { message: "Không tải được cấu hình dịch vụ cộng tác viên." },
      { status: 502 },
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { collaboratorId } = await context.params;
    return await proxyBackendResponse(
      `/api/collaborators/${encodeURIComponent(collaboratorId)}/service-discounts`,
      request,
    );
  } catch {
    return Response.json(
      { message: "Không lưu được cấu hình dịch vụ cộng tác viên." },
      { status: 502 },
    );
  }
}
