import { proxyBackendResponse } from "@/lib/backend";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    return await proxyBackendResponse(
      `/api/admin/deposits/leaderboard/manual${url.search}`,
      request,
    );
  } catch {
    return Response.json(
      { message: "Không tải được danh sách top nạp thủ công." },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  try {
    return await proxyBackendResponse(
      "/api/admin/deposits/leaderboard/manual",
      request,
    );
  } catch {
    return Response.json(
      { message: "Không thêm được người vào top nạp." },
      { status: 502 },
    );
  }
}
