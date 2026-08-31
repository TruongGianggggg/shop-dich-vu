"use client";

import {
  CirclePower,
  CloudCog,
  Copy,
  Eye,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  RotateCw,
  Save,
  Search,
  ServerCog,
  ShieldAlert,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AdminSidebar } from "@/app/components/admin/admin-sidebar";
import {
  formatVnd,
  getApiErrorMessage,
  PageResponse,
  VpsCredentials,
  VpsOrder,
  VpsOrderStatus,
  VpsPlan,
  VpsPlanPayload,
  VpsProviderInfo,
} from "@/lib/shop-api";
import styles from "@/app/components/vps/vps.module.css";

type Tab = "orders" | "plans";
const emptyPlan: VpsPlanPayload = {
  providerProductId: "",
  name: "",
  description: "",
  billingCycle: "",
  price: 0,
  addonCpuPrice: 0,
  addonRamPrice: 0,
  addonDiskPricePer10Gb: 0,
  active: false,
  displayOrder: 0,
};

const statusLabel: Record<VpsOrderStatus, string> = {
  PENDING: "Đang tạo",
  ACTIVE: "Hoạt động",
  REVIEW: "Cần đối soát",
  FAILED: "Thất bại",
  EXPIRED: "Hết hạn",
  CANCELLED: "Đã hủy",
};

