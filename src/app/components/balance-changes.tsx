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
      <main className="balance-changes-main balance-changes-guest">
        <WalletCards size={38} />
        <h1>Đăng nhập để xem biến động số dư</h1>
        <p>Lịch sử cộng, trừ và hoàn tiền của tài khoản sẽ hiển thị tại đây.</p>
        <Link className="primary-button" href="/login?returnUrl=%2Fbien-dong-so-du">Đăng nhập</Link>
      </main>
    );
  }

  return (
    <main className="balance-changes-main">
      <header className="balance-changes-hero">
        <span><History size={27} /></span>
        <div>
          <p>TÀI KHOẢN CỦA TÔI</p>
          <h1>Biến động số dư</h1>
          <small>Lịch sử trong 7 ngày gần nhất và tự động được xóa khi hết hạn.</small>
        </div>
        <button disabled={loading} onClick={() => void load()} type="button">
          <RefreshCw className={loading ? "is-spinning" : ""} size={16} /> Làm mới
        </button>
      </header>

      {error ? <p className="balance-changes-error"><CircleAlert size={17} />{error}</p> : null}

      <section className="balance-changes-panel" aria-busy={loading}>
        <div className="balance-changes-head">
          <div><strong>Lịch sử giao dịch</strong><span>{transactions.length.toLocaleString("vi-VN")} biến động</span></div>
        </div>
        {transactions.length ? (
          <div className="balance-changes-list">
            {transactions.map((transaction) => {
              const incoming = transaction.amount > 0;
              const Icon = incoming ? ArrowDownLeft : ArrowUpRight;
              return (
                <article className={incoming ? "is-credit" : "is-debit"} key={transaction.id}>
                  <span className="balance-change-icon"><Icon size={20} /></span>
                  <div className="balance-change-copy">
                    <strong>{transactionLabel(transaction.type)}</strong>
                    <p>{transaction.content}</p>
                    <small><Clock3 size={13} />{formatDateTime(transaction.createdAt)} · {transaction.code}</small>
                  </div>
                  <div className="balance-change-amount">
                    <strong>{incoming ? "+" : "-"}{formatVnd(Math.abs(transaction.amount))}</strong>
                    <span>{formatVnd(transaction.balanceBefore)} → {formatVnd(transaction.balanceAfter)}</span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="balance-changes-empty">
            <WalletCards size={34} />
            <strong>{loading ? "Đang tải dữ liệu..." : "Chưa có biến động số dư"}</strong>
            <p>Các giao dịch cộng, trừ hoặc hoàn tiền sẽ xuất hiện tại đây.</p>
          </div>
        )}
      </section>
    </main>
  );
}

function transactionLabel(type: WalletTransaction["type"]) {
  return ({
    TOPUP_CARD: "Nạp tiền bằng thẻ",
    TOPUP_BANK: "Nạp tiền qua ngân hàng",
    ADMIN_ADJUSTMENT: "Quản trị viên điều chỉnh",
    SERVICE_ORDER_PAYMENT: "Thanh toán đơn hàng",
    SERVICE_ORDER_REFUND: "Hoàn tiền đơn hàng",
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
