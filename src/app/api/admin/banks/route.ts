import { proxyBackendResponse } from "@/lib/backend";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    return await proxyBackendResponse(`/api/banks${url.search}`, request);
  } catch {
    return Response.json(
      { message: "Khong ket noi duoc backend. Hay kiem tra server Spring Boot." },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  try {
    return await proxyBackendResponse("/api/banks", request);
  } catch {
    return Response.json(
      { message: "Khong ket noi duoc backend. Hay kiem tra server Spring Boot." },
      { status: 502 },
    );
  }
}
