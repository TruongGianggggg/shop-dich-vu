import { proxyBackendResponse } from "@/lib/backend";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    return await proxyBackendResponse(
      `/api/admin/users/${encodeURIComponent(userId)}/permissions`,
      request,
    );
  } catch {
    return Response.json(
      { message: "Không kết nối được backend để lưu phân quyền." },
      { status: 502 },
    );
  }
}
