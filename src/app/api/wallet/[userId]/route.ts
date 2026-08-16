import { proxyBackendResponse } from "@/lib/backend";

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await context.params;
    return await proxyBackendResponse(
      `/api/wallet/${encodeURIComponent(userId)}`,
      request,
    );
  } catch {
    return Response.json(
      { message: "Không kết nối được backend shop-game." },
      { status: 502 },
    );
  }
}
