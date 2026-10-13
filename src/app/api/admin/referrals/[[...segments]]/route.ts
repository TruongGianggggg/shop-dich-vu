import { proxyBackendResponse } from "@/lib/backend";

async function proxy(request: Request, context: RouteContext<"/api/admin/referrals/[[...segments]]">) {
  const { segments = [] } = await context.params;
  const url = new URL(request.url);
  try {
    return await proxyBackendResponse(`/api/admin/referrals/${segments.map(encodeURIComponent).join("/")}${url.search}`, request);
  } catch {
    return Response.json({ message: "Không kết nối được quản lý giới thiệu." }, { status: 502 });
  }
}

export const GET = proxy;
export const PUT = proxy;
