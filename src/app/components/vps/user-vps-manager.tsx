"use client";

import {
  CirclePower,
  Copy,
  Eye,
  EyeOff,
  HardDrive,
  LoaderCircle,
  MemoryStick,
  RefreshCw,
  RotateCw,
  Server,
  ShoppingCart,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuthSession } from "@/app/components/use-auth-session";
import {
  formatVnd,
  getApiErrorMessage,
  PageResponse,
  VpsCredentials,
  VpsOptions,
  VpsOrder,
  VpsOrderStatus,
  VpsPlan,
} from "@/lib/shop-api";
import styles from "./vps.module.css";

const statusLabel: Record<VpsOrderStatus, string> = {
  PENDING: "Đang tạo",
  ACTIVE: "Đang hoạt động",
  REVIEW: "Cần đối soát",
  FAILED: "Thất bại",
  EXPIRED: "Hết hạn",
  CANCELLED: "Đã hủy",
};

type UserVpsManagerProps = {
  subCategoryId?: string;
  showHistory?: boolean;
  serviceName?: string;
};

export function UserVpsManager({
  subCategoryId,
  showHistory = true,
  serviceName = "VPS của tôi",
}: UserVpsManagerProps = {}) {
  const session = useAuthSession();
  const [plans, setPlans] = useState<VpsPlan[]>([]);
  const [orders, setOrders] = useState<VpsOrder[]>([]);
  const [options, setOptions] = useState<VpsOptions>({ operatingSystems: [], billingCycles: [] });
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [osId, setOsId] = useState("");
  const [addonCpu, setAddonCpu] = useState(0);
  const [addonRam, setAddonRam] = useState(0);
  const [addonDisk, setAddonDisk] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyOrderId, setBusyOrderId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [credentials, setCredentials] = useState<Record<string, VpsCredentials>>({});

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const [plansResponse, ordersResponse, optionsResponse] = await Promise.all([
        fetch(
          subCategoryId
            ? `/api/vps/plans?subCategoryId=${encodeURIComponent(subCategoryId)}`
            : "/api/vps/plans",
          { cache: "no-store" },
        ),
        fetch("/api/vps/orders?size=50", { cache: "no-store" }),
        fetch("/api/vps/options", { cache: "no-store" }),
      ]);
      const [planData, orderData, optionData] = await Promise.all([
        readJson(plansResponse),
        readJson(ordersResponse),
        readJson(optionsResponse),
      ]);
      if (!plansResponse.ok) throw new Error(getApiErrorMessage(planData, "Không tải được gói VPS."));
      if (!ordersResponse.ok) throw new Error(getApiErrorMessage(orderData, "Không tải được lịch sử VPS."));
      setPlans(Array.isArray(planData) ? (planData as VpsPlan[]) : []);
      setOrders((orderData as PageResponse<VpsOrder>).content ?? []);
      if (optionsResponse.ok) {
        const nextOptions = optionData as VpsOptions;
        setOptions(nextOptions);
        setOsId((current) => current || nextOptions.operatingSystems[0]?.id || "");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không tải được dữ liệu VPS.");
    } finally {
      setLoading(false);
    }
  }, [session, subCategoryId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const effectiveSelectedPlanId = selectedPlanId || plans[0]?.id || "";
  const selectedPlan = plans.find((plan) => plan.id === effectiveSelectedPlanId) ?? null;
  const total = useMemo(() => {
    if (!selectedPlan) return 0;
    return selectedPlan.price
      + addonCpu * selectedPlan.addonCpuPrice
      + addonRam * selectedPlan.addonRamPrice
      + (addonDisk / 10) * selectedPlan.addonDiskPricePer10Gb;
  }, [addonCpu, addonDisk, addonRam, selectedPlan]);

  async function purchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPlan || !Number.isInteger(Number(osId)) || Number(osId) < 1) {
      setError("Vui lòng chọn hệ điều hành hợp lệ.");
      return;
    }
    if (!window.confirm(`Xác nhận mua ${selectedPlan.name} với giá ${formatVnd(total)}?`)) return;
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/vps/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
          osId: Number(osId),
          addonCpu,
          addonRam,
          addonDisk,
        }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(getApiErrorMessage(data, "Không tạo được VPS."));
      const order = data as VpsOrder;
      setNotice(order.status === "ACTIVE"
        ? "VPS đã được tạo thành công."
        : order.status === "FAILED"
          ? "Nhà cung cấp từ chối đơn; số dư đã được hoàn lại."
          : "Đơn đang cần admin đối soát; số dư được giữ nguyên để tránh tạo VPS trùng.");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không tạo được VPS.");
    } finally {
      setSubmitting(false);
    }
  }

  async function revealCredentials(order: VpsOrder) {
    if (credentials[order.id]) {
      setCredentials((current) => {
        const next = { ...current };
        delete next[order.id];
        return next;
      });
      return;
    }
    setBusyOrderId(order.id);
    setError("");
    try {
      const response = await fetch(`/api/vps/orders/${encodeURIComponent(order.id)}/credentials`, { cache: "no-store" });
      const data = await readJson(response);
      if (!response.ok) throw new Error(getApiErrorMessage(data, "Không lấy được thông tin đăng nhập."));
      setCredentials((current) => ({ ...current, [order.id]: data as VpsCredentials }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không lấy được thông tin đăng nhập.");
    } finally {
      setBusyOrderId("");
    }
  }

  async function runAction(order: VpsOrder, action: string, label: string) {
    if (!window.confirm(`Xác nhận ${label.toLowerCase()} VPS ${order.ipAddress ?? order.requestId}?`)) return;
    setBusyOrderId(order.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/vps/orders/${encodeURIComponent(order.id)}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(getApiErrorMessage(data, `Không thể ${label.toLowerCase()} VPS.`));
      setNotice(getApiErrorMessage(data, `${label} VPS thành công.`));
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Thao tác VPS thất bại.");
    } finally {
      setBusyOrderId("");
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p>VPS AGENCY</p>
          <h1>{serviceName}</h1>
          <span>
            {showHistory
              ? "Mua VPS, theo dõi thời hạn và quản lý máy chủ trong một nơi."
              : "Chọn gói VPS, hệ điều hành và cấu hình mở rộng phù hợp với bạn."}
          </span>
        </div>
        <button className={styles.secondaryButton} disabled={loading} onClick={() => void load()} type="button">
          <RefreshCw className={loading ? styles.spin : ""} size={17} /> Làm mới
        </button>
      </section>

      {error ? <div className={`${styles.alert} ${styles.error}`} role="alert">{error}</div> : null}
      {notice ? <div className={`${styles.alert} ${styles.success}`} role="status">{notice}</div> : null}

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div><p>GÓI DỊCH VỤ</p><h2>Chọn cấu hình VPS</h2></div>
          <span>Thanh toán bằng số dư tài khoản</span>
        </div>
        {loading && !plans.length ? <Loading /> : plans.length ? (
          <div className={styles.planGrid}>
            {plans.map((plan) => (
              <button
                className={`${styles.planCard} ${effectiveSelectedPlanId === plan.id ? styles.selected : ""}`}
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                type="button"
              >
                <span><Server size={22} /></span>
                <h3>{plan.name}</h3>
                <p>{plan.description || "Gói VPS được cung cấp tự động qua Agency."}</p>
                <strong>{formatVnd(plan.price)}</strong>
                <small>{plan.billingCycle}</small>
              </button>
            ))}
          </div>
        ) : <Empty title="Chưa có gói VPS đang bán" text="Admin cần đồng bộ và bật ít nhất một gói VPS." />}

        {selectedPlan ? (
          <form className={styles.purchaseForm} onSubmit={purchase}>
            <label>
              <span>Hệ điều hành</span>
              {options.operatingSystems.length ? (
                <select onChange={(event) => setOsId(event.target.value)} required value={osId}>
                  {options.operatingSystems.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
              ) : (
                <input min="1" onChange={(event) => setOsId(event.target.value)} placeholder="Nhập OS ID từ Agency" required type="number" value={osId} />
              )}
            </label>
            <NumberField icon={<CirclePower size={15} />} label="CPU thêm" value={addonCpu} onChange={setAddonCpu} />
            <NumberField icon={<MemoryStick size={15} />} label="RAM thêm" value={addonRam} onChange={setAddonRam} />
            <label>
              <span><HardDrive size={15} /> Ổ đĩa thêm</span>
              <select onChange={(event) => setAddonDisk(Number(event.target.value))} value={addonDisk}>
                {[0, 10, 20, 30, 40, 50].map((value) => <option key={value} value={value}>{value} GB</option>)}
              </select>
            </label>
            <div className={styles.purchaseTotal}>
              <span>Tổng thanh toán</span><strong>{formatVnd(total)}</strong>
              <button disabled={submitting} type="submit">
                {submitting ? <LoaderCircle className={styles.spin} size={17} /> : <ShoppingCart size={17} />}
                {submitting ? "Đang tạo VPS" : "Mua VPS"}
              </button>
            </div>
          </form>
        ) : null}
      </section>

      {showHistory ? <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div><p>LỊCH SỬ</p><h2>VPS đã mua</h2></div>
          <span>{orders.length} đơn gần nhất</span>
        </div>
        {loading && !orders.length ? <Loading /> : orders.length ? (
          <div className={styles.orderGrid}>
            {orders.map((order) => {
              const secret = credentials[order.id];
              const busy = busyOrderId === order.id;
              return (
                <article className={styles.orderCard} key={order.id}>
                  <header>
                    <div><small>{order.requestId}</small><h3>{order.planName}</h3></div>
                    <span className={`${styles.status} ${styles[`status${order.status}`]}`}>{statusLabel[order.status]}</span>
                  </header>
                  <dl>
                    <Info label="IP" value={order.ipAddress ?? "Chưa cấp"} />
                    <Info label="VPS ID" value={order.providerVpsId ?? "—"} />
                    <Info label="Trạng thái máy" value={order.providerStatus ?? "—"} />
                    <Info label="Hết hạn" value={formatDate(order.nextDueAt)} />
                    <Info label="Hệ điều hành" value={`OS #${order.osId}`} />
                    <Info label="Thanh toán" value={formatVnd(order.amount)} />
                  </dl>
                  {order.providerMessage ? <p className={styles.providerMessage}>{order.providerMessage}</p> : null}
                  {secret ? (
                    <div className={styles.credentials}>
                      <CredentialRow label="Tài khoản" value={secret.username} />
                      <CredentialRow label="Mật khẩu" value={secret.password} />
                    </div>
                  ) : null}
                  <footer>
                    {order.status === "ACTIVE" ? (
                      <>
                        <button disabled={busy} onClick={() => void revealCredentials(order)} type="button">
                          {secret ? <EyeOff size={15} /> : <Eye size={15} />} {secret ? "Ẩn đăng nhập" : "Xem đăng nhập"}
                        </button>
                        <button disabled={busy} onClick={() => void runAction(order, "restart", "Khởi động lại")} type="button">
                          <RotateCw size={15} /> Khởi động lại
                        </button>
                        <button disabled={busy} onClick={() => void runAction(order, "off", "Tắt")} type="button">
                          <CirclePower size={15} /> Tắt máy
                        </button>
                      </>
                    ) : <span>Cập nhật {formatDateTime(order.updatedAt)}</span>}
                  </footer>
                </article>
              );
            })}
          </div>
        ) : <Empty title="Bạn chưa mua VPS" text="Chọn một gói ở phía trên để bắt đầu." />}
      </section> : null}
    </main>
  );
}

function NumberField({ icon, label, value, onChange }: { icon: React.ReactNode; label: string; value: number; onChange: (value: number) => void }) {
  return <label><span>{icon} {label}</span><input min="0" onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))} type="number" value={value} /></label>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}

function CredentialRow({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><code>{value}</code><button aria-label={`Sao chép ${label}`} onClick={() => void navigator.clipboard.writeText(value)} type="button"><Copy size={14} /></button></div>;
}

function Empty({ title, text }: { title: string; text: string }) {
  return <div className={styles.empty}><Server size={35} /><h3>{title}</h3><p>{text}</p></div>;
}

function Loading() {
  return <div className={styles.loading}><LoaderCircle className={styles.spin} size={24} /> Đang tải dữ liệu VPS...</div>;
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value)) : "—";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value));
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text) as unknown; } catch { return { message: text }; }
}
