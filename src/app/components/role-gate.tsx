"use client";

import Link from "next/link";
import { BackofficePermission, UserRole } from "@/lib/shop-api";
import { hasBackofficePermission } from "@/lib/backoffice-permissions";
import { useAuthSession } from "./use-auth-session";

type RoleGateProps = {
  allowedRoles: UserRole[];
  requiredPermission?: BackofficePermission;
  children: React.ReactNode;
};

export function RoleGate({ allowedRoles, children, requiredPermission }: RoleGateProps) {
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

  const lacksPermission =
    session.role === "COLLABORATOR" &&
    requiredPermission &&
    !hasBackofficePermission(session.backofficePermissions, requiredPermission);

  if (!allowedRoles.includes(session.role) || lacksPermission) {
    return (
      <main className="page-shell py-24">
        <div className="notice-panel">
          <p className="section-kicker">Khong dung phan quyen</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">
            Tài khoản {session.username} không được cấp quyền vào trang này
          </h1>
          <Link className="ghost-button mt-6 h-11 px-5" href="/">
            Về trang cộng tác viên
          </Link>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
