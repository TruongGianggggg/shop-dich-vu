"use client";

import { useSyncExternalStore } from "react";
import { AUTH_STORAGE_KEY, AuthResponse } from "@/lib/shop-api";

const AUTH_EVENT_NAME = "shop-game-auth-change";
const AUTH_COOKIE_NAME = "shop_game_auth";
const AUTH_ACTIVITY_STORAGE_KEY = `${AUTH_STORAGE_KEY}:last-activity`;
const AUTH_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
const AUTH_ACTIVITY_WRITE_INTERVAL_MS = 15 * 1000;
let memorySession: AuthResponse | null = null;
let memoryLastActivityAt = 0;
let cachedSessionKey = "";
let cachedSession: AuthResponse | null = null;
let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
const subscribers = new Set<() => void>();

function getBrowserStorage() {
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

function getCookieSessionRaw() {
  try {
    const cookie =
      document.cookie
        .split("; ")
        .find((item) => item.startsWith(`${AUTH_COOKIE_NAME}=`)) ?? "";

    return cookie ? cookie.split("=").slice(1).join("=") : "";
  } catch {
    return "";
  }
}

function parseSession(raw: string, key: string) {
  if (!raw) {
    cachedSessionKey = "";
    cachedSession = null;
    return null;
  }

  if (cachedSessionKey === key) {
    return cachedSession;
  }

  try {
    const session = JSON.parse(decodeURIComponent(raw)) as AuthResponse;

    if (isExpiredSession(session)) {
      cachedSessionKey = "";
      cachedSession = null;
      return null;
    }

    cachedSession = session;
    cachedSessionKey = key;
    return cachedSession;
  } catch {
    cachedSessionKey = "";
    cachedSession = null;
    return null;
  }
}

function isExpiredSession(session: AuthResponse) {
  const [, encodedPayload] = session.token.split(".");

  if (!encodedPayload) {
    return true;
  }

  try {
    const normalizedPayload = encodedPayload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(encodedPayload.length / 4) * 4, "=");
    const payload = JSON.parse(atob(normalizedPayload)) as { exp?: unknown };

    return typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

function getSessionIssuedAt(session: AuthResponse) {
  const [, encodedPayload] = session.token.split(".");

  if (!encodedPayload) return 0;

  try {
    const normalizedPayload = encodedPayload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(encodedPayload.length / 4) * 4, "=");
    const payload = JSON.parse(atob(normalizedPayload)) as { iat?: unknown };

    return typeof payload.iat === "number" ? payload.iat * 1000 : 0;
  } catch {
    return 0;
  }
}

function writeCookieSession(session: AuthResponse) {
  try {
    document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(
      JSON.stringify(session),
    )}; path=/; max-age=${session.expiresIn}`;
  } catch {}
}

function readSessionIgnoringInactivity() {
  if (typeof window === "undefined") {
    return null;
  }

  const storage = getBrowserStorage();
  const stored = storage?.getItem(AUTH_STORAGE_KEY);

  if (stored) {
    return parseSession(encodeURIComponent(stored), `storage:${stored}`);
  }

  const cookieRaw = getCookieSessionRaw();

  if (cookieRaw) {
    return parseSession(cookieRaw, `cookie:${cookieRaw}`);
  }

  return memorySession;
}

function readLastActivityAt(session = readSessionIgnoringInactivity()) {
  const stored = getBrowserStorage()?.getItem(AUTH_ACTIVITY_STORAGE_KEY);
  const parsed = Number(stored);

  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  if (memoryLastActivityAt > 0) return memoryLastActivityAt;

  return session ? getSessionIssuedAt(session) : 0;
}

function isInactive(now = Date.now()) {
  const session = readSessionIgnoringInactivity();
  const lastActivityAt = readLastActivityAt(session);

  return lastActivityAt > 0 && now - lastActivityAt >= AUTH_INACTIVITY_TIMEOUT_MS;
}

function readSession() {
  const session = readSessionIgnoringInactivity();

  return session && !isInactive() ? session : null;
}

function notifySubscribers() {
  subscribers.forEach((callback) => callback());
}

function writeLastActivityAt(timestamp: number) {
  memoryLastActivityAt = timestamp;
  getBrowserStorage()?.setItem(AUTH_ACTIVITY_STORAGE_KEY, String(timestamp));
}

function clearInactivityTimer() {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
}

function scheduleInactivityExpiry() {
  clearInactivityTimer();

  const session = readSessionIgnoringInactivity();
  if (!session) return;

  const lastActivityAt = readLastActivityAt(session);
  if (!lastActivityAt) {
    writeLastActivityAt(Date.now());
    inactivityTimer = setTimeout(expireInactiveSession, AUTH_INACTIVITY_TIMEOUT_MS);
    return;
  }

  const remaining = AUTH_INACTIVITY_TIMEOUT_MS - (Date.now() - lastActivityAt);
  if (remaining <= 0) {
    expireInactiveSession();
    return;
  }

  inactivityTimer = setTimeout(expireInactiveSession, remaining);
}

function expireInactiveSession() {
  if (!readSessionIgnoringInactivity()) return;

  clearAuthSession();
  if (window.location.pathname !== "/") {
    window.location.replace("/");
  }
}

function recordActivity() {
  if (!readSessionIgnoringInactivity()) return;
  if (isInactive()) {
    expireInactiveSession();
    return;
  }

  const now = Date.now();
  if (now - readLastActivityAt() < AUTH_ACTIVITY_WRITE_INTERVAL_MS) return;

  writeLastActivityAt(now);
  scheduleInactivityExpiry();
}

function handleVisibilityChange() {
  if (document.visibilityState === "visible") recordActivity();
}

function handleStorageChange(event: StorageEvent) {
  if (event.key === AUTH_STORAGE_KEY && !event.newValue) {
    memorySession = null;
    cachedSession = null;
    cachedSessionKey = "";
  }
  if (event.key === AUTH_ACTIVITY_STORAGE_KEY && !event.newValue) {
    memoryLastActivityAt = 0;
  }

  if (
    event.key === AUTH_STORAGE_KEY ||
    event.key === AUTH_ACTIVITY_STORAGE_KEY ||
    event.key === null
  ) {
    notifySubscribers();
    scheduleInactivityExpiry();
  }
}

function handleAuthChange() {
  notifySubscribers();
  scheduleInactivityExpiry();
}

function startInactivityMonitor() {
  window.addEventListener("storage", handleStorageChange);
  window.addEventListener(AUTH_EVENT_NAME, handleAuthChange);
  window.addEventListener("keydown", recordActivity);
  window.addEventListener("pointerdown", recordActivity, { passive: true });
  window.addEventListener("pointermove", recordActivity, { passive: true });
  window.addEventListener("scroll", recordActivity, { passive: true });
  window.addEventListener("touchstart", recordActivity, { passive: true });
  document.addEventListener("visibilitychange", handleVisibilityChange);
  scheduleInactivityExpiry();
}

function stopInactivityMonitor() {
  clearInactivityTimer();
  window.removeEventListener("storage", handleStorageChange);
  window.removeEventListener(AUTH_EVENT_NAME, handleAuthChange);
  window.removeEventListener("keydown", recordActivity);
  window.removeEventListener("pointerdown", recordActivity);
  window.removeEventListener("pointermove", recordActivity);
  window.removeEventListener("scroll", recordActivity);
  window.removeEventListener("touchstart", recordActivity);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
}

function subscribe(callback: () => void) {
  subscribers.add(callback);
  if (subscribers.size === 1) startInactivityMonitor();

  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0) stopInactivityMonitor();
  };
}

export function emitAuthSessionChange() {
  window.dispatchEvent(new Event(AUTH_EVENT_NAME));
}

export function saveAuthSession(session: AuthResponse) {
  memorySession = session;
  cachedSession = session;
  cachedSessionKey = `memory:${session.token}`;
  getBrowserStorage()?.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  writeLastActivityAt(Date.now());
  writeCookieSession(session);
  emitAuthSessionChange();
  return true;
}

export function clearAuthSession() {
  memorySession = null;
  cachedSession = null;
  cachedSessionKey = "";
  memoryLastActivityAt = 0;
  getBrowserStorage()?.removeItem(AUTH_STORAGE_KEY);
  getBrowserStorage()?.removeItem(AUTH_ACTIVITY_STORAGE_KEY);
  try {
    document.cookie = `${AUTH_COOKIE_NAME}=; Max-Age=0; path=/`;
  } catch {}

  emitAuthSessionChange();
}

export function useAuthSession() {
  return useSyncExternalStore(subscribe, readSession, () => null);
}
