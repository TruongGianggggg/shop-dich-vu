import { proxyBackendResponse, requireAdminRequest } from "@/lib/backend";

export async function GET(request: Request) {
  try {
    const forbidden = await requireAdminRequest(request);
    if (forbidden) return forbidden;

    const url = new URL(request.url);
    return await proxyBackendResponse(
      `/api/admin/activity-logs${url.search}`,
      request,
    );
  } catch {
    return Response.json(
      { message: "Không kết nối được backend. Hãy kiểm tra server Spring Boot." },
      { status: 502 },
    );
  }
}
