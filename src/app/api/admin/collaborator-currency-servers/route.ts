import { proxyBackendResponse } from "@/lib/backend";

export async function GET(request: Request) {
  try {
    return await proxyBackendResponse("/api/admin/collaborator-currency-servers", request);
  } catch {
    return Response.json(
      { message: "Không kết nối được backend. Hãy kiểm tra server Spring Boot." },
      { status: 502 },
    );
  }
}
