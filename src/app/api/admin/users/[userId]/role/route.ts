import { proxyBackendResponse } from "@/lib/backend";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;

  try {
    return await proxyBackendResponse(
      `/api/admin/users/${encodeURIComponent(userId)}/role`,
      request,
    );
  } catch {
    return Response.json(
      { message: "Khong ket noi duoc backend. Hay kiem tra server Spring Boot." },
      { status: 502 },
    );
  }
}
