"use client";

import { ChevronLeft, ChevronRight, Eye, RefreshCw, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AdminSidebar } from "@/app/components/admin/admin-sidebar";
import { useAuthSession } from "@/app/components/use-auth-session";
import {
  AuthResponse,
  formatVnd,
  getApiErrorMessage,
  PageResponse,
  ServiceOrder,
  ServiceOrderStatus,
} from "@/lib/shop-api";

const pageSizeOptions = [10, 20, 50] as const;

export function AdminOrdersManager() {
  const session = useAuthSession();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [pageInfo, setPageInfo] = useState<PageResponse<ServiceOrder> | null>(
    null,
  );
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<(typeof pageSizeOptions)[number]>(10);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [detailOrder, setDetailOrder] = useState<ServiceOrder | null>(null);
  const pageNumbers = getPageNumbers(
    pageInfo?.page ?? page,
    pageInfo?.totalPages ?? 0,
  );

  useEffect(() => {
    if (!session) {
      return;
    }

    const activeSession = session;
    let ignore = false;

    async function loadOrders() {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          size: String(pageSize),
        });
        const response = await fetch(`/api/service-orders/history?${params}`, {
          headers: authHeaders(activeSession),
        });
        const data = (await readResponseJson(response)) as
          | PageResponse<ServiceOrder>
          | unknown;

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(data, "Khong tai duoc danh sach don hang."),
          );
        }

        if (!ignore) {
          const pageData = data as PageResponse<ServiceOrder>;
          setOrders(pageData.content);
          setPageInfo(pageData);
        }
      } catch (exception) {
        if (!ignore) {
          setOrders([]);
          setPageInfo(null);
          setError(
            exception instanceof Error
              ? exception.message
              : "Khong tai duoc danh sach don hang.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      ignore = true;
    };
  }, [page, pageSize, refreshKey, session]);

  const metrics = useMemo(() => {
    const processingCount = orders.filter(
      (order) => order.status === "processing",
    ).length;
    const completedCount = orders.filter(
      (order) => order.status === "done",
    ).length;
    const pendingCount = orders.filter((order) => order.status === "pending").length;
    const pageRevenue = orders.reduce((total, order) => total + order.amount, 0);

    return [
      {
        label: "Tổng đơn",
        value: String(pageInfo?.totalElements ?? orders.length),
        trend: `Trang ${(pageInfo?.page ?? page) + 1}`,
        tone: "blue",
      },
      {
        label: "Đang xử lý",
        value: String(processingCount),
        trend: `${pendingCount} đơn đang chờ`,
        tone: "amber",
      },
      {
        label: "Hoàn tất",
        value: String(completedCount),
        trend: "Trong trang hiện tại",
        tone: "green",
      },
      {
        label: "Giá trị trang",
        value: formatVnd(pageRevenue),
        trend: "Tổng tiền đơn đang xem",
        tone: "rose",
      },
    ];
  }, [orders, page, pageInfo]);

  function changePageSize(value: string) {
    const parsed = Number(value) as (typeof pageSizeOptions)[number];

    if (pageSizeOptions.includes(parsed)) {
      setPageSize(parsed);
      setPage(0);
    }
  }

  return (
    <main className="role-dashboard">
      <AdminSidebar active="orders" />

      <section className="role-main backoffice-users-main">
        <header className="role-topbar backoffice-users-header">
          <div>
            <p className="section-kicker">Đơn hàng</p>
            <h1>Quản lý đơn hàng</h1>
          </div>
          <div className="role-topbar-actions">
            <button
              className="primary-button h-11 px-5"
              disabled={isLoading}
              onClick={() => setRefreshKey((current) => current + 1)}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={16} />
              Tải lại
            </button>
          </div>
        </header>

        <section className="role-metric-grid admin-order-metrics">
          {metrics.map((metric) => (
            <article
              className={`role-metric-card tone-${metric.tone}`}
              key={metric.label}
            >
              <p>{metric.label}</p>
              <strong>{metric.value}</strong>
              <span>{metric.trend}</span>
            </article>
          ))}
        </section>

        <section className="role-panel admin-users-toolbar admin-order-toolbar">
          <div className="admin-users-summary">
            <strong>
              {(pageInfo?.totalElements ?? 0).toLocaleString("vi-VN")} đơn hàng
            </strong>
            <span>Chỉ tài khoản ADMIN được xem trong trang quản lý</span>
          </div>
          <label className="field-label deposit-history-size">
            Số dòng
            <select
              className="role-select"
              disabled={isLoading}
              onChange={(event) => changePageSize(event.target.value)}
              value={pageSize}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </section>

        {error ? <p className="admin-users-message error">{error}</p> : null}

        <section className="role-panel role-table-panel backoffice-table-card">
          <div className="role-panel-head">
            <div>
              <p className="section-kicker">Danh sách</p>
              <h2>Đơn dịch vụ</h2>
            </div>
            <span>{isLoading ? "Đang tải" : `Trang ${(pageInfo?.page ?? page) + 1}`}</span>
          </div>

          <div className="role-table-wrap">
            <table className="role-table admin-users-table admin-orders-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Mã đơn</th>
                  <th>Dịch vụ</th>
                  <th>Khách hàng</th>
                  <th>Thanh toán</th>
                  <th>CTV</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{formatDateTime(order.createdAt)}</td>
                    <td className="admin-order-code-cell">
                      <strong>{order.requestId}</strong>
                      <small>{order.id}</small>
                    </td>
                    <td>
                      <strong>{order.packageName ?? order.type}</strong>
                      <small>{serviceTypeLabel(order.type)}</small>
                    </td>
                    <td>
                      <strong>{order.username || "Không có"}</strong>
                      <small>{order.userId ?? "Không có userId"}</small>
                    </td>
                    <td>
                      <strong>{formatVnd(order.amount)}</strong>
                      <small>
                        {order.payAmount == null
                          ? "Không có payAmount"
                          : `Pay ${formatVnd(order.payAmount)}`}
                      </small>
                    </td>
                    <td>
                      <strong>{order.receiverUsername ?? "Chưa nhận"}</strong>
                      <small>
                        {order.collaboratorEarningAmount == null
                          ? "Chưa có hoa hồng"
                          : formatVnd(order.collaboratorEarningAmount)}
                      </small>
                    </td>
                    <td className="admin-order-status-cell">
                      <div className="deposit-status-stack">
                        <span
                          className={`admin-order-status-pill ${order.status.toLowerCase()}`}
                        >
                          {orderStatusLabel(order.status)}
                        </span>
                        {order.adminNote || order.externalMessage ? (
                          <small>{order.adminNote ?? order.externalMessage}</small>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <button
                        className="ghost-button h-9 px-3"
                        onClick={() => setDetailOrder(order)}
                        type="button"
                      >
                        <Eye aria-hidden="true" size={15} />
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
                {!isLoading && orders.length === 0 ? (
                  <tr>
                    <td colSpan={8}>Chưa có đơn hàng nào.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="admin-users-pagination deposit-pagination">
            <button
              aria-label="Trang trước"
              className="ghost-button deposit-page-icon"
              disabled={isLoading || pageInfo?.first !== false}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={18} />
            </button>
            <div className="deposit-page-numbers">
              {pageNumbers.map((item, index) =>
                item === "ellipsis" ? (
                  <span className="deposit-page-ellipsis" key={`ellipsis-${index}`}>
                    ...
                  </span>
                ) : (
                  <button
                    aria-current={item === (pageInfo?.page ?? page) ? "page" : undefined}
                    className={
                      item === (pageInfo?.page ?? page)
                        ? "deposit-page-number active"
                        : "deposit-page-number"
                    }
                    disabled={isLoading}
                    key={item}
                    onClick={() => setPage(item)}
                    type="button"
                  >
                    {item + 1}
                  </button>
                ),
              )}
            </div>
            <button
              aria-label="Trang sau"
              className="ghost-button deposit-page-icon"
              disabled={isLoading || pageInfo?.last !== false}
              onClick={() => setPage((current) => current + 1)}
              type="button"
            >
              <ChevronRight aria-hidden="true" size={18} />
            </button>
          </div>
        </section>
      </section>

      {detailOrder && typeof document !== "undefined" ? createPortal(
        <div className="admin-user-modal" role="presentation">
          <button
            aria-label="Đóng chi tiết đơn hàng"
            className="admin-user-modal-backdrop"
            onClick={() => setDetailOrder(null)}
            type="button"
          />
          <section
            aria-modal="true"
            className="admin-user-modal-panel admin-order-detail-panel"
            role="dialog"
          >
            <div className="admin-order-detail-header">
              <div className="admin-order-detail-title">
                <p className="section-kicker">Chi tiết đơn</p>
                <h2>{detailOrder.requestId}</h2>
              </div>
              <div className="admin-order-detail-header-actions">
                <span
                  className={`admin-order-status-pill ${detailOrder.status.toLowerCase()}`}
                >
                  {orderStatusLabel(detailOrder.status)}
                </span>
                <button
                  aria-label="Đóng chi tiết"
                  className="admin-user-modal-close"
                  onClick={() => setDetailOrder(null)}
                  type="button"
                >
                  <X aria-hidden="true" size={18} />
                </button>
              </div>
            </div>

            <div className="admin-order-basic-detail">
              <section className="admin-order-detail-card">
                <h3>Tài khoản cần xử lý</h3>
                <div className="admin-order-compact-grid">
                  <CompactRow label="Tài khoản game" value={detailOrder.username ?? "Không có"} />
                  <CompactRow label="Mật khẩu" value={detailOrder.password ?? "Không có"} />
                  <CompactRow label="Server" value={detailOrder.server ?? "Không có"} />
                  <CompactRow label="User ID" value={detailOrder.userId ?? "Không có"} />
                </div>
              </section>

              <section className="admin-order-detail-card">
                <h3>Thông tin đơn</h3>
                <div className="admin-order-compact-grid">
                  <CompactRow label="Gói dịch vụ" value={detailOrder.packageName ?? detailOrder.type} />
                  <CompactRow label="Loại dịch vụ" value={serviceTypeLabel(detailOrder.type)} />
                  <CompactRow label="Số tiền" value={formatVnd(detailOrder.amount)} />
                  <CompactRow label="Thanh toán" value={detailOrder.payAmount == null ? "Không có" : formatVnd(detailOrder.payAmount)} />
                  <CompactRow label="CTV nhận" value={detailOrder.receiverUsername ?? "Chưa nhận"} />
                  <CompactRow
                    label="Hoa hồng CTV"
                    value={
                      detailOrder.collaboratorEarningAmount == null
                        ? "Chưa có"
                        : formatVnd(detailOrder.collaboratorEarningAmount)
                    }
                  />
                  <CompactRow label="Mã nhà cung cấp" value={detailOrder.the9pOrderCode ?? "Không có"} />
                  <CompactRow label="Tạo lúc" value={formatDateTime(detailOrder.createdAt)} />
                </div>
              </section>

              <section className="admin-order-detail-card">
                <h3>Ghi chú</h3>
                <div className="admin-order-compact-notes">
                  <CompactRow label="Ghi chú khách" value={detailOrder.note || "Không có"} />
                  <CompactRow label="Ghi chú admin" value={detailOrder.adminNote || "Không có"} />
                  <CompactRow label="Thông báo ngoài" value={detailOrder.externalMessage || "Không có"} />
                </div>
              </section>
            </div>
          </section>
        </div>,
        document.body,
      ) : null}
    </main>
  );
}

function CompactRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="admin-order-compact-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function authHeaders(_session: AuthResponse) {
  void _session;
  return {};
}

async function readResponseJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function orderStatusLabel(status: ServiceOrderStatus) {
  if (status === "processing") {
    return "Đang xử lý";
  }

  if (status === "done") {
    return "Hoàn thành";
  }

  if (status === "error") {
    return "Lỗi";
  }

  if (status === "refund_error") {
    return "Lỗi hoàn tiền";
  }

  return "Chờ xử lý";
}

function serviceTypeLabel(type: string) {
  if (type === "GAME_SERVICE") {
    return "Dịch vụ game";
  }

  if (type.startsWith("TOPUP_")) {
    return "Nạp game";
  }

  return type;
}

function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getPageNumbers(
  currentPage: number,
  totalPages: number,
): Array<number | "ellipsis"> {
  if (totalPages <= 0) {
    return [0];
  }

  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const pages: Array<number | "ellipsis"> = [0, 1, 2];
  const lastPage = totalPages - 1;

  if (currentPage > 3) {
    pages.push("ellipsis");
  }

  if (currentPage > 2 && currentPage < lastPage) {
    pages.push(currentPage);
  }

  if (currentPage < lastPage - 1) {
    pages.push("ellipsis");
  }

  pages.push(lastPage);

  return pages;
}
