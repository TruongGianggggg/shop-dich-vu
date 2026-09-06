import { proxyBackendResponse } from "@/lib/backend";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    return await proxyBackendResponse(`/api/collaborators/withdrawals${url.search}`, request);
  } catch {
    return Response.json({ message: "Không tải được lịch sử rút tiền." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    return await proxyBackendResponse("/api/collaborators/withdrawals", request);
  } catch {
    return Response.json({ message: "Không tạo được yêu cầu rút tiền." }, { status: 502 });
  }
}
