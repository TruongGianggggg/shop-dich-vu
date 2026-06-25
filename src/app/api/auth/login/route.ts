import { proxyBackendResponse } from "@/lib/backend";

export async function POST(request: Request) {
  try {
    return await proxyBackendResponse("/api/auth/login", request);
  } catch {
    return Response.json(
      { message: "Khong ket noi duoc backend. Hay kiem tra server Spring Boot." },
      { status: 502 },
    );
  }
}
