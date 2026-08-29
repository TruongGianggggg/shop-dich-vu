"use client";

import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminSidebar } from "@/app/components/admin/admin-sidebar";
import {
  AdminDashboardSummary,
  DashboardDay,
  DashboardServiceState,
  formatVnd,
  getApiErrorMessage,
  ServiceOrderStatus,
} from "@/lib/shop-api";

const statusLabels: Record<ServiceOrderStatus, string> = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  done: "Hoàn thành",
  error: "Lỗi",
  refund_error: "Lỗi hoàn tiền",
};

export function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/admin/dashboard", {
          cache: "no-store",
          signal: controller.signal,
        });
        const result = (await response.json()) as AdminDashboardSummary | unknown;
        if (!response.ok) {
          throw new Error(getApiErrorMessage(result, "Không tải được dashboard."));
        }
        setData(result as AdminDashboardSummary);
      } catch (reason) {
        if (controller.signal.aborted) return;
        setError(reason instanceof Error ? reason.message : "Không tải được dashboard.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadDashboard();
    return () => controller.abort();
  }, [refreshKey]);

  const metrics = [
    {
      label: "Doanh thu hôm nay",
      value: data?.revenueToday == null ? "—" : compactVnd(data.revenueToday),
      trend: revenueTrend(data?.revenueChangePercent ?? null),
      tone: "green",
    },
    {
      label: "Đơn đang xử lý",
      value: formatCount(data?.activeOrders),
      trend:
        data?.pendingOrders == null
          ? "Chưa có dữ liệu"
          : `${data.pendingOrders.toLocaleString("vi-VN")} đơn đang chờ`,
      tone: "blue",
    },
    {
      label: "Người dùng",
      value: formatCount(data?.totalUsers),
      trend:
        data?.newUsersToday == null
          ? "Chưa có dữ liệu"
          : `+${data.newUsersToday.toLocaleString("vi-VN")} tài khoản hôm nay`,
      tone: "amber",
    },
    {
      label: "Đơn lỗi / hoàn tiền",
      value: formatCount(data?.failedOrders),
      trend: "Trong 7 ngày gần nhất",
      tone: "rose",
    },
  ] as const;

  return (
    <main className="role-dashboard">
      <AdminSidebar active="dashboard" />

      <section className="role-main admin-dashboard-main" aria-busy={loading}>
        <header className="role-topbar">
          <div>
            <p className="section-kicker">Admin Panel</p>
            <h1>Trang quản trị shop</h1>
          </div>
          <div className="role-topbar-actions">
            <Link className="ghost-button h-10 px-4 text-sm" href="/">
              Trang chủ
            </Link>
            <button
              className="primary-button h-10 px-4 text-sm"
              disabled={loading}
              onClick={() => setRefreshKey((value) => value + 1)}
              type="button"
            >
              <RefreshCw className={loading ? "dashboard-spin" : ""} size={16} />
              {loading ? "Đang tải" : "Tải lại"}
            </button>
          </div>
        </header>

        <p className="role-subtitle">
          Theo dõi doanh thu, đơn hàng, người dùng và tình trạng vận hành từ dữ liệu hệ thống.
        </p>

        {error ? (
          <div className="dashboard-alert error" role="alert">
            <strong>Không thể cập nhật dashboard.</strong>
            <span>{error}</span>
          </div>
        ) : null}
        {data?.warnings.length ? (
          <div className="dashboard-alert warning" role="status">
            <strong>Một phần dữ liệu chưa sẵn sàng.</strong>
            <span>{data.warnings.join(" ")}</span>
          </div>
        ) : null}

        <section className="role-metric-grid">
          {metrics.map((metric) => (
            <article
              className={`role-metric-card tone-${metric.tone}${loading && !data ? " dashboard-skeleton" : ""}`}
              key={metric.label}
            >
              <p>{metric.label}</p>
              <strong>{metric.value}</strong>
              <span>{metric.trend}</span>
            </article>
          ))}
        </section>

        <section className="dashboard-chart-grid">
          <RevenueChart days={data?.last7Days ?? []} loading={loading && !data} />
          <OrderChart days={data?.last7Days ?? []} loading={loading && !data} />
        </section>

        <section className="role-panel dashboard-system-panel">
          <div className="role-panel-head">
            <div>
              <p className="section-kicker">Hệ thống</p>
              <h2>Trạng thái dữ liệu</h2>
            </div>
            <span>{data ? `Cập nhật ${formatTime(data.generatedAt)}` : "Đang kiểm tra"}</span>
          </div>
          <div className="dashboard-health-grid">
            <HealthItem label="Xác thực" state={data?.services.auth} />
            <HealthItem label="Dịch vụ & đơn hàng" state={data?.services.service} />
            <HealthItem label="Ví & nạp tiền" state={data?.services.wallet} />
          </div>
        </section>

        <section className="role-panel role-table-panel">
          <div className="role-panel-head">
            <div>
              <p className="section-kicker">Công việc</p>
              <h2>Đơn mới trong 7 ngày</h2>
            </div>
            <Link href="/admin/active-orders">Xem đơn cần xử lý</Link>
          </div>
          <div className="role-table-wrap">
            <table className="role-table dashboard-order-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Mã</th>
                  <th>Nội dung</th>
                  <th>Phụ trách</th>
                  <th>Trạng thái</th>
                  <th>Giá trị</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentOrders ?? []).map((order) => (
                  <tr key={order.id}>
                    <td>{formatDateTime(order.createdAt)}</td>
                    <td><strong>{order.code}</strong></td>
                    <td>{order.title}</td>
                    <td>{order.owner}</td>
                    <td>
                      <span className={`admin-order-status-pill ${order.status}`}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td><strong>{formatVnd(order.amount)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && !data?.recentOrders.length ? (
            <p className="dashboard-empty">Chưa có đơn hàng trong 7 ngày gần nhất.</p>
          ) : null}
        </section>
      </section>
    </main>
  );
}

