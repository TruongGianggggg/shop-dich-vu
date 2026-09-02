"use client";

import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  ReceiptText,
  Search,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  PageResponse,
  ServiceOrder,
  formatVnd,
  getApiErrorMessage,
} from "@/lib/shop-api";
import { useAuthSession } from "./use-auth-session";
import styles from "@/app/lich-su-mua/order-history.module.css";

const statusLabels: Record<ServiceOrder["status"], string> = {
  error: "Lỗi",
  refund_error: "Lỗi hoàn tiền",
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  done: "Hoàn thành",
};

type StatusFilter = "all" | ServiceOrder["status"];

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: "Tất cả", value: "all" },
  { label: "Chờ xử lý", value: "pending" },
  { label: "Đang xử lý", value: "processing" },
  { label: "Hoàn thành", value: "done" },
  { label: "Lỗi", value: "error" },
  { label: "Lỗi hoàn tiền", value: "refund_error" },
];

export function OrderHistory() {
  const session = useAuthSession();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [pageInfo, setPageInfo] = useState<PageResponse<ServiceOrder> | null>(
    null,
  );
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedOrderId, setExpandedOrderId] = useState("");

  useEffect(() => {
    if (!session) {
      return;
    }

    let ignore = false;

    async function loadOrders() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/service-orders/history?page=${page}&size=10`,
          { cache: "no-store" },
        );
        const data = (await response.json()) as
          | PageResponse<ServiceOrder>
          | unknown;

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(data, "Không tải được lịch sử mua."),
          );
        }

        if (!ignore) {
          const result = data as PageResponse<ServiceOrder>;
          setPageInfo(result);
          setOrders(result.content);
        }
      } catch (exception) {
        if (!ignore) {
          setOrders([]);
          setPageInfo(null);
          setError(
            exception instanceof Error
              ? exception.message
              : "Không tải được lịch sử mua.",
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
  }, [page, session]);

  const statusCounts = useMemo(
    () => ({
      done: orders.filter((order) => order.status === "done").length,
      error: orders.filter((order) => order.status === "error").length,
      refundError: orders.filter((order) => order.status === "refund_error").length,
      pending: orders.filter((order) => order.status === "pending").length,
      processing: orders.filter((order) => order.status === "processing").length,
    }),
    [orders],
  );

  const visibleOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi");
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (!normalizedQuery) return true;
      return [
        order.requestId,
        order.serviceName,
        order.packageName,
        order.packageId,
        order.username,
        order.server,
      ].some((value) => value?.toLocaleLowerCase("vi").includes(normalizedQuery));
    });
  }, [orders, query, statusFilter]);

  if (!session) {
    return (
      <div className="order-history-login">
        <strong>Đăng nhập để xem lịch sử mua</strong>
        <p>Các đơn dịch vụ của bạn sẽ được hiển thị tại đây.</p>
        <Link href="/login?returnUrl=%2Flich-su-mua">Đăng nhập</Link>
      </div>
    );
  }

  return (
    <div className={styles.content}>
      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}><ReceiptText aria-hidden="true" size={19} /></span>
          <div><small>Tổng đơn</small><strong>{pageInfo?.totalElements ?? 0}</strong></div>
        </div>
        <div className={styles.summaryCard}>
          <span className={`${styles.summaryIcon} ${styles.success}`}><CheckCircle2 aria-hidden="true" size={19} /></span>
          <div><small>Hoàn thành trang này</small><strong>{statusCounts.done}</strong></div>
        </div>
        <div className={styles.summaryCard}>
          <span className={`${styles.summaryIcon} ${styles.warning}`}><Clock3 aria-hidden="true" size={19} /></span>
          <div><small>Đang chờ / xử lý</small><strong>{statusCounts.pending + statusCounts.processing}</strong></div>
        </div>
        <div className={styles.summaryCard}>
          <span className={`${styles.summaryIcon} ${styles.danger}`}><TriangleAlert aria-hidden="true" size={19} /></span>
          <div><small>Lỗi trang này</small><strong>{statusCounts.error + statusCounts.refundError}</strong></div>
        </div>
      </div>

      {error ? <p className="order-history-error">{error}</p> : null}
      {isLoading ? <p className="order-history-loading">Đang tải đơn hàng...</p> : null}
      {!isLoading && !orders.length && !error ? (
        <div className="order-history-empty">
          <strong>Bạn chưa có đơn dịch vụ</strong>
          <Link href="/">Chọn dịch vụ ngay →</Link>
        </div>
      ) : null}

      {orders.length ? (
        <section className={styles.panel}>
          <div className={styles.toolbar}>
            <label className={styles.search}>
              <Search aria-hidden="true" size={17} />
              <input
                aria-label="Tìm kiếm đơn hàng"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm mã đơn, dịch vụ, tài khoản..."
                type="search"
                value={query}
              />
            </label>
            <div aria-label="Lọc trạng thái" className={styles.filters} role="group">
              {statusFilters.map((filter) => (
                <button
                  className={statusFilter === filter.value ? styles.activeFilter : ""}
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  type="button"
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.tableHead} aria-hidden="true">
            <span>Mã đơn</span><span>Dịch vụ</span><span>Tài khoản game</span>
            <span>Server</span><span>Thanh toán</span><span>Ngày tạo</span><span>Trạng thái</span><span />
          </div>

          <div className={styles.list}>
            {visibleOrders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              return (
                <article className={styles.order} key={order.id}>
                  <button
                    aria-expanded={isExpanded}
                    className={styles.orderRow}
                    onClick={() => setExpandedOrderId(isExpanded ? "" : order.id)}
                    type="button"
                  >
                    <OrderCell label="Mã đơn" value={order.requestId} emphasize />
                    <OrderCell label="Dịch vụ" value={order.packageName ?? order.packageId} />
                    <OrderCell label="Tài khoản game" value={order.username ?? "—"} />
                    <OrderCell label="Server" value={order.server ?? "—"} />
                    <OrderCell label="Thanh toán" value={formatVnd(order.amount)} />
                    <OrderCell label="Ngày tạo" value={formatDate(order.createdAt)} />
                    <span className={`${styles.status} ${styles[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className={isExpanded ? styles.chevronOpen : styles.chevron}
                      size={17}
                    />
                  </button>

                  {isExpanded ? (
                    <div className={styles.details}>
                      <div><small>Dịch vụ đã mua</small><strong>{order.serviceName ?? serviceTypeLabel(order.type)}</strong></div>
                      <div><small>Mã gói</small><strong>{order.packageId}</strong></div>
                      <div><small>Cập nhật lúc</small><strong>{formatDate(order.updatedAt)}</strong></div>
                      {order.contactInfo ? <div><small>SĐT / Facebook hỗ trợ</small><strong>{order.contactInfo}</strong></div> : null}
                      <div><small>Ghi chú</small><strong>{order.note ?? "Không có ghi chú"}</strong></div>
                      {order.externalMessage ? <p>{order.externalMessage}</p> : null}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>

          {!visibleOrders.length ? (
            <div className={styles.noResults}>
              <UserRound aria-hidden="true" size={23} />
              <strong>Không tìm thấy đơn phù hợp</strong>
              <span>Thử đổi từ khóa hoặc trạng thái lọc.</span>
            </div>
          ) : null}
        </section>
      ) : null}

      {pageInfo && pageInfo.totalPages > 1 ? (
        <div className="order-history-pagination">
          <button disabled={pageInfo.first || isLoading} onClick={() => setPage((value) => Math.max(0, value - 1))} type="button">← Trang trước</button>
          <span>Trang {pageInfo.page + 1}/{pageInfo.totalPages}</span>
          <button disabled={pageInfo.last || isLoading} onClick={() => setPage((value) => value + 1)} type="button">Trang sau →</button>
        </div>
      ) : null}
    </div>
  );
}

function OrderCell({
  emphasize = false,
  label,
  value,
}: {
  emphasize?: boolean;
  label: string;
  value: string;
}) {
  return (
    <span className={styles.cell}>
      <small>{label}</small>
      <strong className={emphasize ? styles.emphasize : ""} title={value}>{value}</strong>
    </span>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function serviceTypeLabel(type: string) {
  const labels: Record<string, string> = {
    GAME_SERVICE: "Dịch vụ game",
    TOPUP_CAROT: "Nạp Carot",
    TOPUP_FREE_FIRE_DIAMOND: "Nạp Kim Cương Free Fire",
    TOPUP_LIEN_QUAN_QUAN_HUY: "Nạp Quân Huy Liên Quân",
    TOPUP_THE9P: "Nạp game tự động",
  };
  return labels[type] ?? type;
}
