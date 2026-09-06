import { proxyBackendResponse, requireCollaboratorRequest } from "@/lib/backend";

export async function GET(request: Request) {
  const forbidden = await requireCollaboratorRequest(request); if (forbidden) return forbidden;
  return proxyBackendResponse("/api/collaborators/currency-servers", request);
}
export async function POST(request: Request) {
  const forbidden = await requireCollaboratorRequest(request); if (forbidden) return forbidden;
  return proxyBackendResponse("/api/collaborators/currency-servers", request);
}
