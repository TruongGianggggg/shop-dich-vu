import { proxyBackendResponse } from "@/lib/backend";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;

  try {
    return await proxyBackendResponse(
      `/api/admin/users/${encodeURIComponent(userId)}/agency-level`,
      request,
    );
  } catch {
    return Response.json(
      { message: "Không kết nối được backend để cập nhật cấp đại lý." },
      { status: 502 },
    );
  }
}
