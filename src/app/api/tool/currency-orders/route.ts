import { proxyBackendResponse } from "@/lib/backend";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    return await proxyBackendResponse(
      `/api/tool/currency-orders${url.search}`,
      request,
    );
  } catch {
    return new Response("Tool backend is unavailable", {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
