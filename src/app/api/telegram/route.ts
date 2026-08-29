import { proxyBackendResponse } from "@/lib/backend";

export async function GET(request: Request) {
  try {
    return await proxyBackendResponse("/api/telegram", request);
  } catch {
    return Response.json(
      { message: "Không kết nối được dịch vụ Telegram." },
      { status: 502 },
    );
  }
}
