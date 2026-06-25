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

export async function proxyBackendResponse(
  path: string,
  request: Request,
  options?: { body?: string },
) {
  const headers = new Headers();
  const contentType = request.headers.get("Content-Type");
  const authorization = request.headers.get("Authorization");

  headers.set("Accept", "application/json");

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  if (authorization) {
    headers.set("Authorization", authorization);
  }

  const method = request.method.toUpperCase();
  const requestBody =
    method === "GET" || method === "HEAD"
      ? undefined
      : options?.body ?? (await request.text());
  const response = await fetch(getBackendUrl(path), {
    method,
    body: requestBody,
    headers,
    cache: "no-store",
  });
  const responseBody = await response.text();
  const responseHeaders = new Headers();
  const responseContentType = response.headers.get("Content-Type");

  if (responseContentType) {
    responseHeaders.set("Content-Type", responseContentType);
  }

  return new Response(responseBody, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export async function proxyBackendJson(path: string, request: Request) {
  return proxyBackendResponse(path, request);
}

export function requireAdminRequest(request: Request) {
  if (getJwtRole(request) === "ADMIN") {
    return null;
  }

  return Response.json(
    { message: "Admin permission is required." },
    { status: 403 },
  );
}

function getJwtRole(request: Request) {
  const authorization = request.headers.get("Authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return null;
  }

  const [, payload] = token.split(".");

  if (!payload) {
    return null;
  }

  try {
    const decoded = decodeBase64Url(payload);
    const data = JSON.parse(decoded) as { role?: unknown };

    return typeof data.role === "string" ? data.role : null;
  } catch {
    return null;
  }
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  return Buffer.from(padded, "base64").toString("utf8");
}
