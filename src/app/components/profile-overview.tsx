"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  BadgeDollarSign,
  History,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";
import { DepositQrButton } from "@/app/components/deposit-qr-button";
import { useUserBalance } from "@/app/components/use-user-balance";
import { formatVnd } from "@/lib/shop-api";

const roleLabels = {
  ADMIN: "Quản trị viên",
  COLLABORATOR: "Cộng tác viên",
  USER: "Khách hàng",
} as const;

export function ProfileOverview() {
  const { error, isLoading, refresh, session, wallet } = useUserBalance();

  if (!session) {
    return (
      <main className="profile-main profile-guest-main">
        <section className="profile-guest-card">
          <span className="profile-guest-icon"><UserRound size={34} /></span>
          <p>TÀI KHOẢN CỦA TÔI</p>
          <h1>Đăng nhập để xem hồ sơ</h1>
          <span>Thông tin tài khoản và số dư của bạn sẽ hiển thị tại đây.</span>
          <Link className="primary-button" href="/login?returnUrl=%2Fho-so">
            Đăng nhập
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="profile-main">
      <section className="profile-hero">
        <div className="profile-avatar-large">
          {session.username.slice(0, 1).toUpperCase()}
        </div>
        <div className="profile-identity">
          <p>HỒ SƠ CỦA TÔI</p>
          <h1>{session.username}</h1>
          <div>
            <span><Mail size={15} />{session.email}</span>
            <span><ShieldCheck size={15} />{roleLabels[session.role]}</span>
          </div>
        </div>
        <button
          className="profile-refresh-button"
          disabled={isLoading}
          onClick={refresh}
          type="button"
        >
          <RefreshCw className={isLoading ? "is-spinning" : ""} size={17} />
          Cập nhật số dư
        </button>
      </section>

      {error ? <p className="profile-error">{error}</p> : null}

      <section className="profile-balance-grid">
        <BalanceCard
          icon={<WalletCards size={25} />}
          label="Số dư hiện tại"
          primary
          value={isLoading && !wallet ? "Đang tải..." : formatVnd(wallet?.balance ?? 0)}
        />
        <BalanceCard
          icon={<BadgeDollarSign size={25} />}
          label="Tổng tiền đã nạp"
          value={formatVnd(wallet?.totalDeposited ?? 0)}
        />
        {session.role === "COLLABORATOR" || session.role === "ADMIN" ? (
          <>
            <BalanceCard
              icon={<WalletCards size={25} />}
              label="Số dư cộng tác viên"
              value={formatVnd(wallet?.collaboratorBalance ?? 0)}
            />
            <BalanceCard
              icon={<BadgeDollarSign size={25} />}
              label="Tổng hoa hồng"
              value={formatVnd(wallet?.collaboratorTotalEarned ?? 0)}
            />
          </>
        ) : null}
      </section>

      <section className="profile-detail-grid">
        <article className="profile-info-card">
          <div className="profile-card-heading">
            <span><UserRound size={21} /></span>
            <div><p>Thông tin cá nhân</p><h2>Chi tiết tài khoản</h2></div>
          </div>
          <dl>
            <div><dt>Tên đăng nhập</dt><dd>{session.username}</dd></div>
            <div><dt>Email</dt><dd>{session.email}</dd></div>
            <div><dt>Vai trò</dt><dd>{roleLabels[session.role]}</dd></div>
            <div><dt>Mã người dùng</dt><dd>{session.userId}</dd></div>
          </dl>
        </article>

        <article className="profile-info-card profile-actions-card">
          <div className="profile-card-heading">
            <span><History size={21} /></span>
            <div><p>Truy cập nhanh</p><h2>Hoạt động tài khoản</h2></div>
          </div>
          <div className="profile-quick-actions">
            <DepositQrButton />
            <Link href="/lich-su-mua"><History size={18} />Lịch sử mua</Link>
            <Link href="/lich-su-vang-ngoc"><WalletCards size={18} />Dòng tiền</Link>
            {session.role === "ADMIN" ? (
              <Link href="/admin"><ShieldCheck size={18} />Admin Panel</Link>
            ) : null}
          </div>
        </article>
      </section>
    </main>
  );
}

function BalanceCard({
  icon,
  label,
  primary = false,
  value,
}: {
  icon: ReactNode;
  label: string;
  primary?: boolean;
  value: string;
}) {
  return (
    <article className={primary ? "profile-balance-card is-primary" : "profile-balance-card"}>
      <span>{icon}</span>
      <div><p>{label}</p><strong>{value}</strong></div>
    </article>
  );
}
