import { proxyBackendResponse } from "@/lib/backend";

export async function POST(
  request: Request,
  context: RouteContext<"/api/bangiftcode/callback/[secret]">,
) {
  try {
    const { secret } = await context.params;
    return await proxyBackendResponse(
      `/api/bangiftcode/callback/${encodeURIComponent(secret)}`,
      request,
    );
  } catch {
    return Response.json(
      { message: "Không kết nối được backend nhận callback Bangiftcode." },
      { status: 502 },
    );
  }
}
