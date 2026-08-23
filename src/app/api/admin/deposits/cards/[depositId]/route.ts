import { proxyBackendResponse, requireAdminRequest } from "@/lib/backend";

export async function GET(
  request: Request,
  context: { params: Promise<{ depositId: string }> },
) {
  try {
    const forbidden = await requireAdminRequest(request);
    if (forbidden) {
      return forbidden;
    }
    const { depositId } = await context.params;
    return await proxyBackendResponse(
      `/api/admin/deposits/cards/${encodeURIComponent(depositId)}`,
      request,
    );
  } catch {
    return Response.json(
      { message: "Không tải được chi tiết giao dịch card." },
      { status: 502 },
    );
  }
}
