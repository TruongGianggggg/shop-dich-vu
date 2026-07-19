import { getBackendUrl } from "@/lib/backend";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileName: string }> },
) {
  const { fileName } = await params;

  if (!/^[0-9a-f-]+\.(?:jpg|png|webp)$/i.test(fileName)) {
    return new Response(null, { status: 404 });
  }

  try {
    const response = await fetch(
      getBackendUrl(`/api/service-images/${encodeURIComponent(fileName)}`),
      { cache: "no-store" },
    );
    const headers = new Headers();
    const contentType = response.headers.get("Content-Type");

    if (contentType) headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "public, max-age=3600");

    return new Response(await response.arrayBuffer(), {
      status: response.status,
      headers,
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
