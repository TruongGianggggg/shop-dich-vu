"use client";

import { CheckCircle2, ChevronLeft, ChevronRight, HandCoins, RefreshCw, XCircle } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminSidebar } from "@/app/components/admin/admin-sidebar";
import { CollaboratorWithdrawal, CollaboratorWithdrawalStatus, formatVnd, getApiErrorMessage, PageResponse } from "@/lib/shop-api";

const labels: Record<CollaboratorWithdrawalStatus, string> = { PENDING: "Chờ duyệt", PAID: "Đã thanh toán", REJECTED: "Đã từ chối" };

export function AdminCollaboratorWithdrawalsManager() {
  const [result, setResult] = useState<PageResponse<CollaboratorWithdrawal> | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/admin/collaborator-withdrawals?page=${page}&size=20`, { cache: "no-store" });
      const data = await readJson(response);
      if (!response.ok) throw new Error(getApiErrorMessage(data, "Không tải được yêu cầu rút tiền."));
      setResult(data as PageResponse<CollaboratorWithdrawal>);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không tải được yêu cầu rút tiền."); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  async function resolve(event: FormEvent, item: CollaboratorWithdrawal, status: "PAID" | "REJECTED") {
    event.preventDefault();
    const action = status === "PAID" ? "xác nhận đã chuyển khoản" : "từ chối và hoàn tiền";
    if (!window.confirm(`Bạn chắc chắn muốn ${action} cho yêu cầu ${item.code}?`)) return;
    setSavingId(item.id); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/admin/collaborator-withdrawals/${encodeURIComponent(item.id)}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote: notes[item.id]?.trim() || null }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(getApiErrorMessage(data, "Không xử lý được yêu cầu rút tiền."));
      setMessage(status === "PAID" ? `Đã xác nhận thanh toán ${item.code}.` : `Đã từ chối ${item.code} và hoàn tiền cho CTV.`);
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không xử lý được yêu cầu rút tiền."); }
    finally { setSavingId(""); }
  }

  const items = result?.content ?? [];
  return <main className="role-dashboard">
    <AdminSidebar active="collaborator-withdrawals" />
    <section className="role-main backoffice-users-main admin-withdraw-main">
      <header className="role-topbar backoffice-users-header"><div><p className="section-kicker">TÀI CHÍNH CTV</p><h1>Yêu cầu rút tiền</h1></div><button className="primary-button h-11 px-5" disabled={loading} onClick={() => void load()} type="button"><RefreshCw size={16} /> Tải lại</button></header>
      {message ? <p className="admin-users-message success">{message}</p> : null}
      {error ? <p className="admin-users-message error">{error}</p> : null}
      <section className="role-panel role-table-panel backoffice-table-card admin-withdraw-card">
        <div className="role-panel-head"><div><p className="section-kicker">DANH SÁCH</p><h2>Lệnh rút tiền cộng tác viên</h2></div><span><HandCoins size={15} /> {result?.totalElements ?? 0} yêu cầu</span></div>
        <div className="role-table-wrap"><table className="role-table collaborator-withdraw-table admin-withdraw-table"><thead><tr><th>Thời gian</th><th>Mã / CTV</th><th>Ngân hàng</th><th>Tài khoản nhận</th><th>Số tiền</th><th>Trạng thái</th><th>Ghi chú và xử lý</th></tr></thead><tbody>
          {items.map((item) => <tr key={item.id}><td>{formatDate(item.createdAt)}</td><td><strong>{item.code}</strong><small>{item.collaboratorUsername}</small></td><td>{item.bankName}</td><td><strong>{item.accountNumber}</strong><small>{item.accountName}</small></td><td><strong>{formatVnd(item.amount)}</strong></td><td><span className={`withdraw-status ${item.status.toLowerCase()}`}>{labels[item.status]}</span></td><td>{item.status === "PENDING" ? <form className="admin-withdraw-actions"><input className="text-field" maxLength={500} placeholder="Ghi chú (không bắt buộc)" value={notes[item.id] ?? ""} onChange={(event) => setNotes({ ...notes, [item.id]: event.target.value })} /><div><button className="primary-button" disabled={!!savingId} onClick={(event) => void resolve(event, item, "PAID")} type="button"><CheckCircle2 size={15} /> Đã chuyển</button><button className="danger-button" disabled={!!savingId} onClick={(event) => void resolve(event, item, "REJECTED")} type="button"><XCircle size={15} /> Từ chối</button></div></form> : <span className="admin-withdraw-note">{item.adminNote || "—"}</span>}</td></tr>)}
        </tbody></table></div>
        {loading ? <p className="collaborator-service-empty">Đang tải yêu cầu...</p> : null}
        {!loading && !items.length ? <p className="collaborator-service-empty">Chưa có yêu cầu rút tiền.</p> : null}
        {result && result.totalPages > 1 ? <div className="admin-users-pagination"><button className="ghost-button h-10 px-4" disabled={result.first || loading} onClick={() => setPage((value) => Math.max(0, value - 1))}><ChevronLeft size={16} /> Trước</button><span>Trang {result.page + 1}/{result.totalPages}</span><button className="ghost-button h-10 px-4" disabled={result.last || loading} onClick={() => setPage((value) => value + 1)}>Sau <ChevronRight size={16} /></button></div> : null}
      </section>
    </section>
  </main>;
}

async function readJson(response: Response) { try { return await response.json() as unknown; } catch { return null; } }
function formatDate(value: string) { return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)); }