export function AdminVpsManager() {
  const [tab, setTab] = useState<Tab>("orders");
  const [provider, setProvider] = useState<VpsProviderInfo | null>(null);
  const [plans, setPlans] = useState<VpsPlan[]>([]);
  const [orders, setOrders] = useState<VpsOrder[]>([]);
  const [orderPage, setOrderPage] = useState<PageResponse<VpsOrder> | null>(null);
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [status, setStatus] = useState<"" | VpsOrderStatus>("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState<VpsPlanPayload>(emptyPlan);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<VpsOrder | null>(null);
  const [credentials, setCredentials] = useState<VpsCredentials | null>(null);

  const loadOverview = useCallback(async () => {
    const [providerResponse, plansResponse] = await Promise.all([
      fetch("/api/admin/vps/provider-info", { cache: "no-store" }),
      fetch("/api/admin/vps/plans", { cache: "no-store" }),
    ]);
    const [providerData, plansData] = await Promise.all([readJson(providerResponse), readJson(plansResponse)]);
    if (!plansResponse.ok) throw new Error(getApiErrorMessage(plansData, "Không tải được gói VPS."));
    setPlans(Array.isArray(plansData) ? (plansData as VpsPlan[]) : []);
    if (providerResponse.ok) setProvider(providerData as VpsProviderInfo);
    else setProvider(null);
  }, []);

  const loadOrders = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), size: "20" });
    if (appliedKeyword) params.set("keyword", appliedKeyword);
    if (status) params.set("status", status);
    const response = await fetch(`/api/admin/vps/orders?${params}`, { cache: "no-store" });
    const data = await readJson(response);
    if (!response.ok) throw new Error(getApiErrorMessage(data, "Không tải được đơn VPS."));
    const result = data as PageResponse<VpsOrder>;
    setOrderPage(result);
    setOrders(result.content ?? []);
  }, [appliedKeyword, page, status]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await Promise.all([loadOverview(), loadOrders()]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không tải được quản lý VPS.");
    } finally {
      setLoading(false);
    }
  }, [loadOrders, loadOverview]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const metrics = useMemo(() => [
    { label: "Số dư Agency", value: provider?.credit == null ? "—" : formatVnd(provider.credit), tone: "blue" },
    { label: "Tổng VPS", value: String(provider?.totalService ?? orderPage?.totalElements ?? 0), tone: "green" },
    { label: "Gói đang bán", value: String(plans.filter((plan) => plan.active).length), tone: "amber" },
    { label: "Cần đối soát", value: String(orders.filter((order) => order.status === "REVIEW").length), tone: "rose" },
  ], [orderPage?.totalElements, orders, plans, provider]);

  function openCreatePlan() {
    setEditingId(null);
    setPlanForm(emptyPlan);
    setShowPlanForm(true);
  }

  function openEditPlan(plan: VpsPlan) {
    setEditingId(plan.id);
    setPlanForm({
      providerProductId: plan.providerProductId,
      name: plan.name,
      description: plan.description,
      billingCycle: plan.billingCycle,
      price: plan.price,
      addonCpuPrice: plan.addonCpuPrice,
      addonRamPrice: plan.addonRamPrice,
      addonDiskPricePer10Gb: plan.addonDiskPricePer10Gb,
      active: plan.active,
      displayOrder: plan.displayOrder,
    });
    setShowPlanForm(true);
  }

  async function savePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const url = editingId ? `/api/admin/vps/plans/${encodeURIComponent(editingId)}` : "/api/admin/vps/plans";
      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planForm),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(getApiErrorMessage(data, "Không lưu được gói VPS."));
      setNotice(editingId ? "Đã cập nhật gói VPS." : "Đã tạo gói VPS.");
      setShowPlanForm(false);
      await loadOverview();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không lưu được gói VPS.");
    } finally {
      setBusy(false);
    }
  }

  async function syncPlans() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/vps/plans/sync", { method: "POST" });
      const data = await readJson(response) as { created?: number; updated?: number };
      if (!response.ok) throw new Error(getApiErrorMessage(data, "Không đồng bộ được sản phẩm Agency."));
      setNotice(`Đồng bộ xong: ${data.created ?? 0} gói mới, ${data.updated ?? 0} gói cập nhật.`);
      await loadOverview();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không đồng bộ được sản phẩm Agency.");
    } finally {
      setBusy(false);
    }
  }

  async function revealCredentials(order: VpsOrder) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/vps/orders/${encodeURIComponent(order.id)}/credentials`, { cache: "no-store" });
      const data = await readJson(response);
      if (!response.ok) throw new Error(getApiErrorMessage(data, "Không lấy được thông tin đăng nhập."));
      setCredentials(data as VpsCredentials);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không lấy được thông tin đăng nhập.");
    } finally {
      setBusy(false);
    }
  }

  async function runAction(order: VpsOrder, action: string, label: string) {
    if (!window.confirm(`Xác nhận ${label.toLowerCase()} VPS ${order.ipAddress ?? order.requestId}?`)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/vps/orders/${encodeURIComponent(order.id)}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(getApiErrorMessage(data, `Không thể ${label.toLowerCase()} VPS.`));
      setNotice(getApiErrorMessage(data, `${label} VPS thành công.`));
      await loadOrders();
      setSelectedOrder(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Thao tác VPS thất bại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="role-dashboard">
      <AdminSidebar active="vps" />
      <section className={`role-main ${styles.adminMain}`}>
        <header className="role-topbar">
          <div><p className="section-kicker">VPS Agency</p><h1>Quản lý VPS</h1></div>
          <div className="role-topbar-actions">
            <button className="ghost-button h-11 px-4" disabled={busy} onClick={() => void syncPlans()} type="button"><CloudCog size={16} /> Đồng bộ Agency</button>
            <button className="primary-button h-11 px-4" disabled={loading} onClick={() => void load()} type="button"><RefreshCw size={16} /> Tải lại</button>
          </div>
        </header>

        <div className={`${styles.providerBanner} ${provider?.configured ? styles.connected : styles.disconnected}`}>
          {provider?.configured ? <ServerCog size={21} /> : <ShieldAlert size={21} />}
          <div>
            <strong>{provider?.configured ? provider.agencyName || "VPS Agency đã kết nối" : "API VPS Agency chưa cấu hình"}</strong>
            <span>{provider?.configured ? "Thông tin xác thực chỉ được lưu và sử dụng tại Spring Boot." : "Điền các biến VPS_AGENCY_* trong môi trường local để kết nối thật."}</span>
          </div>
        </div>

        {error ? <div className={`${styles.alert} ${styles.error}`} role="alert">{error}</div> : null}
        {notice ? <div className={`${styles.alert} ${styles.success}`} role="status">{notice}</div> : null}

        <section className="role-metric-grid">
          {metrics.map((metric) => <article className={`role-metric-card tone-${metric.tone}`} key={metric.label}><p>{metric.label}</p><strong>{metric.value}</strong><span>Dữ liệu VPS Agency</span></article>)}
        </section>

        <div className={styles.adminTabs} role="tablist">
          <button aria-selected={tab === "orders"} onClick={() => setTab("orders")} role="tab" type="button">Đơn hàng VPS</button>
          <button aria-selected={tab === "plans"} onClick={() => setTab("plans")} role="tab" type="button">Gói VPS & giá bán</button>
        </div>

        {tab === "orders" ? (
          <section className="role-panel role-table-panel">
            <div className="role-panel-head">
              <div><p className="section-kicker">Đơn hàng</p><h2>Lịch sử mua VPS</h2></div>
              <form className={styles.adminFilters} onSubmit={(event) => { event.preventDefault(); setPage(0); setAppliedKeyword(keyword.trim()); }}>
                <input onChange={(event) => setKeyword(event.target.value)} placeholder="Mã đơn, khách, IP, VPS ID" value={keyword} />
                <select onChange={(event) => { setPage(0); setStatus(event.target.value as "" | VpsOrderStatus); }} value={status}>
                  <option value="">Tất cả trạng thái</option>
                  {Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <button type="submit"><Search size={15} /> Lọc</button>
              </form>
            </div>
            <div className="role-table-wrap">
              <table className="role-table">
                <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Gói VPS</th><th>IP / VPS ID</th><th>Giá</th><th>Trạng thái</th><th /></tr></thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td><strong>{order.requestId}</strong><small className={styles.tableSub}>{formatDateTime(order.createdAt)}</small></td>
                      <td>{order.customerUsername}</td>
                      <td>{order.planName}<small className={styles.tableSub}>{order.billingCycle} · OS #{order.osId}</small></td>
                      <td>{order.ipAddress ?? "Chưa cấp"}<small className={styles.tableSub}>{order.providerVpsId ?? "—"}</small></td>
                      <td><strong>{formatVnd(order.amount)}</strong></td>
                      <td><span className={`${styles.status} ${styles[`status${order.status}`]}`}>{statusLabel[order.status]}</span></td>
                      <td><button className={styles.iconButton} onClick={() => { setSelectedOrder(order); setCredentials(null); }} title="Xem chi tiết" type="button"><Eye size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!loading && !orders.length ? <div className={styles.empty}><ServerCog size={32} /><h3>Chưa có đơn VPS</h3></div> : null}
            <div className={styles.pagination}>
              <button disabled={page <= 0} onClick={() => setPage((value) => Math.max(0, value - 1))} type="button">Trang trước</button>
              <span>Trang {(orderPage?.page ?? 0) + 1} / {Math.max(orderPage?.totalPages ?? 1, 1)}</span>
              <button disabled={orderPage?.last ?? true} onClick={() => setPage((value) => value + 1)} type="button">Trang sau</button>
            </div>
          </section>
        ) : (
          <section className="role-panel role-table-panel">
            <div className="role-panel-head">
              <div><p className="section-kicker">Catalog</p><h2>Gói VPS & giá bán</h2></div>
              <button className="primary-button h-10 px-4" onClick={openCreatePlan} type="button"><Plus size={16} /> Thêm gói</button>
            </div>
            <div className="role-table-wrap">
              <table className="role-table">
                <thead><tr><th>Thứ tự</th><th>Gói</th><th>Product ID</th><th>Chu kỳ</th><th>Giá bán</th><th>Trạng thái</th><th /></tr></thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan.id}>
                      <td>{plan.displayOrder}</td><td><strong>{plan.name}</strong><small className={styles.tableSub}>{plan.description || "Chưa có mô tả"}</small></td>
                      <td><code>{plan.providerProductId}</code></td><td>{plan.billingCycle || "Chưa cấu hình"}</td><td><strong>{formatVnd(plan.price)}</strong></td>
                      <td><span className={`${styles.planState} ${plan.active ? styles.planActive : ""}`}>{plan.active ? "Đang bán" : "Đang ẩn"}</span></td>
                      <td><button className={styles.iconButton} onClick={() => openEditPlan(plan)} title="Sửa gói" type="button"><Pencil size={15} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </section>

      {showPlanForm ? (
        <div className={styles.modalBackdrop} role="presentation">
          <form className={styles.modal} onSubmit={savePlan}>
            <header><div><p>GÓI VPS</p><h2>{editingId ? "Cập nhật gói VPS" : "Thêm gói VPS"}</h2></div><button disabled={busy} onClick={() => setShowPlanForm(false)} type="button"><X size={19} /></button></header>
            <div className={styles.formGrid}>
              <PlanField label="Product ID Agency" required value={planForm.providerProductId} onChange={(value) => setPlanForm((current) => ({ ...current, providerProductId: value }))} />
              <PlanField label="Tên gói" required value={planForm.name} onChange={(value) => setPlanForm((current) => ({ ...current, name: value }))} />
              <PlanField label="Chu kỳ thuê" placeholder="monthly / 1-month..." required value={planForm.billingCycle} onChange={(value) => setPlanForm((current) => ({ ...current, billingCycle: value }))} />
              <PlanNumber label="Giá bán" value={planForm.price} onChange={(value) => setPlanForm((current) => ({ ...current, price: value }))} />
              <PlanNumber label="Giá / CPU thêm" value={planForm.addonCpuPrice} onChange={(value) => setPlanForm((current) => ({ ...current, addonCpuPrice: value }))} />
              <PlanNumber label="Giá / RAM thêm" value={planForm.addonRamPrice} onChange={(value) => setPlanForm((current) => ({ ...current, addonRamPrice: value }))} />
              <PlanNumber label="Giá / 10 GB đĩa" value={planForm.addonDiskPricePer10Gb} onChange={(value) => setPlanForm((current) => ({ ...current, addonDiskPricePer10Gb: value }))} />
              <PlanNumber label="Thứ tự hiển thị" value={planForm.displayOrder} onChange={(value) => setPlanForm((current) => ({ ...current, displayOrder: value }))} />
              <label className={styles.fullField}><span>Mô tả</span><textarea onChange={(event) => setPlanForm((current) => ({ ...current, description: event.target.value }))} rows={4} value={planForm.description} /></label>
              <label className={styles.checkbox}><input checked={planForm.active} onChange={(event) => setPlanForm((current) => ({ ...current, active: event.target.checked }))} type="checkbox" /> Mở bán gói này</label>
            </div>
            <footer><button disabled={busy} onClick={() => setShowPlanForm(false)} type="button">Hủy</button><button className={styles.saveButton} disabled={busy} type="submit">{busy ? <LoaderCircle className={styles.spin} size={16} /> : <Save size={16} />} Lưu gói VPS</button></footer>
          </form>
        </div>
      ) : null}

      {selectedOrder ? (
        <div className={styles.modalBackdrop} role="presentation">
          <section className={`${styles.modal} ${styles.orderModal}`}>
            <header><div><p>CHI TIẾT ĐƠN</p><h2>{selectedOrder.requestId}</h2></div><button disabled={busy} onClick={() => setSelectedOrder(null)} type="button"><X size={19} /></button></header>
            <dl className={styles.detailGrid}>
              <Detail label="Khách hàng" value={selectedOrder.customerUsername} /><Detail label="Gói VPS" value={selectedOrder.planName} />
              <Detail label="IP" value={selectedOrder.ipAddress ?? "Chưa cấp"} /><Detail label="VPS ID" value={selectedOrder.providerVpsId ?? "—"} />
              <Detail label="Trạng thái" value={statusLabel[selectedOrder.status]} /><Detail label="Trạng thái máy" value={selectedOrder.providerStatus ?? "—"} />
              <Detail label="Thanh toán" value={formatVnd(selectedOrder.amount)} /><Detail label="Hết hạn" value={formatDateTime(selectedOrder.nextDueAt)} />
            </dl>
            {selectedOrder.providerMessage ? <p className={styles.providerMessage}>{selectedOrder.providerMessage}</p> : null}
            {credentials ? <div className={styles.adminCredentials}><Credential label="Tài khoản" value={credentials.username} /><Credential label="Mật khẩu" value={credentials.password} /></div> : null}
            <footer className={styles.actionFooter}>
              {selectedOrder.status === "ACTIVE" ? <>
                <button disabled={busy} onClick={() => void revealCredentials(selectedOrder)} type="button"><Eye size={15} /> Xem đăng nhập</button>
                <button disabled={busy} onClick={() => void runAction(selectedOrder, "on", "Bật")} type="button"><CirclePower size={15} /> Bật</button>
                <button disabled={busy} onClick={() => void runAction(selectedOrder, "restart", "Khởi động lại")} type="button"><RotateCw size={15} /> Khởi động lại</button>
                <button disabled={busy} onClick={() => void runAction(selectedOrder, "off", "Tắt")} type="button"><CirclePower size={15} /> Tắt</button>
                <button className={styles.dangerButton} disabled={busy} onClick={() => void runAction(selectedOrder, "cancel", "Hủy")} type="button">Hủy VPS</button>
              </> : <span>Không có thao tác trực tiếp cho trạng thái này.</span>}
            </footer>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function PlanField({ label, value, onChange, required = false, placeholder = "" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; placeholder?: string }) {
  return <label><span>{label}</span><input onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} value={value} /></label>;
}
function PlanNumber({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label><span>{label}</span><input min="0" onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))} type="number" value={value} /></label>;
}
function Detail({ label, value }: { label: string; value: string }) { return <div><dt>{label}</dt><dd>{value}</dd></div>; }
function Credential({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><code>{value}</code><button onClick={() => void navigator.clipboard.writeText(value)} type="button"><Copy size={14} /></button></div>; }
function formatDateTime(value: string | null) { return value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value)) : "—"; }
async function readJson(response: Response) { const text = await response.text(); if (!text) return {}; try { return JSON.parse(text) as unknown; } catch { return { message: text }; } }
