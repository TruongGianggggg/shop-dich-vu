import { proxyBackendResponse } from "@/lib/backend";

export async function POST(request: Request) {
  try {
    return await proxyBackendResponse("/api/telegram/link", request);
  } catch {
    return Response.json(
      { message: "Không tạo được liên kết Telegram." },
      { status: 502 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    return await proxyBackendResponse("/api/telegram/link", request);
  } catch {
    return Response.json(
      { message: "Không hủy được liên kết Telegram." },
      { status: 502 },
    );
  }
}
