import { proxyBackendResponse } from "@/lib/backend";

export async function PUT(request: Request, context: RouteContext<"/api/admin/collaborator-currency-servers/[configId]/active">) {
  const { configId } = await context.params;
  try {
    return await proxyBackendResponse(`/api/admin/collaborator-currency-servers/${encodeURIComponent(configId)}/active`, request);
  } catch {
    return Response.json({ message: "Không kết nối được backend." }, { status: 502 });
  }
}
