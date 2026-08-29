"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";

const TURNSTILE_SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  remove(widgetId: string): void;
  render(
    container: HTMLElement,
    options: {
      action: string;
      callback(token: string): void;
      "error-callback"(): void;
      "expired-callback"(): void;
      sitekey: string;
      theme: "auto";
    },
  ): string;
  reset(widgetId: string): void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type TurnstileWidgetProps = {
  action: "login" | "register";
  onTokenChange(token: string): void;
  resetKey: number;
  siteKey: string;
};

export function TurnstileWidget({
  action,
  onTokenChange,
  resetKey,
  siteKey,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || widgetIdRef.current) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      action,
      callback: onTokenChange,
      "error-callback": () => onTokenChange(""),
      "expired-callback": () => onTokenChange(""),
      sitekey: siteKey,
      theme: "auto",
    });
  }, [action, onTokenChange, siteKey]);

  useEffect(() => {
    renderWidget();
  }, [renderWidget]);

  useEffect(() => {
    const widgetId = widgetIdRef.current;
    if (resetKey > 0 && widgetId && window.turnstile) {
      window.turnstile.reset(widgetId);
      onTokenChange("");
    }
  }, [onTokenChange, resetKey]);

  useEffect(() => {
    return () => {
      const widgetId = widgetIdRef.current;
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
      widgetIdRef.current = null;
    };
  }, []);

  return (
    <div className="login-turnstile">
      <Script
        id="cloudflare-turnstile"
        onReady={renderWidget}
        src={TURNSTILE_SCRIPT_URL}
        strategy="afterInteractive"
      />
      <div ref={containerRef} />
    </div>
  );
}
