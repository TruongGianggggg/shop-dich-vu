"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { AdminSidebar } from "@/app/components/admin/admin-sidebar";
import { getApiErrorMessage, PageResponse } from "@/lib/shop-api";

type ActivityLog = {
  id: number;
  userId: string | null;
  username: string | null;
  role: string | null;
  action: string;
  module: string;
  description: string;
  targetType: string | null;
  targetId: string | null;
  oldData: string | null;
  newData: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  errorMessage: string | null;
  createdAt: string;
};

type Filters = {
  keyword: string;
  action: string;
  module: string;
  success: string;
  fromDate: string;
  toDate: string;
};

const emptyFilters: Filters = {
  keyword: "",
  action: "",
  module: "",
  success: "",
  fromDate: "",
  toDate: "",
};

const actionOptions = [
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "LOGIN_BLOCKED",
  "ACCOUNT_LOCKED",
  "REGISTER",
  "ORDER_CREATED",
  "ORDER_BATCH_CREATED",
  "ORDER_STATUS_CHANGED",
  "USER_CREATED",
  "USER_UPDATED",
  "USER_ROLE_CHANGED",
  "USER_UNLOCKED",
  "USER_DELETED",
];

const moduleOptions = ["AUTH", "USERS", "SERVICE_ORDERS", "CURRENCY_ORDERS"];

