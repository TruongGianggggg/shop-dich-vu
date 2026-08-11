import { proxyBackendResponse } from "@/lib/backend";

export async function POST(request: Request) {
  try {
    return await proxyBackendResponse("/api/currency-orders", request);
  } catch {
    return Response.json(
      { message: "Không kết nối được backend. Hãy kiểm tra server Spring Boot." },
      { status: 502 },
    );
  }
}
