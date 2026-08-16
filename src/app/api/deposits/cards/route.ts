import { proxyBackendResponse } from "@/lib/backend";

export async function POST(request: Request) {
  try {
    return await proxyBackendResponse("/api/deposits/cards", request);
  } catch {
    return Response.json(
      { message: "Không kết nối được backend nạp thẻ." },
      { status: 502 },
    );
  }
}
