import { proxyBackendResponse } from "@/lib/backend";

export async function PUT(request: Request) {
  try {
    return await proxyBackendResponse("/api/admin/site-settings", request);
  } catch {
    return Response.json(
      { message: "Không lưu được cấu hình shop." },
      { status: 502 },
    );
  }
}
