import { proxyBackendResponse } from "@/lib/backend";

export async function GET(request: Request) {
  try {
    return await proxyBackendResponse("/api/site-settings", request);
  } catch {
    return Response.json(
      { message: "Không kết nối được backend cấu hình shop." },
      { status: 502 },
    );
  }
}
