import { proxyBackendResponse, requireAdminRequest } from "@/lib/backend";

export async function POST(request: Request) {
  const forbidden = requireAdminRequest(request);

  if (forbidden) {
    return forbidden;
  }

  try {
    return await proxyBackendResponse("/api/the9p/sync-packages", request);
  } catch {
    return Response.json(
      { message: "Không kết nối được backend để đồng bộ gói từ nhà cung cấp." },
      { status: 502 },
    );
  }
}
