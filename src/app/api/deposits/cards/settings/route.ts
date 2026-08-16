import { proxyBackendResponse } from "@/lib/backend";

export async function GET(request: Request) {
  try {
    return await proxyBackendResponse("/api/deposits/cards/settings", request);
  } catch {
    return Response.json(
      { message: "Không kết nối được backend cấu hình nạp thẻ." },
      { status: 502 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    return await proxyBackendResponse("/api/deposits/cards/settings", request);
  } catch {
    return Response.json(
      { message: "Không kết nối được backend cấu hình nạp thẻ." },
      { status: 502 },
    );
  }
}
