import { proxyBackendResponse, requireAdminRequest } from "@/lib/backend";

export async function GET(request: Request) {
  const forbidden = await requireAdminRequest(request);

  if (forbidden) {
    return forbidden;
  }

  try {
    return await proxyBackendResponse("/api/the9p/recharge-products", request);
  } catch {
    return Response.json(
      { message: "Không kết nối được backend để kiểm tra nhà cung cấp." },
      { status: 502 },
    );
  }
}
