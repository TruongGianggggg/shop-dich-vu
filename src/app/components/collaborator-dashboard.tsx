"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  BadgeDollarSign,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Eye,
  LoaderCircle,
  RefreshCw,
  UserCheck,
  WalletCards,
  X,
} from "lucide-react";
import { useUserBalance } from "@/app/components/use-user-balance";
import { CollaboratorSidebar } from "@/app/components/collaborator-sidebar";
import {
  formatVnd,
  getApiErrorMessage,
  ServiceOrder,
  ServiceOrderStatus,
} from "@/lib/shop-api";

type Tab = "available" | "received";
type UpdateStatus = Extract<ServiceOrderStatus, "processing" | "done" | "error">;

const statusLabels: Record<ServiceOrderStatus, string> = {
  pending: "Chờ xử lý",
  processing: "Đang làm",
  done: "Hoàn thành",
  error: "Đã hủy",
  refund_error: "Lỗi hoàn tiền",
};

export function CollaboratorDashboard() {
  const { refresh: refreshWallet, wallet } = useUserBalance();
  const [availableOrders, setAvailableOrders] = useState<ServiceOrder[]>([]);
  const [receivedOrders, setReceivedOrders] = useState<ServiceOrder[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("available");
  const [isLoading, setIsLoading] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [detailOrder, setDetailOrder] = useState<ServiceOrder | null>(null);

  const loadOrders = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const [availableResponse, receivedResponse] = await Promise.all([
        fetch("/api/collaborators/service-orders/available", { cache: "no-store" }),
        fetch("/api/collaborators/service-orders/received", { cache: "no-store" }),
      ]);
      const [availableData, receivedData] = await Promise.all([
        readJson(availableResponse),
        readJson(receivedResponse),
      ]);
      if (!availableResponse.ok) {
        throw new Error(getApiErrorMessage(availableData, "Không tải được đơn đang chờ."));
      }
      if (!receivedResponse.ok) {
        throw new Error(getApiErrorMessage(receivedData, "Không tải được đơn đã nhận."));
      }
      setAvailableOrders(availableData as ServiceOrder[]);
      setReceivedOrders(receivedData as ServiceOrder[]);
      setError("");
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Không tải được danh sách đơn.");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    const requestedTabId = window.setTimeout(() => {
      if (requestedTab === "received" || requestedTab === "available") {
        setActiveTab(requestedTab);
      }
    }, 0);
    const initialLoadId = window.setTimeout(() => void loadOrders(), 0);
    const intervalId = window.setInterval(() => void loadOrders(false), 30_000);
    return () => {
      window.clearTimeout(requestedTabId);
      window.clearTimeout(initialLoadId);
      window.clearInterval(intervalId);
    };
  }, [loadOrders]);

  const activeOrders = activeTab === "available" ? availableOrders : receivedOrders;
  const completedCount = useMemo(
    () => receivedOrders.filter((order) => order.status === "done").length,
    [receivedOrders],
  );

  async function mutateOrder(orderId: string, action: "receive" | UpdateStatus) {
    setBusyOrderId(orderId);
    setError("");
    setMessage("");
    try {
      const isReceive = action === "receive";
      const response = await fetch(
        `/api/collaborators/service-orders/${encodeURIComponent(orderId)}/${isReceive ? "receive" : "status"}`,
        {
          method: isReceive ? "POST" : "PUT",
          headers: isReceive ? undefined : { "Content-Type": "application/json" },
          body: isReceive ? undefined : JSON.stringify({ status: action, adminNote: null }),
        },
      );
      const data = await readJson(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể cập nhật đơn hàng."));
      }
      setMessage(
        isReceive
          ? "Đã nhận đơn. Bạn có thể bắt đầu xử lý ngay."
          : action === "done"
            ? "Đã hoàn thành đơn và ghi nhận hoa hồng."
            : action === "error"
              ? "Đã hủy đơn và gửi yêu cầu hoàn tiền cho khách."
              : "Đã chuyển đơn sang trạng thái đang làm.",
      );
      await loadOrders(false);
      refreshWallet();
      setDetailOrder(null);
      if (isReceive) setActiveTab("received");
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Không thể cập nhật đơn hàng.");
    } finally {
      setBusyOrderId("");
    }
  }

  return (
    <main className="role-dashboard">
      <CollaboratorSidebar activeTab={activeTab} />
      <section className="role-main collaborator-role-main">
      <div className="collaborator-main">
      <section className="collaborator-hero">
        <div>
          <p>TRUNG TÂM CỘNG TÁC VIÊN</p>
          <h1>Quản lý công việc</h1>
          <span>Nhận đơn phù hợp, cập nhật tiến độ và theo dõi hoa hồng của bạn.</span>
        </div>
        <button disabled={isLoading} onClick={() => void loadOrders()} type="button">
          <RefreshCw className={isLoading ? "is-spinning" : ""} size={18} /> Làm mới
        </button>
      </section>

      <section className="collaborator-stats">
        <Stat icon={<ClipboardList />} label="Đơn có thể nhận" value={String(availableOrders.length)} />
        <Stat icon={<UserCheck />} label="Đơn đang quản lý" value={String(receivedOrders.length)} />
        <Stat icon={<CheckCircle2 />} label="Đã hoàn thành" value={String(completedCount)} />
        <Stat icon={<WalletCards />} label="Số dư CTV" value={formatVnd(wallet?.collaboratorBalance ?? 0)} />
        <Stat icon={<BadgeDollarSign />} label="Tổng hoa hồng" value={formatVnd(wallet?.collaboratorTotalEarned ?? 0)} />
      </section>

      {message ? <p className="collaborator-feedback success">{message}</p> : null}
      {error ? <p className="collaborator-feedback error"><CircleAlert size={18} />{error}</p> : null}

      <section className="collaborator-workspace">
        <div className="collaborator-tabs" role="tablist" aria-label="Danh sách công việc">
          <button aria-selected={activeTab === "available"} onClick={() => setActiveTab("available")} role="tab" type="button">
            Đơn có thể nhận <span>{availableOrders.length}</span>
          </button>
          <button aria-selected={activeTab === "received"} onClick={() => setActiveTab("received")} role="tab" type="button">
            Đơn của tôi <span>{receivedOrders.length}</span>
          </button>
        </div>

        {isLoading ? (
          <div className="collaborator-empty"><LoaderCircle className="is-spinning" size={30} /><p>Đang tải công việc...</p></div>
        ) : activeOrders.length === 0 ? (
          <div className="collaborator-empty"><ClipboardList size={36} /><h2>Chưa có đơn hàng</h2><p>{activeTab === "available" ? "Hiện chưa có đơn phù hợp với cấu hình dịch vụ của bạn." : "Bạn chưa nhận đơn nào."}</p></div>
        ) : (
          <div className="collaborator-order-table-wrap">
            <table className="role-table collaborator-order-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Mã đơn</th>
                  <th>Dịch vụ</th>
                  <th>Gói dịch vụ</th>
                  <th>Giá trị</th>
                  <th>{activeTab === "received" ? "Hoa hồng" : "Ngày tạo"}</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {activeOrders.map((order, index) => (
                  <OrderRow
                    index={index}
                    key={order.id}
                    mode={activeTab}
                    onDetail={() => setDetailOrder(order)}
                    order={order}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      </div>
      </section>

      {detailOrder && typeof document !== "undefined" ? createPortal(
        <OrderDetailModal
          busy={busyOrderId === detailOrder.id}
          mode={activeTab}
          onAction={(action) => void mutateOrder(detailOrder.id, action)}
          onClose={() => setDetailOrder(null)}
          order={detailOrder}
        />,
        document.body,
      ) : null}
    </main>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <article><span>{icon}</span><div><p>{label}</p><strong>{value}</strong></div></article>;
}

function OrderRow({ index, mode, onDetail, order }: {
  index: number;
  mode: Tab;
  onDetail: () => void;
  order: ServiceOrder;
}) {
  const earning = collaboratorEarning(order);

  return (
    <tr>
      <td>{index + 1}</td>
      <td><strong className="collaborator-table-code">{order.requestId}</strong></td>
      <td>{order.serviceName ?? "Dịch vụ game"}</td>
      <td><strong>{order.packageName ?? "Gói dịch vụ"}</strong></td>
      <td><strong>{formatVnd(order.amount)}</strong></td>
      <td>{mode === "received" ? (earning == null ? "—" : formatVnd(earning)) : formatDate(order.createdAt)}</td>
      <td><span className={`collaborator-status is-${order.status}`}>{statusLabels[order.status]}</span></td>
      <td>
        <button className="ghost-button collaborator-detail-button" onClick={onDetail} type="button">
          <Eye aria-hidden="true" size={15} /> Chi tiết
        </button>
      </td>
    </tr>
  );
}

function OrderDetailModal({ busy, mode, onAction, onClose, order }: {
  busy: boolean;
  mode: Tab;
  onAction: (action: "receive" | UpdateStatus) => void;
  onClose: () => void;
  order: ServiceOrder;
}) {
  const canUpdate = order.status === "pending" || order.status === "processing";
  const earning = collaboratorEarning(order);

  return (
    <div className="admin-user-modal" role="presentation">
      <button aria-label="Đóng chi tiết đơn" className="admin-user-modal-backdrop" onClick={onClose} type="button" />
      <section aria-modal="true" className="admin-user-modal-panel collaborator-order-modal" role="dialog">
        <div className="admin-user-modal-header">
          <div>
            <p className="section-kicker">CHI TIẾT ĐƠN {order.requestId}</p>
            <h2>{order.packageName ?? "Gói dịch vụ"}</h2>
            <p>{order.serviceName ?? "Dịch vụ game"}</p>
          </div>
          <button aria-label="Đóng" className="admin-user-modal-close" onClick={onClose} type="button"><X aria-hidden="true" size={18} /></button>
        </div>

        <div className="collaborator-order-modal-body">
          <div className="collaborator-order-modal-summary">
            <span className={`collaborator-status is-${order.status}`}>{statusLabels[order.status]}</span>
            <strong>{formatVnd(order.amount)}</strong>
          </div>
          <dl className="collaborator-order-detail-grid">
            <Detail label="Khách hàng" value={order.customerUsername ?? "—"} />
            <Detail label="Ngày tạo" value={formatDate(order.createdAt)} />
            <Detail label="Tài khoản game" value={order.username ?? "—"} />
            <Detail label="Mật khẩu" value={order.password ?? "—"} />
            <Detail label="SĐT / Facebook" value={order.contactInfo ?? "—"} />
            <Detail label="Máy chủ" value={order.server ?? "—"} />
            {mode === "received" ? <Detail label="Hoa hồng dự kiến" value={earning == null ? "—" : formatVnd(earning)} /> : null}
          </dl>
          {order.note ? <div className="collaborator-order-note"><b>Ghi chú khách hàng</b><p>{order.note}</p></div> : null}
          {order.adminNote ? <div className="collaborator-order-note"><b>Ghi chú xử lý</b><p>{order.adminNote}</p></div> : null}
        </div>

        <div className="admin-user-modal-actions collaborator-order-modal-actions">
          <button className="ghost-button h-11 px-5" disabled={busy} onClick={onClose} type="button">Đóng</button>
          {mode === "available" ? (
            <button className="primary-button h-11 px-5" disabled={busy} onClick={() => onAction("receive")} type="button">{busy ? "Đang nhận..." : "Nhận đơn"}</button>
          ) : canUpdate ? (
            <>
              {order.status === "pending" ? <button className="ghost-button h-11 px-5" disabled={busy} onClick={() => onAction("processing")} type="button">Bắt đầu làm</button> : null}
              <button className="primary-button h-11 px-5" disabled={busy} onClick={() => onAction("done")} type="button">Hoàn thành</button>
              <button className="danger-button h-11 px-5" disabled={busy} onClick={() => onAction("error")} type="button">Hủy đơn</button>
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}

function collaboratorEarning(order: ServiceOrder) {
  return order.collaboratorEarningAmount ?? (
    order.collaboratorDiscountPercent == null
      ? null
      : order.amount - Math.floor(order.amount * order.collaboratorDiscountPercent / 100)
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text) as unknown; } catch { return { message: text }; }
}
