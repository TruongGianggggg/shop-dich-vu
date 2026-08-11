import { proxyBackendResponse } from "@/lib/backend";

export async function GET(request: Request) {
  try {
    return await proxyBackendResponse("/api/currency-settings", request);
  } catch {
    return Response.json(
      { message: "Không kết nối được backend. Hãy kiểm tra server Spring Boot." },
      { status: 502 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    return await proxyBackendResponse("/api/currency-settings", request);
  } catch {
    return Response.json(
      { message: "Không kết nối được backend. Hãy kiểm tra server Spring Boot." },
      { status: 502 },
    );
  }
}
