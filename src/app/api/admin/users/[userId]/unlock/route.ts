import { proxyBackendResponse } from "@/lib/backend";
import { clearAdminOtpAccountLock } from "@/lib/admin-otp";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;

  try {
    const response = await proxyBackendResponse(
      `/api/admin/users/${encodeURIComponent(userId)}/unlock`,
      request,
    );
    if (response.ok) clearAdminOtpAccountLock(userId);
    return response;
  } catch {
    return Response.json(
      { message: "Không kết nối được backend. Hãy kiểm tra server Spring Boot." },
      { status: 502 },
    );
  }
}
