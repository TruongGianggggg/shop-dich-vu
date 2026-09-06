"use client";

import Link from "next/link";
import { UserRole } from "@/lib/shop-api";
import { useAuthSession } from "./use-auth-session";

type RoleGateProps = {
  allowedRoles: UserRole[];
  children: React.ReactNode;
};

export function RoleGate({ allowedRoles, children }: RoleGateProps) {
  const session = useAuthSession();

  if (!session) {
    return (
      <main className="page-shell py-24">
        <div className="notice-panel">
          <p className="section-kicker">Can dang nhap</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">
            Ban can dang nhap de xem trang nay
          </h1>
          <Link className="primary-button mt-6 h-11 px-5" href="/login">
            Dang nhap
          </Link>
        </div>
      </main>
    );
  }

  if (!allowedRoles.includes(session.role)) {
    return (
      <main className="page-shell py-24">
        <div className="notice-panel">
          <p className="section-kicker">Khong dung phan quyen</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">
            Tai khoan {session.username} khong co quyen vao trang nay
          </h1>
          <Link className="ghost-button mt-6 h-11 px-5" href="/">
            Ve trang chu
          </Link>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
