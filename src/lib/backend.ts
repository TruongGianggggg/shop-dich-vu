import "server-only";

import {
  ADMIN_ACCESS_COOKIE_NAME,
  isAdminAccessGranted,
} from "@/lib/admin-otp";
import { AUTH_TOKEN_COOKIE_NAME } from "@/lib/auth-cookie";
import { AuthResponse, UserRole } from "@/lib/shop-api";

const backendBaseUrl =
  process.env.SHOP_GAME_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080";

const authenticatedSessionCache = new WeakMap<
  Request,
  Promise<AuthResponse | null>
>();

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
  options?: { accept?: string; body?: string },
) {
  if (isAdminFrontendRequest(request)) {
    const forbidden = await requireAdminRequest(request);
    if (forbidden) return forbidden;
  }

  const headers = new Headers();
  const contentType = request.headers.get("Content-Type");
  const token = getRequestAuthToken(request);

  headers.set("Accept", options?.accept ?? "application/json");

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  appendClientRequestHeaders(headers, request);

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

export function appendClientRequestHeaders(headers: Headers, request: Request) {
  const userAgent = request.headers.get("User-Agent");
  const clientIp = resolveClientIp(request);

  if (userAgent) {
    headers.set("User-Agent", userAgent);
  }

  if (clientIp) {
    headers.set("X-Real-IP", clientIp);
    headers.set("X-Forwarded-For", clientIp);
  }
}

function resolveClientIp(request: Request) {
  const realIp = request.headers.get("X-Real-IP")?.trim();
  if (realIp) {
    return realIp;
  }

  const forwardedFor = request.headers.get("X-Forwarded-For");
  if (!forwardedFor) {
    return null;
  }

  const addresses = forwardedFor
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);

  return addresses.at(-1) ?? null;
}

export async function proxyBackendJson(path: string, request: Request) {
  return proxyBackendResponse(path, request);
}

export async function requireAdminRequest(request: Request) {
  const session = await getAuthenticatedBackendSession(request);

  if (
    session?.role === "ADMIN" &&
    isAdminAccessGranted(
      getCookieValue(request, ADMIN_ACCESS_COOKIE_NAME) ?? undefined,
      session.userId,
    )
  ) {
    return null;
  }

  return Response.json(
    {
      code:
        session?.role === "ADMIN" ? "ADMIN_OTP_REQUIRED" : "ADMIN_REQUIRED",
      message:
        session?.role === "ADMIN"
          ? "Vui lòng xác minh mã bảo mật Admin."
          : "Admin permission is required.",
    },
    { status: session ? 403 : 401 },
  );
}

export async function requireCollaboratorRequest(request: Request) {
  const session = await getAuthenticatedBackendSession(request);

  if (session?.role === "COLLABORATOR") {
    return null;
  }

  return Response.json(
    { message: "Collaborator permission is required." },
    { status: session ? 403 : 401 },
  );
}

export async function getAuthenticatedBackendSession(request: Request) {
  const cachedSession = authenticatedSessionCache.get(request);
  if (cachedSession) return cachedSession;

  const sessionPromise = loadAuthenticatedBackendSession(request);
  authenticatedSessionCache.set(request, sessionPromise);
  return sessionPromise;
}

async function loadAuthenticatedBackendSession(request: Request) {
  const token = getRequestAuthToken(request);

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(getBackendUrl("/api/auth/me"), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!response.ok) return null;
    const session = (await response.json()) as AuthResponse;
    return isUserRole(session.role) ? session : null;
  } catch {
    return null;
  }
}

export function getRequestAuthToken(request: Request) {
  const cookieToken = getCookieValue(request, AUTH_TOKEN_COOKIE_NAME);

  if (cookieToken) return cookieToken;

  return request.headers
    .get("Authorization")
    ?.replace(/^Bearer\s+/i, "") || null;
}

function getCookieValue(request: Request, name: string) {
  const rawValue = (request.headers.get("Cookie") ?? "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);

  return rawValue ? decodeURIComponent(rawValue) : null;
}

function isAdminFrontendRequest(request: Request) {
  try {
    return new URL(request.url).pathname.startsWith("/api/admin/");
  } catch {
    return false;
  }
}

function isUserRole(value: unknown): value is UserRole {
  return value === "USER" || value === "COLLABORATOR" || value === "ADMIN";
}
