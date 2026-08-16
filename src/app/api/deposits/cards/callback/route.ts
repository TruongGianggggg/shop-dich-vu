import { proxyBackendResponse } from "@/lib/backend";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    return await proxyBackendResponse(
      `/api/deposits/cards/callback${url.search}`,
      request,
    );
  } catch {
    return Response.json(
      { message: "Không kết nối được backend callback nạp thẻ." },
      { status: 502 },
    );
  }
}
