import { proxyBackendResponse, requireAdminRequest } from "@/lib/backend";

export async function PUT(
  request: Request,
  context: RouteContext<"/api/admin/collaborator-withdrawals/[withdrawalId]">,
) {
  try {
    const forbidden = await requireAdminRequest(request);
    if (forbidden) return forbidden;
    const { withdrawalId } = await context.params;
    return await proxyBackendResponse(
      `/api/admin/collaborator-withdrawals/${encodeURIComponent(withdrawalId)}`,
      request,
    );
  } catch {
    return Response.json({ message: "Không cập nhật được yêu cầu rút tiền." }, { status: 502 });
  }
}
