"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  BadgeDollarSign,
  BriefcaseBusiness,
  Crown,
  Gift,
  History,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";
import { DepositQrButton } from "@/app/components/deposit-qr-button";
import { useUserBalance } from "@/app/components/use-user-balance";
import { useAgencySummary } from "@/app/components/use-agency-summary";
import { TelegramLinkCard } from "@/app/components/telegram-link-card";
import { formatVnd } from "@/lib/shop-api";

const roleLabels = {
  ADMIN: "Quản trị viên",
  COLLABORATOR: "Cộng tác viên",
  USER: "Khách hàng",
} as const;

export function ProfileOverview() {
  const { error, isLoading, refresh, session, wallet } = useUserBalance();
  const agency = useAgencySummary();

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
          onClick={() => { refresh(); agency.refresh(); }}
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
        <BalanceCard
          icon={<Crown size={25} />}
          label="Cấp đại lý"
          value={`Cấp ${agency.summary?.level ?? 0}${agency.summary?.manualLevel !== null && agency.summary?.manualLevel !== undefined ? " · Admin đặt" : ""}`}
        />
        <BalanceCard
          icon={<Gift size={25} />}
          label="Hoa hồng đại lý"
          value={formatVnd(agency.summary?.totalCommissionEarned ?? 0)}
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

      {agency.error ? <p className="profile-error">{agency.error}</p> : null}

      <section className="profile-detail-grid">
        <article className="profile-info-card">
          <div className="profile-card-heading">
            <span><Crown size={21} /></span>
            <div><p>Chương trình đại lý</p><h2>Đại lý cấp {agency.summary?.level ?? 0}</h2></div>
          </div>
          <dl>
            <div>
              <dt>Doanh số đã tiêu trong 30 ngày gần nhất</dt>
              <dd>{formatVnd(agency.summary?.rollingSpend ?? 0)}</dd>
            </div>
            <div>
              <dt>Tiến độ lên cấp</dt>
              <dd>{agency.summary?.manualLevel !== null && agency.summary?.manualLevel !== undefined
                ? `Admin đang cố định ở cấp ${agency.summary.manualLevel}`
                : agency.summary?.nextLevel
                ? `Cần tiêu thêm ${formatVnd(agency.summary.amountToNextLevel)} để lên cấp ${agency.summary.nextLevel}`
                : "Đã đạt cấp cao nhất"}</dd>
            </div>
            <div>
              <dt>Cửa sổ đang tính</dt>
              <dd>{formatAgencyWindow(agency.summary?.windowStartedAt, agency.summary?.checkedAt)}</dd>
            </div>
            <div>
              <dt>Tỷ lệ hiện tại</dt>
              <dd>{formatAgencyRates(agency.summary?.rates ?? [])}</dd>
            </div>
          </dl>
        </article>

        <article className="profile-info-card profile-actions-card">
          <div className="profile-card-heading">
            <span><Gift size={21} /></span>
            <div><p>Quy định đại lý</p><h2>Ghi nhận hoa hồng</h2></div>
          </div>
          <div className="profile-agency-rules">
            <p>Cấp đại lý được tính theo tổng đơn hoàn thành đã tiêu trong 30 ngày gần nhất tại lúc kiểm tra, không theo tháng cố định.</p>
            <p>Mỗi đơn chỉ áp dụng một mức chiết khấu theo cấp tại thời điểm tạo đơn, không cộng dồn.</p>
            <p>Hoa hồng chỉ cộng vào ví khi đơn hoàn thành thành công.</p>
            <p>Đơn hủy, thất bại hoặc hoàn tiền không được hưởng hoa hồng.</p>
            <Link href="/lich-su-hoa-hong">Xem lịch sử hoa hồng →</Link>
          </div>
        </article>
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
            <Link href="/bien-dong-so-du"><WalletCards size={18} />Biến động số dư</Link>
            <Link href="/lich-su-mua"><History size={18} />Lịch sử mua</Link>
            <Link href="/lich-su-hoa-hong"><Gift size={18} />Lịch sử hoa hồng</Link>
            {session.role === "COLLABORATOR" ? (
              <Link href="/ctv"><BriefcaseBusiness size={18} />Quản lý công việc</Link>
            ) : null}
            {session.role === "ADMIN" ? (
              <Link href="/admin-access"><ShieldCheck size={18} />Admin Panel</Link>
            ) : null}
          </div>
        </article>
      </section>

      <section className="profile-telegram-section">
        <TelegramLinkCard />
      </section>
    </main>
  );
}

function formatAgencyWindow(start: string | null | undefined, end: string | null | undefined) {
  if (!start || !end) return "Đang cập nhật";
  const formatter = new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  });
  return `${formatter.format(new Date(start))} – ${formatter.format(new Date(end))}`;
}

function formatAgencyRates(rates: { category: string; rateBasisPoints: number }[]) {
  const active = rates.filter((item) => item.rateBasisPoints > 0);
  if (!active.length) return "Chưa có chiết khấu";
  const labels: Record<string, string> = { CAROT: "Carot", CURRENCY: "Vàng/Ngọc", SERVICE: "Dịch vụ", VPS: "VPS" };
  return active.map((item) => `${labels[item.category] ?? item.category} ${item.rateBasisPoints / 100}%`).join(" · ");
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
