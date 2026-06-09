import { proxyBackendJson } from "@/lib/backend";

export async function POST(request: Request) {
  try {
    return await proxyBackendJson("/api/auth/register", request);
  } catch {
    return Response.json(
      { message: "Dang ky that bai. Username hoac email co the da ton tai." },
      { status: 400 },
    );
  }
}
