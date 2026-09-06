"use client";

import { useSyncExternalStore } from "react";
import { AUTH_STORAGE_KEY, AuthResponse } from "@/lib/shop-api";

const LEGACY_AUTH_COOKIE_NAME = "shop_game_auth";
const LEGACY_ACTIVITY_STORAGE_KEY = `${AUTH_STORAGE_KEY}:last-activity`;
let memorySession: AuthResponse | null = null;
let refreshPromise: Promise<AuthResponse | null> | null = null;
let sessionRevision = 0;
const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach((callback) => callback());
}

function clearLegacyClientSession() {
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_ACTIVITY_STORAGE_KEY);
  } catch {}

  try {
    document.cookie = `${LEGACY_AUTH_COOKIE_NAME}=; Max-Age=0; path=/`;
  } catch {}
}

function isAuthResponse(value: unknown): value is AuthResponse {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<AuthResponse>;

  return (
    typeof session.userId === "string" &&
    typeof session.username === "string" &&
    typeof session.email === "string" &&
    typeof session.adminAccessGranted === "boolean" &&
    typeof session.passwordChangeRequired === "boolean" &&
    (session.role === "USER" ||
      session.role === "COLLABORATOR" ||
      session.role === "ADMIN")
  );
}

async function fetchAuthSession() {
  const response = await fetch("/api/auth/me", { cache: "no-store" });
  const data = response.ok ? await response.json() : null;
  return isAuthResponse(data) ? data : null;
}

export function refreshAuthSession() {
  if (refreshPromise) return refreshPromise;

  const revision = sessionRevision;
  refreshPromise = fetchAuthSession()
    .then((session) => {
      // A login/logout may have happened while this request was in flight.
      // Never let that stale response overwrite the newer session state.
      if (revision !== sessionRevision) return memorySession;
      memorySession = session;
      clearLegacyClientSession();
      notifySubscribers();
      return memorySession;
    })
    .catch(() => {
      if (revision !== sessionRevision) return memorySession;
      memorySession = null;
      notifySubscribers();
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function verifyAuthSession() {
  const revision = ++sessionRevision;

  try {
    const session = await fetchAuthSession();
    if (revision !== sessionRevision) return memorySession;
    memorySession = session;
    clearLegacyClientSession();
    notifySubscribers();
    return session;
  } catch {
    if (revision !== sessionRevision) return memorySession;
    memorySession = null;
    notifySubscribers();
    return null;
  }
}

function subscribe(callback: () => void) {
  subscribers.add(callback);
  if (subscribers.size === 1) void refreshAuthSession();

  return () => {
    subscribers.delete(callback);
  };
}

export function saveAuthSession(session: AuthResponse) {
  sessionRevision += 1;
  memorySession = session;
  clearLegacyClientSession();
  notifySubscribers();
  return true;
}

export async function clearAuthSession() {
  sessionRevision += 1;
  memorySession = null;
  clearLegacyClientSession();
  notifySubscribers();
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {}
}

export function useAuthSession() {
  return useSyncExternalStore(subscribe, () => memorySession, () => null);
}
