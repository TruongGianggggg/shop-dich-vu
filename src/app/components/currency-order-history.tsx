"use client";

import Link from "next/link";
import { Coins, Gem, Search, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useAuthSession } from "@/app/components/use-auth-session";
import { formatVnd, GameCurrencyOrder, getApiErrorMessage, PageResponse } from "@/lib/shop-api";

const statusLabels = {
  PENDING: "Chờ xử lý",
  PROCESSING: "Đang xử lý",
  COMPLETED: "Hoàn thành",
  FAILED: "Thất bại",
  CANCELED: "Đã hủy",
} as const;

type HistoryFilters = { requestId: string; characterName: string; serverName: string; currencyType: string; status: string };
const emptyFilters: HistoryFilters = { requestId: "", characterName: "", serverName: "", currencyType: "", status: "" };

export function CurrencyOrderHistory() {
  const session = useAuthSession();
  const [result, setResult] = useState<PageResponse<GameCurrencyOrder> | null>(null);
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<HistoryFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<HistoryFilters>(emptyFilters);

  useEffect(() => {
    if (!session) return;
    let ignore = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ page: String(page), size: "10" });
        Object.entries(appliedFilters).forEach(([key, value]) => {
          if (value.trim()) params.set(key, value.trim());
        });
        const response = await fetch(`/api/currency-orders?${params}`, {
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
  }, [appliedFilters, page, session]);

  function searchOrders(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(0);
    setAppliedFilters({ ...filters });
  }

  function clearFilters() {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(0);
  }

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
      <section className="currency-history-filter currency-order-filter-panel">
        <div className="currency-order-filter-head"><div><strong>Tìm kiếm lịch sử</strong><span>{(result?.totalElements ?? 0).toLocaleString("vi-VN")} đơn</span></div></div>
        <form className="currency-order-filter-grid currency-user-filter-grid" onSubmit={searchOrders}>
          <label><span>Mã đơn</span><input className="text-field" maxLength={15} placeholder="Nhập mã 15 ký tự" value={filters.requestId} onChange={(event) => setFilters({ ...filters, requestId: event.target.value.toUpperCase() })} /></label>
          <label><span>Tên nhân vật</span><input className="text-field" placeholder="Nhập tên nhân vật" value={filters.characterName} onChange={(event) => setFilters({ ...filters, characterName: event.target.value })} /></label>
          <label><span>Server</span><input className="text-field" placeholder="Nhập tên server" value={filters.serverName} onChange={(event) => setFilters({ ...filters, serverName: event.target.value })} /></label>
          <label><span>Loại</span><select className="role-select wide" value={filters.currencyType} onChange={(event) => setFilters({ ...filters, currencyType: event.target.value })}><option value="">Tất cả loại</option><option value="GOLD">Vàng</option><option value="GEM">Ngọc</option></select></label>
          <label><span>Trạng thái</span><select className="role-select wide" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">Tất cả trạng thái</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <div className="currency-order-filter-actions"><button className="primary-button h-11 px-5" disabled={loading} type="submit"><Search size={16} /> Tìm kiếm</button><button className="ghost-button h-11 px-4" disabled={loading} onClick={clearFilters} type="button"><X size={16} /> Xóa lọc</button></div>
        </form>
      </section>
      {error ? <p className="order-history-error">{error}</p> : null}
      {loading ? <p className="order-history-loading">Đang tải đơn hàng...</p> : null}
      {!loading && !orders.length && !error ? <div className="order-history-empty"><strong>Bạn chưa có đơn Vàng/Ngọc</strong><Link href="/">Mua ngay →</Link></div> : null}
      <div className="order-history-list">
        {orders.map((order) => (
          <article className={`order-history-card currency-history-card ${order.currencyType.toLowerCase()}`} key={order.id}>
            <div className="order-history-card-head currency-history-card-head">
              <div className="currency-history-order-identity">
                <span className={`currency-history-type-icon ${order.currencyType.toLowerCase()}`}>{order.currencyType === "GOLD" ? <Coins size={18} /> : <Gem size={18} />}</span>
                <div><small>Mã đơn</small><strong>{order.requestId}</strong></div>
              </div>
              <span className={`status-${order.status.toLowerCase()}`}>{statusLabels[order.status]}</span>
            </div>
            <div className="order-history-card-body currency-history-body">
              <div><small>Loại</small><strong className={`currency-history-type-text ${order.currencyType.toLowerCase()}`}>{order.currencyType === "GOLD" ? "Vàng" : "Ngọc"}</strong></div>
              <div><small>Nhân vật</small><strong>{order.characterName}</strong></div>
              <div><small>Server</small><strong>{order.serverName}</strong></div>
              <div><small>Thanh toán</small><strong>{formatVnd(order.paymentAmount)}</strong></div>
              <div><small>Thực nhận</small><strong className="currency-history-received">{order.receivedAmount.toLocaleString("vi-VN")}</strong></div>
              <div><small>Ngày tạo</small><strong>{formatDate(order.createdAt)}</strong></div>
            </div>
            {order.adminNote ? <p className="order-history-note">Ghi chú: {order.adminNote}</p> : null}
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
