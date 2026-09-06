import { proxyBackendResponse } from "@/lib/backend";
export async function POST(request: Request) { return proxyBackendResponse("/api/collaborator-currency-orders", request); }
