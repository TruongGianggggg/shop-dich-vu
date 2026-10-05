"use client";

import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CircleAlert,
  Clock3,
  History,
  RefreshCw,
  WalletCards,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { formatVnd, getApiErrorMessage, WalletTransaction } from "@/lib/shop-api";
import { useAuthSession } from "@/app/components/use-auth-session";
import styles from "./balance-changes.module.css";

export function BalanceChanges() {
  const session = useAuthSession();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/wallet/${encodeURIComponent(session.userId)}/transactions`,
        { cache: "no-store" },
      );
      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, "Không tải được biến động số dư."));
      }
      setTransactions(payload as WalletTransaction[]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không tải được biến động số dư.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [load]);

  if (!session) {
    return (
      <div className={styles.page}>
        <main className={`${styles.main} ${styles.guest}`}>
          <section className={styles.guestCard}>
            <span className={styles.guestIcon}><WalletCards size={34} /></span>
            <p className={styles.eyebrow}>TÀI KHOẢN CỦA TÔI</p>
            <h1>Đăng nhập để xem biến động số dư</h1>
            <span className={styles.guestCopy}>Lịch sử cộng, trừ và hoàn tiền của tài khoản sẽ hiển thị tại đây.</span>
            <Link className={styles.guestButton} href="/login?returnUrl=%2Fbien-dong-so-du">Đăng nhập</Link>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.hero}>
          <span className={styles.heroIcon}><History size={27} /></span>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>TÀI KHOẢN CỦA TÔI</p>
            <h1>Biến động số dư</h1>
            <small>Lịch sử trong 7 ngày gần nhất và tự động được xóa khi hết hạn.</small>
          </div>
          <button className={styles.refreshButton} disabled={loading} onClick={() => void load()} type="button">
            <RefreshCw className={loading ? styles.spinning : ""} size={16} /> Làm mới
          </button>
        </header>

        {error ? <p className={styles.error}><CircleAlert size={17} />{error}</p> : null}

        <section className={styles.panel} aria-busy={loading}>
          <div className={styles.panelHead}>
            <div><strong>Lịch sử giao dịch</strong><span>{transactions.length.toLocaleString("vi-VN")} biến động</span></div>
            <span className={styles.retentionBadge}><Clock3 size={14} /> Lưu trong 7 ngày</span>
          </div>
          {transactions.length ? (
            <div className={styles.list}>
              {transactions.map((transaction) => {
                const incoming = transaction.amount > 0;
                const Icon = incoming ? ArrowDownLeft : ArrowUpRight;
                return (
                  <article className={incoming ? styles.credit : styles.debit} key={transaction.id}>
                    <span className={styles.changeIcon}><Icon size={20} /></span>
                    <div className={styles.changeCopy}>
                      <strong>{transactionLabel(transaction.type)}</strong>
                      <p>{transaction.content}</p>
                      <small><Clock3 size={13} />{formatDateTime(transaction.createdAt)} · {transaction.code}</small>
                    </div>
                    <div className={styles.changeAmount}>
                      <strong>{incoming ? "+" : "-"}{formatVnd(Math.abs(transaction.amount))}</strong>
                      <span>{formatVnd(transaction.balanceBefore)} → {formatVnd(transaction.balanceAfter)}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={styles.empty}>
              <span><WalletCards size={30} /></span>
              <strong>{loading ? "Đang tải dữ liệu..." : "Chưa có biến động số dư"}</strong>
              <p>Các giao dịch cộng, trừ hoặc hoàn tiền sẽ xuất hiện tại đây.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function transactionLabel(type: WalletTransaction["type"]) {
  return ({
    TOPUP_CARD: "Nạp tiền bằng thẻ",
    TOPUP_BANK: "Nạp tiền qua ngân hàng",
    ADMIN_ADJUSTMENT: "Quản trị viên điều chỉnh",
    SERVICE_ORDER_PAYMENT: "Thanh toán đơn hàng",
    SERVICE_ORDER_REFUND: "Hoàn tiền đơn hàng",
    AGENCY_COMMISSION: "Hoa hồng đại lý",
    AGENCY_COMMISSION_REVERSAL: "Thu hồi hoa hồng đại lý",
  } as const)[type] ?? type;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Không rõ thời gian";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text) as unknown; } catch { return { message: text }; }
}
