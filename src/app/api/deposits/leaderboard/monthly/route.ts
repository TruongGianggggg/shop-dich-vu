import { proxyBackendResponse } from "@/lib/backend";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    return await proxyBackendResponse(
      `/api/deposits/leaderboard/monthly${url.search}`,
      request,
    );
  } catch {
    return Response.json(
      { message: "Không tải được bảng top nạp tháng." },
      { status: 502 },
    );
  }
}
