import { proxyBackendResponse, requireAdminRequest } from "@/lib/backend";

export async function GET(request: Request) {
  const forbidden = requireAdminRequest(request);

  if (forbidden) {
    return forbidden;
  }

  try {
    return await proxyBackendResponse("/api/the9p/recharge-products", request);
  } catch {
    return Response.json(
      { message: "Không kết nối được backend để kiểm tra The9P." },
      { status: 502 },
    );
  }
}
