import { getBackendUrl, getRequestAuthToken } from "@/lib/backend";

export async function POST(request: Request) {
  try {
    const headers = new Headers({ Accept: "application/json" });
    const token = getRequestAuthToken(request);
    const contentType = request.headers.get("Content-Type");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (contentType) headers.set("Content-Type", contentType);

    const response = await fetch(
      getBackendUrl("/api/admin/site-settings/images"),
      {
        method: "POST",
        headers,
        body: await request.arrayBuffer(),
        cache: "no-store",
      },
    );

    return new Response(await response.arrayBuffer(), {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch {
    return Response.json(
      { message: "Không tải được ảnh cấu hình shop." },
      { status: 502 },
    );
  }
}
