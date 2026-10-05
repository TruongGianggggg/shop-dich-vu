"use client";

import { useCallback, useEffect, useState } from "react";
import { AgencySummary, getApiErrorMessage } from "@/lib/shop-api";
import { useAuthSession } from "./use-auth-session";

export function useAgencySummary() {
  const session = useAuthSession();
  const [summary, setSummary] = useState<AgencySummary | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(session));
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!session) {
      setSummary(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/agency/me", { cache: "no-store" });
      const data = (await response.json()) as AgencySummary | unknown;
      if (!response.ok) throw new Error(getApiErrorMessage(data, "Không tải được thông tin đại lý."));
      setSummary(data as AgencySummary);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không tải được thông tin đại lý.");
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  return { error, isLoading, refresh, summary };
}
