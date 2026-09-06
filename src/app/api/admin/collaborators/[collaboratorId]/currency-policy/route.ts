import { proxyBackendResponse, requireAdminRequest } from "@/lib/backend";

export async function GET(request: Request, context: RouteContext<"/api/admin/collaborators/[collaboratorId]/currency-policy">) {
  const forbidden = await requireAdminRequest(request);
  if (forbidden) return forbidden;
  const { collaboratorId } = await context.params;
  return proxyBackendResponse(`/api/admin/collaborators/${encodeURIComponent(collaboratorId)}/currency-policy`, request);
}

export async function PUT(request: Request, context: RouteContext<"/api/admin/collaborators/[collaboratorId]/currency-policy">) {
  const forbidden = await requireAdminRequest(request);
  if (forbidden) return forbidden;
  const { collaboratorId } = await context.params;
  return proxyBackendResponse(`/api/admin/collaborators/${encodeURIComponent(collaboratorId)}/currency-policy`, request);
}
