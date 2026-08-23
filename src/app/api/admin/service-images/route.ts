import { getBackendUrl, getRequestAuthToken } from "@/lib/backend";

export async function POST(request: Request) {
  try {
    const token = getRequestAuthToken(request);
    const contentType = request.headers.get("Content-Type");
    const headers = new Headers({ Accept: "application/json" });

    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (contentType) headers.set("Content-Type", contentType);

    const response = await fetch(getBackendUrl("/api/admin/service-images"), {
      method: "POST",
      headers,
      body: await request.arrayBuffer(),
      cache: "no-store",
    });

    return new Response(await response.arrayBuffer(), {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch {
    return Response.json(
      { message: "Không kết nối được backend để tải ảnh lên." },
      { status: 502 },
    );
  }
}
