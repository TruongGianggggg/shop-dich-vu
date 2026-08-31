import { proxyBackendResponse } from "@/lib/backend";

type Context = { params: Promise<{ segments?: string[] }> };

async function forward(request: Request, context: Context) {
  try {
    const { segments = [] } = await context.params;
    const url = new URL(request.url);
    const suffix = segments.length ? `/${segments.map(encodeURIComponent).join("/")}` : "";
    return await proxyBackendResponse(`/api/admin/vps${suffix}${url.search}`, request);
  } catch {
    return Response.json(
      { message: "Không kết nối được backend VPS." },
      { status: 502 },
    );
  }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
