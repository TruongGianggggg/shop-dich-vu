"use client";

import { useSyncExternalStore } from "react";
import { AUTH_STORAGE_KEY, AuthResponse } from "@/lib/shop-api";

const AUTH_EVENT_NAME = "shop-game-auth-change";
const AUTH_COOKIE_NAME = "shop_game_auth";
let memorySession: AuthResponse | null = null;
let cachedSessionKey = "";
let cachedSession: AuthResponse | null = null;

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
    cachedSession = JSON.parse(decodeURIComponent(raw)) as AuthResponse;
    cachedSessionKey = key;
    return cachedSession;
  } catch {
    cachedSessionKey = "";
    cachedSession = null;
    return null;
  }
}

function writeCookieSession(session: AuthResponse) {
  try {
    document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(
      JSON.stringify(session),
    )}; path=/; max-age=${session.expiresIn}`;
  } catch {}
}

function readSession() {
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

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(AUTH_EVENT_NAME, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(AUTH_EVENT_NAME, callback);
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
  writeCookieSession(session);
  emitAuthSessionChange();
  return true;
}

export function clearAuthSession() {
  memorySession = null;
  cachedSession = null;
  cachedSessionKey = "";
  getBrowserStorage()?.removeItem(AUTH_STORAGE_KEY);
  try {
    document.cookie = `${AUTH_COOKIE_NAME}=; Max-Age=0; path=/`;
  } catch {}

  emitAuthSessionChange();
}

export function useAuthSession() {
  return useSyncExternalStore(subscribe, readSession, () => null);
}
