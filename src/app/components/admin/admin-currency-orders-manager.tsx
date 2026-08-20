"use client";

import { RefreshCw, Search, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { AdminSidebar } from "@/app/components/admin/admin-sidebar";
import { useAuthSession } from "@/app/components/use-auth-session";
import { formatVnd, GameCurrencyOrder, getApiErrorMessage, PageResponse, ServiceOrderStatus } from "@/lib/shop-api";

const labels: Record<ServiceOrderStatus, string> = { error: "Lỗi", pending: "Chờ xử lý", processing: "Đang xử lý", done: "Hoàn thành" };
const terminalStatuses: ServiceOrderStatus[] = ["error", "done"];
type OrderFilters = { requestId: string; username: string; characterName: string; serverName: string; currencyType: string; status: string };
const emptyFilters: OrderFilters = { requestId: "", username: "", characterName: "", serverName: "", currencyType: "", status: "" };

export function AdminCurrencyOrdersManager() {
  const session = useAuthSession();
  const [result, setResult] = useState<PageResponse<GameCurrencyOrder> | null>(null);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<OrderFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<OrderFilters>(emptyFilters);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    let ignore = false;
    async function load() {
      const params = new URLSearchParams({ page: String(page), size: "10" });
      Object.entries(appliedFilters).forEach(([key, value]) => {
        if (value.trim()) params.set(key, value.trim());
      });
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/admin/currency-orders?${params}`, { headers: authHeaders(session!.token) });
        const data = await response.json();
        if (!response.ok) throw new Error(getApiErrorMessage(data, "Không tải được đơn Vàng/Ngọc."));
        if (!ignore) setResult(data as PageResponse<GameCurrencyOrder>);
      } catch (reason) {
        if (!ignore) setError(reason instanceof Error ? reason.message : "Không tải được đơn.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [appliedFilters, page, refreshKey, session]);

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

  async function updateStatus(order: GameCurrencyOrder, nextStatus: ServiceOrderStatus) {
    if (!session) return;
    const adminNote = window.prompt("Ghi chú cho user (có thể để trống):", order.adminNote ?? "");
    if (adminNote === null) return;
    setUpdatingId(order.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/currency-orders/${order.id}/status`, {
        method: "PUT", headers: { ...authHeaders(session.token), "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, adminNote }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(getApiErrorMessage(data, "Không cập nhật được trạng thái."));
      setRefreshKey((value) => value + 1);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không cập nhật được trạng thái."); }
    finally { setUpdatingId(""); }
  }

  const orders = result?.content ?? [];
  return <main className="role-dashboard">
    <AdminSidebar active="currency-orders" />
    <section className="role-main backoffice-users-main">
      <header className="role-topbar backoffice-users-header"><div><p className="section-kicker">Vàng & Ngọc</p><h1>Quản lý đơn nạp</h1></div>
        <button className="primary-button h-11 px-5" disabled={loading} onClick={() => setRefreshKey((value) => value + 1)}><RefreshCw size={16} /> Tải lại</button>
      </header>
      <section className="role-panel currency-order-filter-panel">
        <div className="currency-order-filter-head"><div><strong>Tìm kiếm đơn hàng</strong><span>{(result?.totalElements ?? 0).toLocaleString("vi-VN")} kết quả</span></div></div>
        <form className="currency-order-filter-grid" onSubmit={searchOrders}>
          <label><span>Mã đơn</span><input className="text-field" maxLength={15} placeholder="Nhập mã 15 ký tự" value={filters.requestId} onChange={(event) => setFilters({ ...filters, requestId: event.target.value.toUpperCase() })} /></label>
          <label><span>Tên user</span><input className="text-field" placeholder="Nhập username" value={filters.username} onChange={(event) => setFilters({ ...filters, username: event.target.value })} /></label>
          <label><span>Tên nhân vật</span><input className="text-field" placeholder="Nhập tên nhân vật" value={filters.characterName} onChange={(event) => setFilters({ ...filters, characterName: event.target.value })} /></label>
          <label><span>Server</span><input className="text-field" placeholder="Nhập tên server" value={filters.serverName} onChange={(event) => setFilters({ ...filters, serverName: event.target.value })} /></label>
          <label><span>Loại</span><select className="role-select wide" value={filters.currencyType} onChange={(event) => setFilters({ ...filters, currencyType: event.target.value })}><option value="">Tất cả loại</option><option value="GOLD">Vàng</option><option value="GEM">Ngọc</option></select></label>
          <label><span>Trạng thái</span><select className="role-select wide" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">Tất cả trạng thái</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <div className="currency-order-filter-actions"><button className="primary-button h-11 px-5" disabled={loading} type="submit"><Search size={16} /> Tìm kiếm</button><button className="ghost-button h-11 px-4" disabled={loading} onClick={clearFilters} type="button"><X size={16} /> Xóa lọc</button></div>
        </form>
      </section>
      {error ? <p className="admin-users-message error">{error}</p> : null}
      <section className="role-panel role-table-panel backoffice-table-card currency-order-list-panel"><div className="role-panel-head"><div><p className="section-kicker">Danh sách</p><h2>Đơn nạp Vàng & Ngọc</h2></div><div className="currency-order-list-meta"><strong>{(result?.totalElements ?? 0).toLocaleString("vi-VN")} đơn</strong><span>{loading ? "Đang tải" : `Trang ${(result?.page ?? page) + 1}`}</span></div></div>
        <div className="role-table-wrap"><table className="role-table currency-orders-table"><thead><tr><th>Thời gian</th><th>Mã đơn</th><th>Tên user</th><th>Tên nhân vật</th><th>Server</th><th>Loại</th><th>Thanh toán</th><th>Thực nhận</th><th>Trạng thái</th><th>Ghi chú</th><th>Xử lý</th></tr></thead><tbody>
          {orders.map((order) => <tr key={order.id}>
            <td className="currency-date-cell"><strong>{formatDate(order.createdAt)}</strong></td>
            <td className="currency-code-cell"><strong title={order.requestId}>{order.requestId}</strong></td>
            <td className="currency-user-cell"><strong>{order.username || "—"}</strong></td>
            <td><strong>{order.characterName}</strong></td>
            <td><strong>{order.serverName}</strong></td>
            <td><span className={`currency-type-pill ${order.currencyType.toLowerCase()}`}>{order.currencyType === "GOLD" ? "Vàng" : "Ngọc"}</span></td>
            <td className="currency-money-cell"><strong>{formatVnd(order.paymentAmount)}</strong></td>
            <td className="currency-amount-cell"><strong>{order.receivedAmount.toLocaleString("vi-VN")}</strong></td>
            <td><span className={`admin-order-status-pill ${order.status.toLowerCase()}`}>{labels[order.status]}</span></td>
            <td className="currency-note-cell"><span title={order.adminNote ?? ""}>{order.adminNote || "—"}</span></td>
            <td>{terminalStatuses.includes(order.status) ? <span className="currency-ended-label">Đã kết thúc</span> : <select className="role-select" disabled={updatingId === order.id} defaultValue="" onChange={(event) => event.target.value && updateStatus(order, event.target.value as ServiceOrderStatus)}><option value="">Cập nhật</option>{order.status === "pending" ? <option value="processing">Đang xử lý</option> : null}<option value="done">Hoàn thành</option><option value="error">Lỗi</option></select>}</td>
          </tr>)}
        </tbody></table></div>
        {!loading && !orders.length ? <p className="admin-users-message">Chưa có đơn phù hợp.</p> : null}
      </section>
      {result && result.totalPages > 1 ? <div className="order-history-pagination"><button disabled={result.first || loading} onClick={() => setPage((value) => Math.max(0, value - 1))}>← Trang trước</button><span>Trang {result.page + 1}/{result.totalPages}</span><button disabled={result.last || loading} onClick={() => setPage((value) => value + 1)}>Trang sau →</button></div> : null}
    </section>
  </main>;
}

function authHeaders(token: string) { return { Authorization: `Bearer ${token}` }; }
function formatDate(value: string) { return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)); }
