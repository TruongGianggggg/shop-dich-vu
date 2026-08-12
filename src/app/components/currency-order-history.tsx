"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthSession } from "@/app/components/use-auth-session";
import { formatVnd, GameCurrencyOrder, getApiErrorMessage, PageResponse } from "@/lib/shop-api";

const statusLabels = {
  PENDING: "Chờ xử lý",
  PROCESSING: "Đang xử lý",
  COMPLETED: "Hoàn thành",
  FAILED: "Thất bại",
  CANCELED: "Đã hủy",
} as const;

export function CurrencyOrderHistory() {
  const session = useAuthSession();
  const [result, setResult] = useState<PageResponse<GameCurrencyOrder> | null>(null);
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    let ignore = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/currency-orders?page=${page}&size=10`, {
          headers: { Authorization: `Bearer ${session!.token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(getApiErrorMessage(data, "Không tải được lịch sử."));
        if (!ignore) setResult(data as PageResponse<GameCurrencyOrder>);
      } catch (reason) {
        if (!ignore) setError(reason instanceof Error ? reason.message : "Không tải được lịch sử.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [page, session]);

  if (!session) return (
    <div className="order-history-login">
      <strong>Đăng nhập để xem lịch sử Vàng & Ngọc</strong>
      <p>Các đơn của bạn sẽ được hiển thị tại đây.</p>
      <Link href="/login?returnUrl=%2Flich-su-vang-ngoc">Đăng nhập</Link>
    </div>
  );

  const orders = result?.content ?? [];
  return (
    <div className="order-history-content">
      <div className="order-history-summary">
        <div><span>Tổng đơn</span><strong>{result?.totalElements ?? 0}</strong></div>
        <div><span>Tài khoản</span><strong>{session.username}</strong></div>
      </div>
      {error ? <p className="order-history-error">{error}</p> : null}
      {loading ? <p className="order-history-loading">Đang tải đơn hàng...</p> : null}
      {!loading && !orders.length && !error ? <div className="order-history-empty"><strong>Bạn chưa có đơn Vàng/Ngọc</strong><Link href="/">Mua ngay →</Link></div> : null}
      <div className="order-history-list">
        {orders.map((order) => (
          <article className="order-history-card" key={order.id}>
            <div className="order-history-card-head">
              <div><small>Mã đơn</small><strong>{order.requestId}</strong></div>
              <span className={`status-${order.status.toLowerCase()}`}>{statusLabels[order.status]}</span>
            </div>
            <div className="order-history-card-body currency-history-body">
              <div><small>Loại</small><strong>{order.currencyType === "GOLD" ? "Vàng" : "Ngọc"}</strong></div>
              <div><small>Nhân vật</small><strong>{order.characterName}</strong></div>
              <div><small>Server</small><strong>{order.serverName}</strong></div>
              <div><small>Thanh toán</small><strong>{formatVnd(order.paymentAmount)}</strong></div>
              <div><small>Thực nhận</small><strong>{order.receivedAmount.toLocaleString("vi-VN")}</strong></div>
              <div><small>Ngày tạo</small><strong>{formatDate(order.createdAt)}</strong></div>
            </div>
            {order.adminNote ? <p className="order-history-note">Ghi chú: {order.adminNote}</p> : null}
            {order.walletRefunded ? <p className="order-history-note">Đã hoàn {formatVnd(order.paymentAmount)} vào ví.</p> : null}
          </article>
        ))}
      </div>
      {result && result.totalPages > 1 ? <div className="order-history-pagination">
        <button disabled={result.first || loading} onClick={() => setPage((value) => Math.max(0, value - 1))}>← Trang trước</button>
        <span>Trang {result.page + 1}/{result.totalPages}</span>
        <button disabled={result.last || loading} onClick={() => setPage((value) => value + 1)}>Trang sau →</button>
      </div> : null}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