function RevenueChart({ days, loading }: { days: DashboardDay[]; loading: boolean }) {
  const max = Math.max(...days.map((day) => day.revenue), 1);
  return (
    <article className={`role-panel dashboard-chart-panel${loading ? " dashboard-skeleton" : ""}`}>
      <div className="role-panel-head">
        <div><p className="section-kicker">Doanh thu</p><h2>Doanh thu 7 ngày</h2></div>
        <span>Đơn hoàn thành</span>
      </div>
      <div className="dashboard-bars" aria-label="Biểu đồ doanh thu 7 ngày">
        {chartDays(days).map((day) => (
          <div className="dashboard-bar-column" key={day.date} title={`${formatDay(day.date)}: ${formatVnd(day.revenue)}`}>
            <span className="dashboard-bar-value">{shortNumber(day.revenue)}</span>
            <div className="dashboard-bar-track">
              <span className="dashboard-revenue-bar" style={{ height: `${Math.max(day.revenue ? 6 : 0, day.revenue / max * 100)}%` }} />
            </div>
            <strong>{formatDay(day.date)}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

function OrderChart({ days, loading }: { days: DashboardDay[]; loading: boolean }) {
  const max = Math.max(...days.map(totalOrders), 1);
  return (
    <article className={`role-panel dashboard-chart-panel${loading ? " dashboard-skeleton" : ""}`}>
      <div className="role-panel-head">
        <div><p className="section-kicker">Đơn hàng</p><h2>Số lượng đơn 7 ngày</h2></div>
        <span>Theo trạng thái</span>
      </div>
      <div className="dashboard-chart-legend" aria-label="Chú thích">
        <span className="done">Hoàn thành</span><span className="active">Chờ / xử lý</span><span className="failed">Lỗi / hoàn tiền</span>
      </div>
      <div className="dashboard-bars dashboard-order-bars" aria-label="Biểu đồ số lượng đơn 7 ngày">
        {chartDays(days).map((day) => {
          const total = totalOrders(day);
          return (
            <div className="dashboard-bar-column" key={day.date} title={`${formatDay(day.date)}: ${total} đơn`}>
              <span className="dashboard-bar-value">{total}</span>
              <div className="dashboard-bar-track">
                <div className="dashboard-stacked-bar" style={{ height: `${Math.max(total ? 6 : 0, total / max * 100)}%` }}>
                  <span className="done" style={{ flex: day.completedOrders }} />
                  <span className="active" style={{ flex: day.activeOrders }} />
                  <span className="failed" style={{ flex: day.failedOrders }} />
                </div>
              </div>
              <strong>{formatDay(day.date)}</strong>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function HealthItem({ label, state }: { label: string; state?: DashboardServiceState }) {
  const tone = state?.toLowerCase() ?? "checking";
  return <div className="dashboard-health-item"><span className={tone} /> <strong>{label}</strong><small>{state ? (state === "UP" ? "Hoạt động" : "Gián đoạn") : "Đang kiểm tra"}</small></div>;
}

function chartDays(days: DashboardDay[]) {
  if (days.length) return days;
  return Array.from({ length: 7 }, (_, index) => ({ date: `day-${index}`, revenue: 0, completedOrders: 0, activeOrders: 0, failedOrders: 0 }));
}

function totalOrders(day: DashboardDay) {
  return day.completedOrders + day.activeOrders + day.failedOrders;
}

function revenueTrend(value: number | null) {
  if (value == null) return "Chưa có dữ liệu so sánh";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}% so với hôm qua`;
}

function compactVnd(value: number) {
  return new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(value) + " ₫";
}

function shortNumber(value: number) {
  return value ? new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(value) : "0";
}

function formatCount(value: number | null | undefined) {
  return value == null ? "—" : value.toLocaleString("vi-VN");
}

function formatDay(value: string) {
  if (value.startsWith("day-")) return "—";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(`${value}T00:00:00+07:00`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value));
}
