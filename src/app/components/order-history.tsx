"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  PageResponse,
  ServiceOrder,
  formatVnd,
  getApiErrorMessage,
} from "@/lib/shop-api";
import { useAuthSession } from "./use-auth-session";

const statusLabels: Record<ServiceOrder["status"], string> = {
  error: "Lỗi",
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  done: "Hoàn thành",
};

export function OrderHistory() {
  const session = useAuthSession();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [pageInfo, setPageInfo] = useState<PageResponse<ServiceOrder> | null>(
    null,
  );
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
        const response = await fetch(
          `/api/service-orders/history?page=${page}&size=10`,
          { headers: { Authorization: `Bearer ${activeSession.token}` } },
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
    <div className="order-history-content">
      <div className="order-history-summary">
        <div><span>Tổng đơn</span><strong>{pageInfo?.totalElements ?? 0}</strong></div>
        <div><span>Tài khoản</span><strong>{session.username}</strong></div>
      </div>

      {error ? <p className="order-history-error">{error}</p> : null}
      {isLoading ? <p className="order-history-loading">Đang tải đơn hàng...</p> : null}
      {!isLoading && !orders.length && !error ? (
        <div className="order-history-empty">
          <strong>Bạn chưa có đơn dịch vụ</strong>
          <Link href="/">Chọn dịch vụ ngay →</Link>
        </div>
      ) : null}

      <div className="order-history-list">
        {orders.map((order) => (
          <article className="order-history-card" key={order.id}>
            <div className="order-history-card-head">
              <div><small>Mã đơn</small><strong>{order.requestId}</strong></div>
              <span className={`status-${order.status.toLowerCase()}`}>
                {statusLabels[order.status]}
              </span>
            </div>
            <div className="order-history-card-body">
              <div><small>Gói dịch vụ</small><strong>{order.packageName ?? order.packageId}</strong></div>
              <div><small>Thanh toán</small><strong>{formatVnd(order.amount)}</strong></div>
              <div><small>Tài khoản game</small><strong>{order.username ?? "—"}</strong></div>
              <div><small>Server</small><strong>{order.server ?? "—"}</strong></div>
              <div><small>Ngày tạo</small><strong>{formatDate(order.createdAt)}</strong></div>
            </div>
            {order.note ? <p className="order-history-note">Ghi chú: {order.note}</p> : null}
          </article>
        ))}
      </div>

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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
