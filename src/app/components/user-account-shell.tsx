"use client";

import {
  BellRing,
  ChevronRight,
  Coins,
  Gift,
  KeyRound,
  ReceiptText,
  Server,
  UserRound,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { formatVnd } from "@/lib/shop-api";
import { DepositQrButton } from "./deposit-qr-button";
import { useUserBalance } from "./use-user-balance";
import styles from "./user-account-shell.module.css";

const navigation = [
  { href: "/ho-so", label: "Tổng quan tài khoản", icon: UserRound },
  { href: "/bien-dong-so-du", label: "Biến động số dư", icon: WalletCards },
  { href: "/lich-su-mua", label: "Lịch sử mua dịch vụ", icon: ReceiptText },
  { href: "/lich-su-vang-ngoc", label: "Lịch sử Vàng & Ngọc", icon: Coins },
  { href: "/lich-su-hoa-hong", label: "Lịch sử hoa hồng", icon: Gift },
  { href: "/vps-cua-toi", label: "VPS của tôi", icon: Server },
  { href: "/thong-bao", label: "Thông báo", icon: BellRing },
  { href: "/doi-mat-khau", label: "Đổi mật khẩu", icon: KeyRound },
] as const;

const roleLabels = {
  USER: "Khách hàng",
  COLLABORATOR: "Cộng tác viên",
  ADMIN: "Quản trị viên",
} as const;

export function UserAccountShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isLoading, session, wallet } = useUserBalance();

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.identity}>
            <span className={styles.avatar}>{session?.username.slice(0, 1).toUpperCase() ?? <UserRound size={24} />}</span>
            <div>
              <small>KHU VỰC TÀI KHOẢN</small>
              <strong>{session?.username ?? "Chưa đăng nhập"}</strong>
              <p>{session ? roleLabels[session.role] : "Đăng nhập để quản lý tài khoản"}</p>
            </div>
          </div>

          <div className={styles.balanceCard}>
            <span><WalletCards size={19} /></span>
            <div><small>Số dư hiện tại</small><strong>{session ? (isLoading && !wallet ? "Đang tải..." : formatVnd(wallet?.balance ?? 0)) : "—"}</strong></div>
          </div>

          <nav className={styles.navigation} aria-label="Quản lý tài khoản">
            <p>QUẢN LÝ CÁ NHÂN</p>
            <div>
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link className={active ? styles.active : ""} href={item.href} key={item.href}>
                    <span><Icon size={18} /></span>
                    <strong>{item.label}</strong>
                    <ChevronRight className={styles.chevron} size={16} />
                  </Link>
                );
              })}
            </div>
          </nav>

          {session ? (
            <DepositQrButton className={styles.depositButton} label="Nạp tiền vào tài khoản" />
          ) : (
            <Link className={styles.loginButton} href={`/login?returnUrl=${encodeURIComponent(pathname)}`}>Đăng nhập tài khoản</Link>
          )}

          <p className={styles.support}>Cần hỗ trợ? Liên hệ Zalo/Facebook của shop để được xử lý nhanh.</p>
        </aside>

        <section className={styles.content}>{children}</section>
      </div>
    </div>
  );
}
