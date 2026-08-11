import { proxyBackendResponse } from "@/lib/backend";

function getBackendPath(configId: string) {
  return `/api/currency-servers/${encodeURIComponent(configId)}`;
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ configId: string }> },
) {
  try {
    const { configId } = await context.params;
    return await proxyBackendResponse(
      getBackendPath(configId),
      request,
    );
  } catch {
    return Response.json(
      { message: "Không kết nối được backend. Hãy kiểm tra server Spring Boot." },
      { status: 502 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ configId: string }> },
) {
  try {
    const { configId } = await context.params;
    return await proxyBackendResponse(
      getBackendPath(configId),
      request,
    );
  } catch {
    return Response.json(
      { message: "Không kết nối được backend. Hãy kiểm tra server Spring Boot." },
      { status: 502 },
    );
  }
}
