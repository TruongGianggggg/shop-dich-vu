import { proxyBackendResponse, requireCollaboratorRequest } from "@/lib/backend";

export async function GET(request: Request) {
  try {
    const forbidden = await requireCollaboratorRequest(request);
    if (forbidden) return forbidden;
    return await proxyBackendResponse("/api/collaborators/service-orders/available", request);
  } catch {
    return Response.json({ message: "Không kết nối được backend." }, { status: 502 });
  }
}
