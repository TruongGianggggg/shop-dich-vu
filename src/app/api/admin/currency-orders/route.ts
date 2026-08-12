import { proxyBackendResponse, requireAdminRequest } from "@/lib/backend";

export async function GET(request: Request) {
  try {
    const forbidden = requireAdminRequest(request);
    if (forbidden) return forbidden;
    const url = new URL(request.url);
    return await proxyBackendResponse(`/api/admin/currency-orders${url.search}`, request);
  } catch {
    return Response.json({ message: "Không kết nối được backend." }, { status: 502 });
  }
}
