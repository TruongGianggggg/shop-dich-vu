import Link from "next/link";
import {
  ClipboardList,
  CreditCard,
  Landmark,
  LayoutDashboard,
  Package,
  Users,
} from "lucide-react";

type AdminSection =
  | "dashboard"
  | "users"
  | "services"
  | "orders"
  | "deposits"
  | "banks";

const navItems = [
  {
    href: "/admin",
    icon: LayoutDashboard,
    label: "Dashboard",
    section: "dashboard",
  },
  {
    href: "/admin/users",
    icon: Users,
    label: "Người dùng",
    section: "users",
  },
  {
    href: "/admin/services",
    icon: Package,
    label: "Dịch vụ & gói",
    section: "services",
  },
  {
    href: "/admin/orders",
    icon: ClipboardList,
    label: "Đơn hàng",
    section: "orders",
  },
  {
    href: "/admin/deposits",
    icon: CreditCard,
    label: "Nạp tiền",
    section: "deposits",
  },
  {
    href: "/admin/banks",
    icon: Landmark,
    label: "Ngân hàng",
    section: "banks",
  },
] satisfies {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  section: AdminSection;
}[];

export function AdminSidebar({ active }: { active: AdminSection }) {
  return (
    <aside className="role-sidebar">
      <Link className="role-brand" href="/">
        <span>SG</span>
        <strong>Shop Game</strong>
      </Link>

      <div className="role-nav-block">
        <p>MENU</p>
        <nav className="role-nav">
          {navItems.map((item) => {
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
    </aside>
  );
}
