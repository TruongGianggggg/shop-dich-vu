import { proxyBackendResponse, requireCollaboratorRequest } from "@/lib/backend";

function path(id: string) { return `/api/collaborators/currency-servers/${encodeURIComponent(id)}`; }
export async function PUT(request: Request, context: RouteContext<"/api/collaborators/currency-servers/[configId]">) {
  const forbidden = await requireCollaboratorRequest(request); if (forbidden) return forbidden;
  const { configId } = await context.params; return proxyBackendResponse(path(configId), request);
}
export async function DELETE(request: Request, context: RouteContext<"/api/collaborators/currency-servers/[configId]">) {
  const forbidden = await requireCollaboratorRequest(request); if (forbidden) return forbidden;
  const { configId } = await context.params; return proxyBackendResponse(path(configId), request);
}