export function AdminActivityLogsManager() {
  const [result, setResult] = useState<PageResponse<ActivityLog> | null>(null);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(emptyFilters);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadLogs() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ page: String(page), size: String(size) });
        Object.entries(appliedFilters).forEach(([key, value]) => {
          if (value.trim()) params.set(key, value.trim());
        });
        const response = await fetch(`/api/admin/activity-logs?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await readJson(response);
        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Không tải được nhật ký hoạt động."));
        }
        setResult(data as PageResponse<ActivityLog>);
      } catch (exception) {
        if (controller.signal.aborted) return;
        setResult(null);
        setError(
          exception instanceof Error
            ? exception.message
            : "Không tải được nhật ký hoạt động.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadLogs();
    return () => controller.abort();
  }, [appliedFilters, page, refreshKey, size]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(0);
    setAppliedFilters({ ...filters, keyword: filters.keyword.trim() });
  }

  function clearFilters() {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(0);
  }

  return (
    <main className="role-dashboard">
      <AdminSidebar active="activity-logs" />
      <section className="role-main backoffice-users-main activity-log-main">
        <header className="role-topbar backoffice-users-header">
          <div>
            <p className="section-kicker">Bảo mật &amp; kiểm soát</p>
            <h1>Nhật ký hoạt động</h1>
          </div>
          <button
            className="primary-button h-11 px-5"
            disabled={loading}
            onClick={() => setRefreshKey((value) => value + 1)}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={16} /> Tải lại
          </button>
        </header>

        <section className="role-panel activity-log-intro">
          <ShieldCheck aria-hidden="true" size={24} />
          <div>
            <strong>{(result?.totalElements ?? 0).toLocaleString("vi-VN")} bản ghi</strong>
            <span>Ghi nhận từ backend; mật khẩu, token và dữ liệu bí mật không được lưu.</span>
          </div>
        </section>

        <section className="role-panel currency-order-filter-panel activity-log-filter-panel">
          <div className="currency-order-filter-head">
            <div><strong>Tìm kiếm nhật ký</strong><span>Lọc theo người dùng, hành động, kết quả hoặc thời gian</span></div>
          </div>
          <form className="currency-order-filter-grid activity-log-filter-grid" onSubmit={submit}>
            <label>
              <span>Từ khóa</span>
              <input className="text-field" maxLength={180} onChange={(event) => setFilters({ ...filters, keyword: event.target.value })} placeholder="Username, IP, nội dung, đối tượng..." value={filters.keyword} />
            </label>
            <label>
              <span>Hành động</span>
              <select className="role-select wide" onChange={(event) => setFilters({ ...filters, action: event.target.value })} value={filters.action}>
                <option value="">Tất cả hành động</option>
                {actionOptions.map((action) => <option key={action} value={action}>{actionLabel(action)}</option>)}
              </select>
            </label>
            <label>
              <span>Khu vực</span>
              <select className="role-select wide" onChange={(event) => setFilters({ ...filters, module: event.target.value })} value={filters.module}>
                <option value="">Tất cả khu vực</option>
                {moduleOptions.map((module) => <option key={module} value={module}>{moduleLabel(module)}</option>)}
              </select>
            </label>
            <label>
              <span>Kết quả</span>
              <select className="role-select wide" onChange={(event) => setFilters({ ...filters, success: event.target.value })} value={filters.success}>
                <option value="">Tất cả kết quả</option>
                <option value="true">Thành công</option>
                <option value="false">Thất bại / bị chặn</option>
              </select>
            </label>
            <label><span>Từ ngày</span><input className="text-field" onChange={(event) => setFilters({ ...filters, fromDate: event.target.value })} type="date" value={filters.fromDate} /></label>
            <label><span>Đến ngày</span><input className="text-field" onChange={(event) => setFilters({ ...filters, toDate: event.target.value })} type="date" value={filters.toDate} /></label>
            <div className="currency-order-filter-actions">
              <button className="primary-button h-11 px-5" disabled={loading} type="submit"><Search size={16} /> Tìm kiếm</button>
              <button className="ghost-button h-11 px-4" disabled={loading} onClick={clearFilters} type="button"><X size={16} /> Xóa lọc</button>
            </div>
          </form>
          <div className="activity-log-filter-footer">
            <strong>{(result?.totalElements ?? 0).toLocaleString("vi-VN")} nhật ký</strong>
            <label><span>Số dòng</span><select className="role-select" onChange={(event) => { setSize(Number(event.target.value)); setPage(0); }} value={size}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></label>
          </div>
        </section>

        <section className="role-panel role-table-panel backoffice-table-card activity-log-table-panel">
          <div className="role-panel-head"><div><p className="section-kicker">Danh sách</p><h2>Hoạt động gần đây</h2></div><span>{loading ? "Đang tải..." : `Trang ${(result?.page ?? page) + 1}`}</span></div>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="role-table-wrap">
            <table className="role-table activity-log-table">
              <thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Hành động</th><th>Khu vực</th><th>Nội dung</th><th>IP</th><th>Kết quả</th><th /></tr></thead>
              <tbody>
                {!loading && !result?.content.length ? <tr><td colSpan={8}>Chưa có nhật ký phù hợp.</td></tr> : null}
                {result?.content.map((log) => (
                  <ActivityLogRow expanded={expandedId === log.id} key={log.id} log={log} onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)} />
                ))}
              </tbody>
            </table>
          </div>
          {result && result.totalPages > 1 ? (
            <div className="admin-users-pagination activity-log-pagination">
              <button disabled={result.first || loading} onClick={() => setPage((value) => Math.max(0, value - 1))} type="button"><ChevronLeft size={16} /> Trang trước</button>
              <span>Trang {result.page + 1}/{result.totalPages}</span>
              <button disabled={result.last || loading} onClick={() => setPage((value) => value + 1)} type="button">Trang sau <ChevronRight size={16} /></button>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}

function ActivityLogRow({ log, expanded, onToggle }: { log: ActivityLog; expanded: boolean; onToggle: () => void }) {
  return (
    <>
      <tr>
        <td>{formatDateTime(log.createdAt)}</td>
        <td><strong>{log.username ?? "Khách / không xác định"}</strong>{log.role ? <small>{log.role}</small> : null}</td>
        <td><span className="activity-action-badge">{actionLabel(log.action)}</span></td>
        <td>{moduleLabel(log.module)}</td>
        <td>{log.description}</td>
        <td>{log.ipAddress ?? "—"}</td>
        <td><span className={log.success ? "activity-result success" : "activity-result failed"}>{log.success ? "Thành công" : "Thất bại"}</span></td>
        <td><button aria-label="Xem chi tiết" className="activity-log-expand" onClick={onToggle} type="button">{expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}</button></td>
      </tr>
      {expanded ? (
        <tr className="activity-log-detail-row"><td colSpan={8}><div className="activity-log-detail-grid">
          <Detail label="Đối tượng" value={[log.targetType, log.targetId].filter(Boolean).join(" · ") || "Không có"} />
          <Detail label="Thiết bị" value={log.userAgent ?? "Không xác định"} />
          <Detail label="Dữ liệu trước" value={prettyData(log.oldData)} />
          <Detail label="Dữ liệu sau" value={prettyData(log.newData)} />
          {!log.success ? <Detail label="Lý do" value={log.errorMessage ?? "Không có thông tin"} /> : null}
        </div></td></tr>
      ) : null}
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><p>{value}</p></div>;
}

function actionLabel(action: string) {
  return ({ LOGIN_SUCCESS: "Đăng nhập", LOGIN_FAILED: "Đăng nhập sai", LOGIN_BLOCKED: "Đăng nhập bị chặn", ACCOUNT_LOCKED: "Khóa tài khoản", REGISTER: "Đăng ký", ORDER_CREATED: "Tạo đơn", ORDER_BATCH_CREATED: "Tạo lô đơn", ORDER_STATUS_CHANGED: "Đổi trạng thái đơn", USER_CREATED: "Tạo người dùng", USER_UPDATED: "Sửa người dùng", USER_ROLE_CHANGED: "Đổi quyền", USER_UNLOCKED: "Mở khóa", USER_DELETED: "Xóa người dùng" } as Record<string, string>)[action] ?? action;
}

function moduleLabel(module: string) {
  return ({ AUTH: "Đăng nhập", USERS: "Người dùng", SERVICE_ORDERS: "Đơn dịch vụ", CURRENCY_ORDERS: "Đơn Vàng & Ngọc" } as Record<string, string>)[module] ?? module;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "medium", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value));
}

function prettyData(value: string | null) {
  if (!value) return "Không có";
  try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; }
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text) as unknown; } catch { return { message: text }; }
}
