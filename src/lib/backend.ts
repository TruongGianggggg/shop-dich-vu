import "server-only";

const backendBaseUrl =
  process.env.SHOP_GAME_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080";

export function getBackendUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${backendBaseUrl.replace(/\/$/, "")}${normalizedPath}`;
}

export async function fetchBackendJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(getBackendUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Backend returned ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function proxyBackendJson(path: string, request: Request) {
  const body = await request.text();
  const response = await fetchBackendJson<unknown>(path, {
    method: request.method,
    body,
    headers: {
      "Content-Type": request.headers.get("Content-Type") ?? "application/json",
    },
  });

  return Response.json(response);
}
