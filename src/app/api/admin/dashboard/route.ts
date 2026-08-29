import { proxyBackendResponse, requireAdminRequest } from "@/lib/backend";

export async function GET(request: Request) {
  try {
    const forbidden = await requireAdminRequest(request);
    if (forbidden) return forbidden;

    return await proxyBackendResponse("/api/admin/dashboard", request);
  } catch {
    return Response.json(
      { message: "Không kết nối được dữ liệu dashboard." },
      { status: 502 },
    );
  }
}
