"use client";

import { Eye, ListChecks, RefreshCw, Search, TimerReset, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AdminSidebar } from "@/app/components/admin/admin-sidebar";
import { useAuthSession } from "@/app/components/use-auth-session";
import {
  AdminActiveOrder,
  AdminActiveOrderPage,
  formatVnd,
  getApiErrorMessage,
  ServiceOrderStatus,
} from "@/lib/shop-api";

type Filters = {
  keyword: string;
  kind: string;
  status: string;
  fromDate: string;
  toDate: string;
};

const emptyFilters: Filters = { keyword: "", kind: "", status: "", fromDate: "", toDate: "" };
const statusLabels = { pending: "Chờ xử lý", processing: "Đang xử lý" } as const;

export function AdminActiveOrdersManager() {
  const session = useAuthSession();
  const [result, setResult] = useState<AdminActiveOrderPage | null>(null);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(emptyFilters);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<AdminActiveOrder | null>(null);
  const [nextStatus, setNextStatus] = useState<ServiceOrderStatus>("processing");
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session) return;
    let ignore = false;
    async function load() {
      const params = new URLSearchParams({ page: String(page), size: String(size) });
      Object.entries(appliedFilters).forEach(([key, value]) => value.trim() && params.set(key, value.trim()));
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/admin/active-orders?${params}`);
        const data = await response.json();
        if (!response.ok) throw new Error(getApiErrorMessage(data, "Không tải được đơn cần xử lý."));
        if (!ignore) {
          const nextResult = data as AdminActiveOrderPage;
          if (nextResult.totalPages > 0 && page >= nextResult.totalPages) {
            setPage(nextResult.totalPages - 1);
          } else if (nextResult.totalPages === 0 && page !== 0) {
            setPage(0);
          } else {
            setResult(nextResult);
          }
        }
      } catch (reason) {
        if (!ignore) setError(reason instanceof Error ? reason.message : "Không tải được đơn cần xử lý.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [appliedFilters, page, refreshKey, session, size]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(0);
    setAppliedFilters({ ...filters, keyword: filters.keyword.trim() });
  }

  function clearFilters() {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(0);
  }

  function openDetail(order: AdminActiveOrder) {
    setSelectedOrder(order);
    setNextStatus(order.status === "pending" ? "processing" : "done");
    setAdminNote(order.adminNote ?? "");
    setError("");
  }

  async function updateStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOrder) return;
    setSaving(true);
    setError("");
    const resource = selectedOrder.kind === "CURRENCY" ? "currency-orders" : "orders";
    try {
      const response = await fetch(`/api/admin/${resource}/${encodeURIComponent(selectedOrder.id)}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, adminNote: adminNote.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(getApiErrorMessage(data, "Không cập nhật được trạng thái."));
      setSelectedOrder(null);
      setRefreshKey((value) => value + 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không cập nhật được trạng thái.");
    } finally {
      setSaving(false);
    }
  }

  const orders = result?.content ?? [];
  return (
    <main className="role-dashboard">
      <AdminSidebar active="active-orders" />
      <section className="role-main backoffice-users-main active-orders-main">
        <header className="role-topbar backoffice-users-header">
          <div><p className="section-kicker">Điều phối đơn</p><h1>Đơn cần xử lý</h1></div>
          <button className="primary-button h-11 px-5" disabled={loading} onClick={() => setRefreshKey((value) => value + 1)} type="button">
            <RefreshCw size={16} /> Tải lại
          </button>
        </header>

        <section className="active-order-metrics">
          <article><span><ListChecks size={20} /></span><div><p>Tổng đơn đang mở</p><strong>{(result?.totalElements ?? 0).toLocaleString("vi-VN")}</strong></div></article>
          <article className="pending"><span><TimerReset size={20} /></span><div><p>Đang chờ</p><strong>{(result?.pendingCount ?? 0).toLocaleString("vi-VN")}</strong></div></article>
          <article className="processing"><span><RefreshCw size={20} /></span><div><p>Đang xử lý</p><strong>{(result?.processingCount ?? 0).toLocaleString("vi-VN")}</strong></div></article>
        </section>

        <section className="role-panel currency-order-filter-panel active-order-filter-panel">
          <div className="currency-order-filter-head"><div><strong>Tìm kiếm đơn</strong><span>Gồm dịch vụ game, Carot, Thỏi vàng và Ngọc</span></div></div>
          <form className="currency-order-filter-grid active-order-filter-grid" onSubmit={submitSearch}>
            <label><span>Từ khóa</span><input className="text-field" placeholder="Mã đơn, khách hàng, tài khoản, server..." value={filters.keyword} onChange={(event) => setFilters({ ...filters, keyword: event.target.value })} /></label>
            <label><span>Nhóm đơn</span><select className="role-select wide" value={filters.kind} onChange={(event) => setFilters({ ...filters, kind: event.target.value })}><option value="">Tất cả dịch vụ</option><option value="SERVICE">Dịch vụ game / Carot</option><option value="CURRENCY">Thỏi vàng / Ngọc</option></select></label>
            <label><span>Trạng thái</span><select className="role-select wide" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">Chờ và đang xử lý</option><option value="pending">Chờ xử lý</option><option value="processing">Đang xử lý</option></select></label>
            <label><span>Từ ngày</span><input className="text-field" type="date" value={filters.fromDate} onChange={(event) => setFilters({ ...filters, fromDate: event.target.value })} /></label>
            <label><span>Đến ngày</span><input className="text-field" min={filters.fromDate || undefined} type="date" value={filters.toDate} onChange={(event) => setFilters({ ...filters, toDate: event.target.value })} /></label>
            <div className="currency-order-filter-actions"><button className="primary-button h-11 px-5" disabled={loading} type="submit"><Search size={16} /> Tìm kiếm</button><button className="ghost-button h-11 px-4" disabled={loading} onClick={clearFilters} type="button"><X size={16} /> Xóa lọc</button></div>
          </form>
          <div className="active-order-filter-footer"><strong>{(result?.totalElements ?? 0).toLocaleString("vi-VN")} đơn cần xử lý</strong><label>Số dòng <select className="role-select" value={size} onChange={(event) => { setSize(Number(event.target.value)); setPage(0); }}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></label></div>
        </section>

        {error ? <p className="admin-users-message error">{error}</p> : null}
        <section className="role-panel role-table-panel active-order-list-panel">
          <div className="role-panel-head"><div><p className="section-kicker">Danh sách</p><h2>Tất cả đơn đang mở</h2></div><span className="active-order-page-pill">Trang {(result?.page ?? page) + 1}</span></div>
          <div className="role-table-wrap"><table className="role-table active-orders-table"><thead><tr><th>Thời gian</th><th>Mã đơn</th><th>Dịch vụ</th><th>Khách hàng</th><th>Tài khoản nhận</th><th>Server</th><th>Thanh toán</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>
            {orders.map((order) => <tr key={`${order.kind}-${order.id}`}><td><strong>{formatDate(order.createdAt)}</strong></td><td><strong>{order.requestId}</strong><small>{order.kind === "CURRENCY" ? "Vàng & Ngọc" : "Dịch vụ"}</small></td><td><strong>{order.serviceName}</strong></td><td><strong>{order.customerUsername || "—"}</strong></td><td><strong>{order.accountName || "—"}</strong></td><td><strong>{order.serverName || "—"}</strong></td><td><strong>{formatVnd(order.paymentAmount)}</strong></td><td><span className={`admin-order-status-pill ${order.status}`}>{statusLabels[order.status]}</span></td><td><button className="ghost-button active-order-detail-button" onClick={() => openDetail(order)} type="button"><Eye size={16} /> Chi tiết</button></td></tr>)}
          </tbody></table></div>
          {!loading && !orders.length ? <p className="admin-users-message">Không có đơn nào đang chờ hoặc đang xử lý.</p> : null}
          {result && result.totalPages > 1 ? <div className="activity-log-pagination"><button disabled={result.first || loading} onClick={() => setPage((value) => Math.max(0, value - 1))}>‹ Trang trước</button><span>Trang {result.page + 1}/{result.totalPages}</span><button disabled={result.last || loading} onClick={() => setPage((value) => value + 1)}>Trang sau ›</button></div> : null}
        </section>
      </section>

      {selectedOrder && typeof document !== "undefined" ? createPortal(
        <div className="admin-user-modal" role="presentation"><button aria-label="Đóng" className="admin-user-modal-backdrop" onClick={() => !saving && setSelectedOrder(null)} type="button" /><section aria-modal="true" className="admin-user-modal-panel admin-order-detail-panel active-order-detail-modal" role="dialog"><div className="admin-order-detail-header"><div className="admin-order-detail-title"><p className="section-kicker">Chi tiết đơn đang mở</p><h2>{selectedOrder.requestId}</h2></div><button className="admin-user-modal-close" disabled={saving} onClick={() => setSelectedOrder(null)} type="button"><X size={18} /></button></div><div className="active-order-detail-grid"><Detail label="Dịch vụ" value={selectedOrder.serviceName} /><Detail label="Khách hàng" value={selectedOrder.customerUsername || "Không có"} /><Detail label="Tài khoản nhận" value={selectedOrder.accountName || "Không có"} /><Detail label="Server" value={selectedOrder.serverName || "Không có"} /><Detail label="Thanh toán" value={formatVnd(selectedOrder.paymentAmount)} /><Detail label="Thực nhận" value={selectedOrder.receivedAmount == null ? "Theo gói dịch vụ" : selectedOrder.receivedAmount.toLocaleString("vi-VN")} /><Detail label="Tạo lúc" value={formatDate(selectedOrder.createdAt)} /><Detail label="Trạng thái" value={statusLabels[selectedOrder.status]} /></div><form className="active-order-status-form" onSubmit={updateStatus}><label><span>Chuyển trạng thái</span><select className="role-select wide" value={nextStatus} onChange={(event) => setNextStatus(event.target.value as ServiceOrderStatus)}>{selectedOrder.status === "pending" ? <option value="processing">Đang xử lý</option> : null}<option value="done">Hoàn thành</option><option value="error">Lỗi</option><option value="refund_error">Lỗi hoàn tiền</option></select></label><label><span>Ghi chú admin</span><textarea className="text-field" rows={3} value={adminNote} onChange={(event) => setAdminNote(event.target.value)} /></label><div><button className="ghost-button" disabled={saving} onClick={() => setSelectedOrder(null)} type="button">Hủy</button><button className="primary-button" disabled={saving} type="submit">{saving ? "Đang lưu..." : "Cập nhật trạng thái"}</button></div></form></section></div>, document.body) : null}
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)); }
