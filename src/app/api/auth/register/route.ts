import { createAuthSessionResponse } from "@/lib/auth-route";

export async function POST(request: Request) {
  try {
    return await createAuthSessionResponse("/api/auth/register", request);
  } catch {
    return Response.json(
      { message: "Dang ky that bai. Username hoac email co the da ton tai." },
      { status: 400 },
    );
  }
}
