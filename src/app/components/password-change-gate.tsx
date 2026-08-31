"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthSession } from "./use-auth-session";

export function PasswordChangeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAuthSession();
  const mustRedirect =
    Boolean(session?.passwordChangeRequired) && pathname !== "/doi-mat-khau";

  useEffect(() => {
    if (mustRedirect) router.replace("/doi-mat-khau");
  }, [mustRedirect, router]);

  if (mustRedirect) {
    return (
      <main className="page-shell py-24">
        <div className="notice-panel">
          <p>Đang chuyển tới bước xác minh và đổi mật khẩu…</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
