"use client";

import { Coins, Gem, RefreshCw, Search, Server, Users, X } from "lucide-react";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { AdminSidebar } from "@/app/components/admin/admin-sidebar";
import { useAuthSession } from "@/app/components/use-auth-session";
import { CollaboratorCurrencyServer, formatVnd, getApiErrorMessage } from "@/lib/shop-api";

type Filters = { username: string; server: string; currency: "" | "GOLD" | "GEM"; status: "" | "ACTIVE" | "INACTIVE" };
const emptyFilters: Filters = { username: "", server: "", currency: "", status: "" };

export function AdminCollaboratorCurrencySettingsManager() {
  const session = useAuthSession();
  const [configs, setConfigs] = useState<CollaboratorCurrencyServer[]>([]);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [applied, setApplied] = useState<Filters>(emptyFilters);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    let ignore = false;
    async function load() {
      setLoading(true); setError("");
      try {
        const response = await fetch("/api/admin/collaborator-currency-servers", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(getApiErrorMessage(data, "Không tải được cấu hình của CTV."));
        if (!ignore) setConfigs(data as CollaboratorCurrencyServer[]);
      } catch (reason) {
        if (!ignore) setError(reason instanceof Error ? reason.message : "Không tải được cấu hình của CTV.");
      } finally { if (!ignore) setLoading(false); }
    }
    void load();
    return () => { ignore = true; };
  }, [refreshKey, session]);

  const visibleConfigs = useMemo(() => configs.filter((config) => {
    if (applied.username && !config.collaboratorUsername.toLowerCase().includes(applied.username.toLowerCase())) return false;
    if (applied.server && !config.name.toLowerCase().includes(applied.server.toLowerCase())) return false;
    if (applied.currency === "GOLD" && !config.goldEnabled) return false;
    if (applied.currency === "GEM" && !config.gemEnabled) return false;
    if (applied.status === "ACTIVE" && !config.active) return false;
    if (applied.status === "INACTIVE" && config.active) return false;
    return true;
  }), [applied, configs]);

  const collaboratorCount = new Set(configs.map((item) => item.collaboratorUsername)).size;
  function search(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setApplied({ ...filters }); }
  function clear() { setFilters(emptyFilters); setApplied(emptyFilters); }

  return <main className="role-dashboard">
    <AdminSidebar active="collaborator-currency-settings" />
    <section className="role-main backoffice-users-main ctv-config-admin-main">
      <header className="role-topbar backoffice-users-header">
        <div><p className="section-kicker">Cộng tác viên</p><h1>Cấu hình Vàng &amp; Ngọc CTV</h1><p className="role-subtitle">Theo dõi giá và server do từng cộng tác viên thiết lập.</p></div>
        <button className="ghost-button h-11 px-5" disabled={loading} onClick={() => setRefreshKey((value) => value + 1)} type="button"><RefreshCw size={16} /> Tải lại</button>
      </header>

      <div className="ctv-config-stats">
        <Stat icon={<Users size={20} />} label="CTV đã cấu hình" value={collaboratorCount} />
        <Stat icon={<Server size={20} />} label="Tổng cấu hình" value={configs.length} />
        <Stat icon={<Coins size={20} />} label="Server Vàng" value={configs.filter((item) => item.goldEnabled).length} />
        <Stat icon={<Gem size={20} />} label="Server Ngọc" value={configs.filter((item) => item.gemEnabled).length} />
      </div>

      <section className="role-panel ctv-config-filter-panel">
        <form className="ctv-config-filter-grid" onSubmit={search}>
          <label><span>Tài khoản CTV</span><input className="text-field" placeholder="Nhập username" value={filters.username} onChange={(event) => setFilters({ ...filters, username: event.target.value })} /></label>
          <label><span>Tên server</span><input className="text-field" placeholder="Ví dụ: Server 15" value={filters.server} onChange={(event) => setFilters({ ...filters, server: event.target.value })} /></label>
          <label><span>Loại</span><select className="role-select wide" value={filters.currency} onChange={(event) => setFilters({ ...filters, currency: event.target.value as Filters["currency"] })}><option value="">Tất cả</option><option value="GOLD">Vàng</option><option value="GEM">Ngọc</option></select></label>
          <label><span>Trạng thái</span><select className="role-select wide" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as Filters["status"] })}><option value="">Tất cả</option><option value="ACTIVE">Đang bật</option><option value="INACTIVE">Đang tắt</option></select></label>
          <div className="ctv-config-filter-actions"><button className="primary-button h-11 px-5" type="submit"><Search size={16} /> Tìm kiếm</button><button className="ghost-button h-11 px-4" onClick={clear} type="button"><X size={16} /> Xóa lọc</button></div>
        </form>
      </section>

      {error ? <p className="admin-users-message error">{error}</p> : null}
      <section className="role-panel role-table-panel backoffice-table-card">
        <div className="role-panel-head"><div><p className="section-kicker">Danh sách</p><h2>Cấu hình của cộng tác viên</h2></div><strong>{visibleConfigs.length.toLocaleString("vi-VN")} cấu hình</strong></div>
        <div className="role-table-wrap"><table className="role-table ctv-config-admin-table"><thead><tr><th>CTV</th><th>Server</th><th>Index tool</th><th>Vàng</th><th>Giá Vàng</th><th>Ngọc</th><th>Giá Ngọc</th><th>Trạng thái</th></tr></thead><tbody>
          {visibleConfigs.map((config) => <tr key={config.id}>
            <td><strong>{config.collaboratorUsername}</strong></td>
            <td><strong>{config.name}</strong><small>Thứ tự #{config.displayOrder}</small></td>
            <td><span className="ctv-tool-index">{config.toolServerIndex}</span>{config.toolServerIndex === 22 ? <small>Server 15</small> : null}</td>
            <td>{config.goldEnabled ? <><strong>{config.goldAmount.toLocaleString("vi-VN")}</strong><small>{config.goldSaleType === "FRESH" ? "Vàng tươi" : "Thỏi vàng"}</small></> : <span className="ctv-config-off">Không bán</span>}</td>
            <td>{config.goldEnabled ? <strong>{formatVnd(config.goldPrice)}</strong> : "—"}</td>
            <td>{config.gemEnabled ? <strong>{config.gemAmount.toLocaleString("vi-VN")}</strong> : <span className="ctv-config-off">Không bán</span>}</td>
            <td>{config.gemEnabled ? <strong>{formatVnd(config.gemPrice)}</strong> : "—"}</td>
            <td><span className={config.active ? "ctv-config-status active" : "ctv-config-status"}>{config.active ? "Đang bật" : "Đang tắt"}</span></td>
          </tr>)}
        </tbody></table></div>
        {!loading && !visibleConfigs.length ? <p className="admin-users-message">Chưa có cấu hình phù hợp.</p> : null}
        {loading ? <p className="admin-users-message">Đang tải cấu hình...</p> : null}
      </section>
    </section>
  </main>;
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return <article className="role-panel ctv-config-stat"><span>{icon}</span><div><small>{label}</small><strong>{value.toLocaleString("vi-VN")}</strong></div></article>;
}
