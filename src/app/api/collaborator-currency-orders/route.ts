import { proxyBackendResponse } from "@/lib/backend";
export async function POST(request: Request) { return proxyBackendResponse("/api/collaborator-currency-orders", request); }
export async function GET(request: Request) {
  const url = new URL(request.url);
  return proxyBackendResponse(`/api/collaborator-currency-orders${url.search}`, request);
}
