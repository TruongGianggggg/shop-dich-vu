"use client";

import { Coins, Eye, Gem, RefreshCw, Search, ShieldCheck, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { CollaboratorSidebar } from "@/app/components/collaborator-sidebar";
import { formatVnd, GameCurrencyOrder, getApiErrorMessage, PageResponse, ServiceOrderStatus } from "@/lib/shop-api";
import { goldSaleTypeLabel } from "@/lib/game-currency";

const statusLabels: Record<ServiceOrderStatus, string> = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  done: "Hoàn thành",
  error: "Lỗi",
  refund_error: "Đã hoàn tiền",
};

type Filters = { requestId: string; characterName: string; currencyType: string; status: string };
const emptyFilters: Filters = { requestId: "", characterName: "", currencyType: "", status: "" };

export function CollaboratorCurrencyOrdersManager() {
  const [result, setResult] = useState<PageResponse<GameCurrencyOrder> | null>(null);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), size: "20" });
    Object.entries(appliedFilters).forEach(([key, value]) => { if (value.trim()) params.set(key, value.trim()); });
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/collaborator-currency-orders?${params}`, { cache: "no-store" });
      const data = await readJson(response);
      if (!response.ok) throw new Error(getApiErrorMessage(data, "Không tải được đơn Vàng/Ngọc."));
      setResult(data as PageResponse<GameCurrencyOrder>);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không tải được đơn Vàng/Ngọc.");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(0);
    setAppliedFilters({ ...filters });
  }

  function clear() {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(0);
  }

  const orders = result?.content ?? [];
  return <main className="role-dashboard">
    <CollaboratorSidebar active="currency-orders" />
    <section className="role-main collaborator-role-main ctv-currency-orders-main">
      <header className="role-topbar backoffice-users-header">
        <div><p className="section-kicker">ĐƠN BÁN CỦA CTV</p><h1>Đơn Vàng &amp; Ngọc</h1><p className="role-subtitle">Theo dõi đơn, chiết khấu và tiền thực nhận. Trạng thái do tool cập nhật tự động.</p></div>
        <button className="ghost-button h-11 px-5" disabled={loading} onClick={() => void load()} type="button"><RefreshCw size={16} /> Tải lại</button>
      </header>

      <section className="ctv-currency-readonly-note"><ShieldCheck size={19} /><div><strong>Chế độ chỉ xem</strong><span>CTV không thể chỉnh trạng thái đơn Vàng/Ngọc. Tool chỉ hoàn thành đơn đúng với userctv của bạn.</span></div></section>

      <section className="role-panel currency-order-filter-panel">
        <form className="currency-order-filter-grid ctv-currency-order-filters" onSubmit={search}>
          <label><span>Mã đơn</span><input className="text-field" value={filters.requestId} onChange={(event) => setFilters({ ...filters, requestId: event.target.value.toUpperCase() })} /></label>
          <label><span>Tên nhân vật</span><input className="text-field" value={filters.characterName} onChange={(event) => setFilters({ ...filters, characterName: event.target.value })} /></label>
          <label><span>Loại</span><select className="role-select wide" value={filters.currencyType} onChange={(event) => setFilters({ ...filters, currencyType: event.target.value })}><option value="">Tất cả</option><option value="GOLD">Vàng</option><option value="GEM">Ngọc</option></select></label>
          <label><span>Trạng thái</span><select className="role-select wide" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">Tất cả</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <div className="currency-order-filter-actions"><button className="primary-button h-11 px-5" disabled={loading}><Search size={16} /> Tìm kiếm</button><button className="ghost-button h-11 px-4" disabled={loading} onClick={clear} type="button"><X size={16} /> Xóa lọc</button></div>
        </form>
      </section>

      {error ? <p className="admin-users-message error">{error}</p> : null}
      <section className="role-panel role-table-panel backoffice-table-card currency-order-list-panel">
        <div className="role-panel-head"><div><p className="section-kicker">DANH SÁCH</p><h2>{(result?.totalElements ?? 0).toLocaleString("vi-VN")} đơn của tôi</h2></div><Eye size={21} /></div>
        <div className="role-table-wrap"><table className="role-table ctv-currency-orders-table"><thead><tr><th>Thời gian</th><th>Mã đơn / Khách</th><th>Nhân vật</th><th>Server</th><th>Loại</th><th>Thanh toán</th><th>Chiết khấu</th><th>CTV nhận</th><th>Trạng thái</th></tr></thead><tbody>
          {orders.map((order) => <tr key={order.id}>
            <td>{formatDate(order.createdAt)}</td>
            <td><strong>{order.requestId}</strong><small>{order.username || "—"}</small></td>
            <td><strong>{order.characterName}</strong></td>
            <td><strong>{order.serverName}</strong><small>Tool #{order.toolServerIndex}</small></td>
            <td><span className={`currency-type-pill ${order.currencyType.toLowerCase()}`}>{order.currencyType === "GOLD" ? <><Coins size={14} /> {goldSaleTypeLabel(order.goldSaleType)}</> : <><Gem size={14} /> Ngọc</>}</span></td>
            <td><strong>{formatVnd(order.paymentAmount)}</strong></td>
            <td><strong>{order.collaboratorDiscountPercent ?? 0}%</strong></td>
            <td><strong className="ctv-currency-earning">{formatVnd(order.collaboratorEarningAmount ?? order.paymentAmount)}</strong><small>{order.collaboratorPaid ? "Đã cộng ví CTV" : "Chờ hoàn thành"}</small></td>
            <td><span className={`admin-order-status-pill ${order.status}`}>{statusLabels[order.status]}</span></td>
          </tr>)}
        </tbody></table></div>
        {!loading && !orders.length ? <p className="collaborator-service-empty">Chưa có đơn Vàng/Ngọc nào thuộc tài khoản của bạn.</p> : null}
      </section>
      {result && result.totalPages > 1 ? <div className="order-history-pagination"><button disabled={result.first || loading} onClick={() => setPage((value) => Math.max(0, value - 1))}>← Trang trước</button><span>Trang {result.page + 1}/{result.totalPages}</span><button disabled={result.last || loading} onClick={() => setPage((value) => value + 1)}>Trang sau →</button></div> : null}
    </section>
  </main>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

async function readJson(response: Response) {
  try { return await response.json() as unknown; } catch { return null; }
}
