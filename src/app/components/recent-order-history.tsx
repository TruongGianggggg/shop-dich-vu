"use client";

import Link from "next/link";
import { Coins, Gem, History, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { formatReceivedCurrency, goldSaleTypeLabel } from "@/lib/game-currency";
import {
  formatVnd,
  GameCurrencyOrder,
  GameCurrencyType,
  getApiErrorMessage,
  PageResponse,
  ServiceOrder,
} from "@/lib/shop-api";
import { useAuthSession } from "./use-auth-session";

const statusLabels = {
  error: "Lỗi",
  refund_error: "Đã hoàn tiền",
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  done: "Hoàn thành",
} as const;

export function RecentServiceOrderHistory({
  refreshKey,
  subCategoryId,
}: {
  refreshKey: number;
  subCategoryId: string;
}) {
  const session = useAuthSession();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ page: "0", size: "5", subCategoryId });
        const response = await fetch(`/api/service-orders/history?${params}`, { cache: "no-store" });
        const data = (await response.json()) as PageResponse<ServiceOrder> | unknown;
        if (!response.ok) throw new Error(getApiErrorMessage(data, "Không tải được lịch sử Carot."));
        if (!ignore) setOrders((data as PageResponse<ServiceOrder>).content);
      } catch (reason) {
        if (!ignore) setError(reason instanceof Error ? reason.message : "Không tải được lịch sử Carot.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();
    return () => { ignore = true; };
  }, [refreshKey, session, subCategoryId]);

  return (
    <RecentHistoryShell
      emptyText="Bạn chưa có đơn nạp Carot"
      error={error}
      fullHistoryHref="/lich-su-mua"
      loading={loading}
      sessionAvailable={Boolean(session)}
      title="Lịch sử nạp Carot gần đây"
    >
      {orders.map((order) => (
        <article className="embedded-history-row" key={order.id}>
          <div><small>Mã đơn</small><strong>{order.requestId}</strong></div>
          <div><small>Tài khoản</small><strong>{order.username ?? "—"}</strong></div>
          <div><small>Server</small><strong>{order.server ?? "—"}</strong></div>
          <div><small>Thanh toán</small><strong>{formatVnd(order.amount)}</strong></div>
          <div><small>Thời gian</small><strong>{formatDate(order.createdAt)}</strong></div>
          <span className={`status-${order.status}`}>{statusLabels[order.status]}</span>
        </article>
      ))}
    </RecentHistoryShell>
  );
}

export function RecentCurrencyOrderHistory({
  currencyType,
  refreshKey,
}: {
  currencyType: GameCurrencyType;
  refreshKey: number;
}) {
  const session = useAuthSession();
  const [orders, setOrders] = useState<GameCurrencyOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const label = currencyType === "GOLD" ? "Vàng" : "Ngọc";

  useEffect(() => {
    if (!session) return;
    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ page: "0", size: "5", currencyType });
        const response = await fetch(`/api/currency-orders/history?${params}`, { cache: "no-store" });
        const data = (await response.json()) as PageResponse<GameCurrencyOrder> | unknown;
        if (!response.ok) throw new Error(getApiErrorMessage(data, `Không tải được lịch sử ${label}.`));
        if (!ignore) setOrders((data as PageResponse<GameCurrencyOrder>).content);
      } catch (reason) {
        if (!ignore) setError(reason instanceof Error ? reason.message : `Không tải được lịch sử ${label}.`);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();
    return () => { ignore = true; };
  }, [currencyType, label, refreshKey, session]);

  return (
    <RecentHistoryShell
      emptyText={`Bạn chưa có đơn nạp ${label}`}
      error={error}
      fullHistoryHref="/lich-su-vang-ngoc"
      loading={loading}
      sessionAvailable={Boolean(session)}
      title={`Lịch sử nạp ${label} gần đây`}
    >
      {orders.map((order) => {
        const Icon = order.currencyType === "GOLD" ? Coins : Gem;
        return (
          <article className="embedded-history-row" key={order.id}>
            <div className="embedded-history-identity"><Icon aria-hidden="true" size={17} /><span><small>Mã đơn</small><strong>{order.requestId}</strong></span></div>
            <div><small>Nhân vật</small><strong>{order.characterName}</strong></div>
            <div><small>Server</small><strong>{order.serverName}</strong></div>
            <div><small>Thực nhận</small><strong>{formatReceivedCurrency(order.receivedAmount, order.currencyType, order.goldSaleType)}</strong></div>
            <div><small>Thanh toán</small><strong>{formatVnd(order.paymentAmount)}</strong></div>
            <span className={`status-${order.status}`}>{statusLabels[order.status]}</span>
            <p>{order.currencyType === "GOLD" ? goldSaleTypeLabel(order.goldSaleType) : "Ngọc"} · {formatDate(order.createdAt)}</p>
          </article>
        );
      })}
    </RecentHistoryShell>
  );
}

function RecentHistoryShell({
  children,
  emptyText,
  error,
  fullHistoryHref,
  loading,
  sessionAvailable,
  title,
}: {
  children: React.ReactNode;
  emptyText: string;
  error: string;
  fullHistoryHref: string;
  loading: boolean;
  sessionAvailable: boolean;
  title: string;
}) {
  const hasOrders = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <section className="embedded-order-history">
      <div className="embedded-order-history-head">
        <div><span><History aria-hidden="true" size={19} /></span><div><small>ĐƠN HÀNG CỦA TÔI</small><h2>{title}</h2></div></div>
        {sessionAvailable ? <Link href={fullHistoryHref}>Xem tất cả →</Link> : null}
      </div>
      {!sessionAvailable ? <div className="embedded-history-state"><strong>Đăng nhập để xem lịch sử</strong><Link href="/login">Đăng nhập</Link></div> : null}
      {sessionAvailable && loading ? <div className="embedded-history-state"><RefreshCw className="is-spinning" size={18} /><span>Đang tải lịch sử...</span></div> : null}
      {sessionAvailable && error ? <div className="embedded-history-state is-error">{error}</div> : null}
      {sessionAvailable && !loading && !error && !hasOrders ? <div className="embedded-history-state"><strong>{emptyText}</strong><span>Đơn mới sẽ xuất hiện tại đây ngay sau khi tạo.</span></div> : null}
      {sessionAvailable && !loading && !error && hasOrders ? <div className="embedded-history-list">{children}</div> : null}
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
