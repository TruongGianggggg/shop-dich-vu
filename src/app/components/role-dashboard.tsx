import Link from "next/link";
import { AdminSidebar } from "@/app/components/admin/admin-sidebar";

type DashboardMetric = {
  label: string;
  value: string;
  trend: string;
  tone: "green" | "blue" | "amber" | "rose";
};

type DashboardTableRow = {
  code: string;
  title: string;
  owner: string;
  status: string;
  amount: string;
};

type DashboardProps = {
  roleLabel: string;
  title: string;
  subtitle: string;
  metrics: DashboardMetric[];
  bars: number[];
  tableTitle: string;
  rows: DashboardTableRow[];
  primaryActionLabel: string;
  primaryActionHref: string;
};

export function RoleDashboard({
  roleLabel,
  title,
  subtitle,
  metrics,
  bars,
  tableTitle,
  rows,
  primaryActionLabel,
  primaryActionHref,
}: DashboardProps) {
  return (
    <main className="role-dashboard">
      <AdminSidebar active="dashboard" />

      <section className="role-main">
        <header className="role-topbar">
          <div>
            <p className="section-kicker">{roleLabel}</p>
            <h1>{title}</h1>
          </div>
          <div className="role-topbar-actions">
            <Link className="ghost-button h-10 px-4 text-sm" href="/">
              Trang chủ
            </Link>
            <Link className="primary-button h-10 px-4 text-sm" href={primaryActionHref}>
              {primaryActionLabel}
            </Link>
          </div>
        </header>

        <p className="role-subtitle">{subtitle}</p>

        <section className="role-metric-grid">
          {metrics.map((metric) => (
            <article className={`role-metric-card tone-${metric.tone}`} key={metric.label}>
              <p>{metric.label}</p>
              <strong>{metric.value}</strong>
              <span>{metric.trend}</span>
            </article>
          ))}
        </section>

        <section className="role-content-grid">
          <article className="role-panel role-chart-panel">
            <div className="role-panel-head">
              <div>
                <p className="section-kicker">Thống kê</p>
                <h2>Hiệu suất 7 ngày</h2>
              </div>
              <span>Tuần này</span>
            </div>
            <div className="role-chart" aria-label="Bieu do hieu suat">
              {bars.map((value, index) => (
                <div className="role-chart-bar" key={`${value}-${index}`}>
                  <span style={{ height: `${value}%` }} />
                </div>
              ))}
            </div>
          </article>

          <article className="role-panel">
            <div className="role-panel-head">
              <div>
                <p className="section-kicker">Hệ thống</p>
                <h2>Trạng thái API</h2>
              </div>
            </div>
            <div className="role-status-list">
              <p>
                <strong>Auth</strong>
                <span>Đăng nhập, đăng ký, role JWT</span>
              </p>
              <p>
                <strong>Service</strong>
                <span>Danh mục, gói dịch vụ, đơn hàng</span>
              </p>
              <p>
                <strong>Wallet</strong>
                <span>Nạp tiền, giao dịch, lịch sử</span>
              </p>
            </div>
          </article>
        </section>

        <section className="role-panel role-table-panel">
          <div className="role-panel-head">
            <div>
              <p className="section-kicker">Công việc</p>
              <h2>{tableTitle}</h2>
            </div>
          </div>
          <div className="role-table-wrap">
            <table className="role-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Nội dung</th>
                  <th>Phụ trách</th>
                  <th>Trạng thái</th>
                  <th>Giá trị</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.code}>
                    <td>{row.code}</td>
                    <td>{row.title}</td>
                    <td>{row.owner}</td>
                    <td>
                      <span className="role-status-pill">{row.status}</span>
                    </td>
                    <td>{row.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}

export const adminDashboardData = {
  roleLabel: "Admin Panel",
  title: "Trang quản trị shop",
  subtitle:
    "Quản trị danh mục, gói dịch vụ, nạp tiền, ngân hàng, phân quyền và cộng tác viên theo API shop-game.",
  primaryActionLabel: "Tạo danh mục",
  primaryActionHref: "/admin/service-categories",
  metrics: [
    { label: "Doanh thu hôm nay", value: "12.8M", trend: "+18% so với hôm qua", tone: "green" },
    { label: "Đơn đang xử lý", value: "42", trend: "8 đơn cần nhận", tone: "blue" },
    { label: "Người dùng", value: "1,284", trend: "+32 tài khoản mới", tone: "amber" },
    { label: "Khiếu nại", value: "3", trend: "Cần kiểm tra", tone: "rose" },
  ],
  bars: [42, 58, 47, 66, 81, 74, 92],
  tableTitle: "Đơn và tác vụ mới",
  rows: [
    { code: "OD-1024", title: "Nạp PUBG Mobile 660 UC", owner: "System", status: "Chờ thanh toán", amount: "245.000 ₫" },
    { code: "OD-1025", title: "Cày rank Liên Quân", owner: "CTV Minh", status: "Đang xử lý", amount: "320.000 ₫" },
    { code: "BK-082", title: "Đồng bộ ngân hàng MB", owner: "Admin", status: "Cần duyệt", amount: "8.500.000 ₫" },
  ],
} satisfies DashboardProps;
