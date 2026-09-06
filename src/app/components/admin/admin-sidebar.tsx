"use client";

import Link from "next/link";
import {
  ClipboardList,
  ListTodo,
  Coins,
  CreditCard,
  FolderTree,
  Landmark,
  Layers3,
  LayoutDashboard,
  Settings,
  ScrollText,
  Users,
  Gem,
  ServerCog,
  BriefcaseBusiness,
} from "lucide-react";
import { useAuthSession } from "@/app/components/use-auth-session";
import type { BackofficePermission } from "@/lib/shop-api";

type AdminSection =
  | "collaborator-work"
  | "dashboard"
  | "users"
  | "service-categories"
  | "service-sub-categories"
  | "currency-settings"
  | "currency-orders"
  | "active-orders"
  | "orders"
  | "vps"
  | "deposits"
  | "banks"
  | "activity-logs"
  | "settings";

const navItems = [
  {
    href: "/admin",
    icon: LayoutDashboard,
    label: "Dashboard",
    section: "dashboard",
    permission: "DASHBOARD",
  },
  {
    href: "/admin/users",
    icon: Users,
    label: "Người dùng",
    section: "users",
    permission: null,
  },
  {
    href: "/admin/service-categories",
    icon: FolderTree,
    label: "Danh mục cha",
    section: "service-categories",
    permission: "SERVICE_CATALOG",
  },
  {
    href: "/admin/service-sub-categories",
    icon: Layers3,
    label: "Danh mục con",
    section: "service-sub-categories",
    permission: "SERVICE_CATALOG",
  },
  {
    href: "/admin/currency-settings",
    icon: Coins,
    label: "Cấu hình Vàng & Ngọc",
    section: "currency-settings",
    permission: "CURRENCY_SETTINGS",
  },
  {
    href: "/admin/active-orders",
    icon: ListTodo,
    label: "Đơn cần xử lý",
    section: "active-orders",
    permission: "ACTIVE_ORDERS",
  },
  {
    href: "/admin/orders",
    icon: ClipboardList,
    label: "Đơn hàng",
    section: "orders",
    permission: "ORDERS",
  },
  {
    href: "/admin/vps",
    icon: ServerCog,
    label: "VPS Agency",
    section: "vps",
    permission: "VPS",
  },
  {
    href: "/admin/currency-orders",
    icon: Gem,
    label: "Đơn Vàng & Ngọc",
    section: "currency-orders",
    permission: "CURRENCY_ORDERS",
  },
  {
    href: "/admin/deposits",
    icon: CreditCard,
    label: "Nạp tiền",
    section: "deposits",
    permission: "DEPOSITS",
  },
  {
    href: "/admin/banks",
    icon: Landmark,
    label: "Ngân hàng",
    section: "banks",
    permission: "BANKS",
  },
  {
    href: "/admin/activity-logs",
    icon: ScrollText,
    label: "Nhật ký hoạt động",
    section: "activity-logs",
    permission: "ACTIVITY_LOGS",
  },
  {
    href: "/admin/site-settings",
    icon: Settings,
    label: "Giao diện shop",
    section: "settings",
    permission: "SITE_SETTINGS",
  },
] satisfies {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  section: AdminSection;
  permission: BackofficePermission | null;
}[];

export function AdminSidebar({ active }: { active: AdminSection }) {
  const session = useAuthSession();
  const isCollaborator = session?.role === "COLLABORATOR";
  const visibleItems = session?.role === "ADMIN"
    ? navItems
    : session?.role === "COLLABORATOR"
      ? navItems.filter((item) =>
          item.permission !== null && session.backofficePermissions.includes(item.permission),
        )
      : [];

  return (
    <aside className="role-sidebar">
      <Link className="role-brand" href="/">
        <span>SG</span>
        <strong>Shop Game</strong>
      </Link>

      <div className="role-nav-block">
        <p>MENU</p>
        <nav className="role-nav">
          {isCollaborator ? (
            <Link
              className={active === "collaborator-work" ? "role-nav-link active" : "role-nav-link"}
              href="/cong-tac-vien"
            >
              <span aria-hidden="true"><BriefcaseBusiness size={16} strokeWidth={2.2} /></span>
              Công việc của tôi
            </Link>
          ) : null}
          {visibleItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                className={
                  active === item.section
                    ? "role-nav-link active"
                    : "role-nav-link"
                }
                href={item.href}
                key={item.section}
              >
                <span aria-hidden="true">
                  <Icon size={16} strokeWidth={2.2} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {isCollaborator ? (
        <div className="role-sidebar-widget">
          <p>QUYỀN ĐƯỢC CẤP</p>
          <strong>{session.backofficePermissions.length} chức năng</strong>
          <span>Admin có thể thay đổi quyền của bạn trong màn quản lý người dùng.</span>
        </div>
      ) : null}
    </aside>
  );
}
