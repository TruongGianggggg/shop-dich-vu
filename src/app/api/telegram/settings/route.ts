import { proxyBackendResponse } from "@/lib/backend";

export async function PUT(request: Request) {
  try {
    return await proxyBackendResponse("/api/telegram/settings", request);
  } catch {
    return Response.json(
      { message: "Không lưu được bộ lọc thông báo Telegram." },
      { status: 502 },
    );
  }
}
