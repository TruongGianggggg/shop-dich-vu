"use client";

import { Bell, X } from "lucide-react";
import { useEffect, useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "storefront-announcement-dismissed";
const STORAGE_EVENT = "storefront-announcement-change";
let memoryDismissedVersion: string | null = null;

function subscribeToDismissal(callback: () => void) {
  window.addEventListener(STORAGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(STORAGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getDismissedVersion() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) ?? memoryDismissedVersion;
  } catch {
    return memoryDismissedVersion;
  }
}

export function StorefrontAnnouncement({
  content,
  enabled,
  title,
}: {
  content: string;
  enabled: boolean;
  title: string;
}) {
  const normalizedTitle = title?.trim() || "Thông báo mới";
  const normalizedContent = content?.trim() || "";
  const version = useMemo(
    () => JSON.stringify([normalizedTitle, normalizedContent]),
    [normalizedContent, normalizedTitle],
  );
  const dismissedVersion = useSyncExternalStore(
    subscribeToDismissal,
    getDismissedVersion,
    () => null,
  );
  const isOpen = enabled && Boolean(normalizedContent) && dismissedVersion !== version;

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      memoryDismissedVersion = version;
      try {
        sessionStorage.setItem(STORAGE_KEY, version);
      } catch {
        // The popup can still be closed when browser storage is unavailable.
      }
      window.dispatchEvent(new Event(STORAGE_EVENT));
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, version]);

  function dismiss() {
    memoryDismissedVersion = version;
    try {
      sessionStorage.setItem(STORAGE_KEY, version);
    } catch {
      // The popup can still be closed when browser storage is unavailable.
    }
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }

  if (!isOpen) return null;

  return (
    <div
      aria-label="Thông báo của shop"
      aria-modal="true"
      className="storefront-announcement-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
      role="dialog"
    >
      <section className="storefront-announcement-card">
        <button
          aria-label="Đóng thông báo"
          className="storefront-announcement-close"
          onClick={dismiss}
          type="button"
        >
          <X aria-hidden="true" size={19} />
        </button>
        <div className="storefront-announcement-title">
          <Bell aria-hidden="true" size={20} />
          <h2>{normalizedTitle}</h2>
          <Bell aria-hidden="true" size={20} />
        </div>
        <p>{normalizedContent}</p>
        <button className="storefront-announcement-confirm" onClick={dismiss} type="button">
          Đã hiểu
        </button>
      </section>
    </div>
  );
}
