"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminSidebar } from "@/app/components/admin/admin-sidebar";
import { useAuthSession } from "@/app/components/use-auth-session";
import { formatVnd, GameCurrencyOrder, getApiErrorMessage, PageResponse, ServiceOrderStatus } from "@/lib/shop-api";

const labels: Record<ServiceOrderStatus, string> = { PENDING: "Chờ xử lý", PROCESSING: "Đang xử lý", COMPLETED: "Hoàn thành", FAILED: "Thất bại", CANCELED: "Đã hủy" };
const terminalStatuses: ServiceOrderStatus[] = ["COMPLETED", "FAILED", "CANCELED"];

export function AdminCurrencyOrdersManager() {
  const session = useAuthSession();
  const [result, setResult] = useState<PageResponse<GameCurrencyOrder> | null>(null);
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("");
  const [currencyType, setCurrencyType] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    let ignore = false;
    async function load() {
      const params = new URLSearchParams({ page: String(page), size: "10" });
      if (status) params.set("status", status);
      if (currencyType) params.set("currencyType", currencyType);
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
  }, [currencyType, page, refreshKey, session, status]);

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
      <section className="role-panel admin-users-toolbar currency-order-toolbar">
        <strong>{(result?.totalElements ?? 0).toLocaleString("vi-VN")} đơn</strong>
        <select className="role-select" value={currencyType} onChange={(event) => { setCurrencyType(event.target.value); setPage(0); }}><option value="">Tất cả loại</option><option value="GOLD">Vàng</option><option value="GEM">Ngọc</option></select>
        <select className="role-select" value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); }}><option value="">Tất cả trạng thái</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      </section>
      {error ? <p className="admin-users-message error">{error}</p> : null}
      <section className="role-panel role-table-panel backoffice-table-card"><div className="role-panel-head"><div><p className="section-kicker">Danh sách</p><h2>Đơn nạp Vàng & Ngọc</h2></div><span>{loading ? "Đang tải" : `Trang ${(result?.page ?? page) + 1}`}</span></div>
        <div className="role-table-wrap"><table className="role-table currency-orders-table"><thead><tr><th>Thời gian / Mã</th><th>User</th><th>Nhân vật / Server</th><th>Loại</th><th>Thanh toán</th><th>Thực nhận</th><th>Trạng thái</th><th>Xử lý</th></tr></thead><tbody>
          {orders.map((order) => <tr key={order.id}><td><strong>{formatDate(order.createdAt)}</strong><small>{order.requestId}</small></td><td><strong>{order.username || "—"}</strong><small>{order.userId}</small></td><td><strong>{order.characterName}</strong><small>{order.serverName}</small></td><td>{order.currencyType === "GOLD" ? "Vàng" : "Ngọc"}</td><td><strong>{formatVnd(order.paymentAmount)}</strong>{order.walletRefunded ? <small>Đã hoàn tiền</small> : null}</td><td><strong>{order.receivedAmount.toLocaleString("vi-VN")}</strong></td><td><span className={`admin-order-status-pill ${order.status.toLowerCase()}`}>{labels[order.status]}</span>{order.adminNote ? <small>{order.adminNote}</small> : null}</td><td>
            {terminalStatuses.includes(order.status) ? <small>Đã kết thúc</small> : <select className="role-select" disabled={updatingId === order.id} defaultValue="" onChange={(event) => event.target.value && updateStatus(order, event.target.value as ServiceOrderStatus)}><option value="">Cập nhật</option>{order.status === "PENDING" ? <option value="PROCESSING">Đang xử lý</option> : null}<option value="COMPLETED">Hoàn thành</option><option value="FAILED">Thất bại + hoàn tiền</option><option value="CANCELED">Hủy + hoàn tiền</option></select>}
          </td></tr>)}
        </tbody></table></div>
        {!loading && !orders.length ? <p className="admin-users-message">Chưa có đơn phù hợp.</p> : null}
      </section>
      {result && result.totalPages > 1 ? <div className="order-history-pagination"><button disabled={result.first || loading} onClick={() => setPage((value) => Math.max(0, value - 1))}>← Trang trước</button><span>Trang {result.page + 1}/{result.totalPages}</span><button disabled={result.last || loading} onClick={() => setPage((value) => value + 1)}>Trang sau →</button></div> : null}
    </section>
  </main>;
}

function authHeaders(token: string) { return { Authorization: `Bearer ${token}` }; }
function formatDate(value: string) { return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)); }
