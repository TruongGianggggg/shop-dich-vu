"use client";

import { useCallback, useEffect, useState } from "react";
import { ReferralSummary } from "@/lib/shop-api";
import { useAuthSession } from "./use-auth-session";

export function useReferralBalance(enabled: boolean) {
  const session = useAuthSession();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async (showLoading = true) => {
    if (!enabled || !session) return;
    if (showLoading) setIsLoading(true);

    try {
      const response = await fetch("/api/referrals/me", { cache: "no-store" });
      const data = await readResponseJson(response);
      if (response.ok) setBalance((data as ReferralSummary).balance);
    } catch {
      // Keep the last successful value during a temporary connection failure.
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [enabled, session]);

  useEffect(() => {
    if (!enabled || !session) return;

    const initialLoadId = window.setTimeout(() => void load(), 0);
    const intervalId = window.setInterval(() => void load(false), 30_000);
    return () => {
      window.clearTimeout(initialLoadId);
      window.clearInterval(intervalId);
    };
  }, [enabled, load, session]);

  return {
    balance: enabled && session ? balance : null,
    isLoading: enabled && session ? isLoading : false,
  };
}

async function readResponseJson(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}
