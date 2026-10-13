"use client";

import { CheckCircle2, Gift, RefreshCw, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { PageResponse, ReferralCommission, ReferralWithdrawal, formatVnd, getApiErrorMessage } from "@/lib/shop-api";

const categoryLabels = { CAROT: "Carot", CURRENCY: "Vàng/Ngọc", SERVICE: "Dịch vụ", VPS: "VPS" } as const;

export function AdminReferralsManager() {
  const [withdrawals, setWithdrawals] = useState<PageResponse<ReferralWithdrawal> | null>(null);
  const [commissions, setCommissions] = useState<PageResponse<ReferralCommission> | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const responses = await Promise.all([fetch("/api/admin/referrals/withdrawals?page=0&size=50", { cache: "no-store" }), fetch("/api/admin/referrals/commissions?page=0&size=50", { cache: "no-store" })]);
      const data = await Promise.all(responses.map(readJson));
      const failed = responses.findIndex((item) => !item.ok);
      if (failed >= 0) throw new Error(getApiErrorMessage(data[failed], "Không tải được dữ liệu giới thiệu."));
      setWithdrawals(data[0] as PageResponse<ReferralWithdrawal>); setCommissions(data[1] as PageResponse<ReferralCommission>);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không tải được dữ liệu giới thiệu."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  async function resolve(item: ReferralWithdrawal, status: "PAID" | "REJECTED") {
    if (!window.confirm(status === "PAID" ? `Xác nhận đã thanh toán ${item.code}?` : `Từ chối và hoàn lại ${formatVnd(item.amount)}?`)) return;
    setBusy(item.id); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/admin/referrals/withdrawals/${encodeURIComponent(item.id)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, adminNote: null }) });
      const data = await readJson(response); if (!response.ok) throw new Error(getApiErrorMessage(data, "Không xử lý được yêu cầu."));
      setMessage(status === "PAID" ? "Đã xác nhận thanh toán." : "Đã từ chối và hoàn lại hoa hồng."); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không xử lý được yêu cầu."); }
    finally { setBusy(""); }
  }
  return <main className="role-dashboard"><AdminSidebar active="referrals" /><section className="role-main backoffice-users-main admin-withdraw-main"><header className="role-topbar backoffice-users-header"><div><p className="section-kicker">CHƯƠNG TRÌNH REFERRAL</p><h1>Hoa hồng giới thiệu</h1><p className="role-subtitle">Duyệt rút tiền và theo dõi lịch sử hoa hồng giới thiệu.</p></div><button className="primary-button h-11 px-5" disabled={loading} onClick={() => void load()}><RefreshCw size={16} /> Tải lại</button></header>{message ? <p className="admin-users-message success">{message}</p> : null}{error ? <p className="admin-users-message error">{error}</p> : null}<section className="role-panel role-table-panel backoffice-table-card"><div className="role-panel-head"><div><p className="section-kicker">RÚT TIỀN</p><h2>Đơn cần duyệt và lịch sử rút</h2></div><span><Gift size={15} /> {withdrawals?.totalElements ?? 0} yêu cầu</span></div><div className="role-table-wrap"><table className="role-table admin-withdraw-table"><thead><tr><th>Thời gian</th><th>Mã / Người dùng</th><th>Ngân hàng</th><th>Tài khoản</th><th>Số tiền</th><th>Trạng thái</th><th>Xử lý</th></tr></thead><tbody>{withdrawals?.content.map((item) => <tr key={item.id}><td>{formatDate(item.createdAt)}</td><td><strong>{item.code}</strong><small>{item.username}</small></td><td>{item.bankName}</td><td><strong>{item.accountNumber}</strong><small>{item.accountName}</small></td><td><strong>{formatVnd(item.amount)}</strong></td><td><span className={`withdraw-status ${item.status.toLowerCase()}`}>{item.status}</span></td><td>{item.status === "PENDING" ? <div className="admin-withdraw-actions"><div><button className="primary-button" disabled={busy === item.id} onClick={() => void resolve(item, "PAID")}><CheckCircle2 size={15} /> Đã chuyển</button><button className="danger-button" disabled={busy === item.id} onClick={() => void resolve(item, "REJECTED")}><XCircle size={15} /> Từ chối</button></div></div> : "—"}</td></tr>)}</tbody></table></div></section><section className="role-panel role-table-panel backoffice-table-card"><div className="role-panel-head"><div><p className="section-kicker">LỊCH SỬ</p><h2>Hoa hồng đã ghi nhận</h2></div><strong>{commissions?.totalElements ?? 0} giao dịch</strong></div><div className="role-table-wrap"><table className="role-table"><thead><tr><th>Thời gian</th><th>Người được giới thiệu</th><th>Mã đơn</th><th>Danh mục</th><th>Giá trị</th><th>Tỷ lệ</th><th>Hoa hồng</th><th>Trạng thái</th></tr></thead><tbody>{commissions?.content.map((item) => <tr key={item.id}><td>{formatDate(item.createdAt)}</td><td>{item.referredUsername}</td><td><strong>{item.requestId}</strong></td><td>{categoryLabels[item.category]}</td><td>{formatVnd(item.orderAmount)}</td><td>{item.rateBasisPoints / 100}%</td><td><strong>{formatVnd(item.commissionAmount)}</strong></td><td>{item.status}</td></tr>)}</tbody></table></div></section></section></main>;
}

async function readJson(response: Response) { try { return await response.json() as unknown; } catch { return null; } }
function formatDate(value: string) { return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)); }
