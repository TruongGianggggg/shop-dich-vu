import { proxyBackendResponse } from "@/lib/backend";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    return await proxyBackendResponse(`/api/agency/commissions${url.search}`, request);
  } catch {
    return Response.json(
      { message: "Không kết nối được lịch sử hoa hồng." },
      { status: 502 },
    );
  }
}
