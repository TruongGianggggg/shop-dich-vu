import { proxyBackendResponse, requireAdminRequest } from "@/lib/backend";

export async function GET(request: Request) {
  try {
    const forbidden = await requireAdminRequest(request);
    if (forbidden) return forbidden;
    const url = new URL(request.url);
    return await proxyBackendResponse(`/api/admin/collaborator-withdrawals${url.search}`, request);
  } catch {
    return Response.json({ message: "Không tải được yêu cầu rút tiền CTV." }, { status: 502 });
  }
}
