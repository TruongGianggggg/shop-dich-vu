"use client";

import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage, UserBalance } from "@/lib/shop-api";
import { useAuthSession } from "./use-auth-session";

export function useUserBalance() {
  const session = useAuthSession();
  const [wallet, setWallet] = useState<UserBalance | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }

    const activeSession = session;
    let ignore = false;

    async function loadWallet(showLoading = true) {
      if (showLoading) {
        setIsLoading(true);
      }

      try {
        const response = await fetch(
          `/api/wallet/${encodeURIComponent(activeSession.userId)}`,
          {
            cache: "no-store",
            headers: {
              Authorization: `${activeSession.tokenType} ${activeSession.token}`,
            },
          },
        );
        const data = (await readResponseJson(response)) as UserBalance | unknown;

        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Không tải được số dư."));
        }

        if (!ignore) {
          setWallet(data as UserBalance);
          setError("");
        }
      } catch (exception) {
        if (!ignore) {
          setError(
            exception instanceof Error
              ? exception.message
              : "Không tải được số dư.",
          );
        }
      } finally {
        if (!ignore && showLoading) {
          setIsLoading(false);
        }
      }
    }

    void loadWallet();
    const intervalId = window.setInterval(() => {
      void loadWallet(false);
    }, 30_000);

    return () => {
      ignore = true;
      window.clearInterval(intervalId);
    };
  }, [refreshKey, session]);

  const activeWallet = wallet?.userId === session?.userId ? wallet : null;

  return { error, isLoading, refresh, session, wallet: activeWallet };
}

async function readResponseJson(response: Response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}
