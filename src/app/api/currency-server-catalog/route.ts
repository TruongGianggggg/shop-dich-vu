import { proxyBackendResponse } from "@/lib/backend";
export async function GET(request: Request) { return proxyBackendResponse("/api/currency-server-catalog", request); }
