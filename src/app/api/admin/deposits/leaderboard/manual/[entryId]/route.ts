import { proxyBackendResponse } from "@/lib/backend";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ entryId: string }> },
) {
  try {
    const { entryId } = await params;
    return await proxyBackendResponse(
      `/api/admin/deposits/leaderboard/manual/${encodeURIComponent(entryId)}`,
      request,
    );
  } catch {
    return Response.json(
      { message: "Không sửa được người trong top nạp." },
      { status: 502 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ entryId: string }> },
) {
  try {
    const { entryId } = await params;
    return await proxyBackendResponse(
      `/api/admin/deposits/leaderboard/manual/${encodeURIComponent(entryId)}`,
      request,
    );
  } catch {
    return Response.json(
      { message: "Không xoá được người khỏi top nạp." },
      { status: 502 },
    );
  }
}
