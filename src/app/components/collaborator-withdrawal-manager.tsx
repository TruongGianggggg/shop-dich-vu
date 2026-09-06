"use client";

import {
  BadgeDollarSign,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  History,
  Landmark,
  Send,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { CollaboratorSidebar } from "@/app/components/collaborator-sidebar";
import { useUserBalance } from "@/app/components/use-user-balance";
import {
  CollaboratorWithdrawal,
  CollaboratorWithdrawalStatus,
  formatVnd,
  getApiErrorMessage,
  PageResponse,
} from "@/lib/shop-api";

const minimumAmount = 50_000;
const bankNames = [
  "Vietcombank", "VietinBank", "BIDV", "Agribank", "MB Bank", "Techcombank",
  "ACB", "VPBank", "TPBank", "Sacombank", "VIB", "SHB", "OCB", "SeABank",
  "MSB", "HDBank", "Nam A Bank", "Eximbank", "PVcomBank", "MoMo",
];
const statusLabels: Record<CollaboratorWithdrawalStatus, string> = {
  PENDING: "Chờ duyệt",
  PAID: "Đã thanh toán",
  REJECTED: "Đã từ chối",
};

export function CollaboratorWithdrawalManager({ view }: { view: "create" | "history" }) {
  const { refresh: refreshWallet, wallet } = useUserBalance();
  const [history, setHistory] = useState<PageResponse<CollaboratorWithdrawal> | null>(null);
  const [page, setPage] = useState(0);
  const [form, setForm] = useState({ bankName: "", accountNumber: "", accountName: "", amount: "" });
  const [loading, setLoading] = useState(view === "history");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/collaborators/withdrawals?page=${page}&size=20`, { cache: "no-store" });
      const data = await readJson(response);
      if (!response.ok) throw new Error(getApiErrorMessage(data, "Không tải được lịch sử rút tiền."));
      setHistory(data as PageResponse<CollaboratorWithdrawal>);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không tải được lịch sử rút tiền.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (view !== "history") return;
    const timer = window.setTimeout(() => void loadHistory(), 0);
    return () => window.clearTimeout(timer);
  }, [loadHistory, view]);

  async function submitWithdrawal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!Number.isSafeInteger(amount) || amount < minimumAmount) {
      setError(`Số tiền rút tối thiểu là ${formatVnd(minimumAmount)}.`);
      return;
    }
    if (wallet && amount > wallet.collaboratorBalance) {
      setError("Số dư CTV khả dụng không đủ.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/collaborators/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(getApiErrorMessage(data, "Không tạo được yêu cầu rút tiền."));
      setForm({ bankName: "", accountNumber: "", accountName: "", amount: "" });
      setMessage("Đã tạo yêu cầu rút tiền. Vui lòng chờ admin xử lý.");
      refreshWallet();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không tạo được yêu cầu rút tiền.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="role-dashboard">
      <CollaboratorSidebar active={view === "create" ? "withdraw" : "withdraw-history"} />
      <section className="role-main collaborator-role-main collaborator-withdraw-main">
        <header className="role-topbar backoffice-users-header collaborator-withdraw-hero">
          <div><p className="section-kicker">TÀI CHÍNH CỘNG TÁC VIÊN</p><h1>{view === "create" ? "Rút tiền về tài khoản" : "Lịch sử rút tiền"}</h1><span>{view === "create" ? "Tạo yêu cầu thanh toán hoa hồng nhanh chóng và an toàn." : "Theo dõi toàn bộ yêu cầu và trạng thái thanh toán của bạn."}</span></div>
          <div className="collaborator-withdraw-balance"><WalletCards size={22} /><span>Số dư có thể rút</span><strong>{formatVnd(wallet?.collaboratorBalance ?? 0)}</strong></div>
        </header>

        {message ? <p className="admin-users-message success">{message}</p> : null}
        {error ? <p className="admin-users-message error">{error}</p> : null}

        {view === "create" ? (
          <div className="collaborator-withdraw-layout">
            <section className="role-panel collaborator-withdraw-card">
              <div className="collaborator-withdraw-card-head"><span><Landmark size={22} /></span><div><p className="section-kicker">TẠO YÊU CẦU</p><h2>Thông tin tài khoản nhận</h2><small>Vui lòng nhập chính xác để tránh chậm thanh toán.</small></div></div>
              <form className="collaborator-withdraw-form" onSubmit={submitWithdrawal}>
                <label className="field-label withdraw-field"><span>Ngân hàng</span><div className="withdraw-input-shell"><Building2 size={18} />
                  <select required value={form.bankName} onChange={(event) => setForm({ ...form, bankName: event.target.value })}>
                    <option value="">Chọn ngân hàng nhận tiền</option>
                    {bankNames.map((bank) => <option key={bank} value={bank}>{bank}</option>)}
                  </select>
                </div></label>
                <label className="field-label withdraw-field"><span>Số tài khoản</span><div className="withdraw-input-shell"><BadgeDollarSign size={18} />
                  <input maxLength={40} placeholder="Ví dụ: 0123456789" required value={form.accountNumber} onChange={(event) => setForm({ ...form, accountNumber: event.target.value.replace(/\s/g, "") })} />
                </div></label>
                <label className="field-label withdraw-field withdraw-field-full"><span>Tên chủ tài khoản</span><div className="withdraw-input-shell"><UserRound size={18} />
                  <input maxLength={120} placeholder="NGUYEN VAN A" required value={form.accountName} onChange={(event) => setForm({ ...form, accountName: event.target.value.toUpperCase() })} />
                </div></label>
                <label className="field-label withdraw-field withdraw-field-full"><span>Số tiền muốn rút</span><div className="withdraw-input-shell withdraw-amount-input"><span>₫</span>
                  <input inputMode="numeric" min={minimumAmount} placeholder="Nhập số tiền" required type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
                </div><small>Số tiền tối thiểu: <strong>{formatVnd(minimumAmount)}</strong></small></label>
                <div className="withdraw-quick-amounts">
                  {[50_000, 100_000, 200_000].map((amount) => <button disabled={(wallet?.collaboratorBalance ?? 0) < amount} key={amount} onClick={() => setForm({ ...form, amount: String(amount) })} type="button">{formatVnd(amount)}</button>)}
                  <button disabled={(wallet?.collaboratorBalance ?? 0) < minimumAmount} onClick={() => setForm({ ...form, amount: String(wallet?.collaboratorBalance ?? 0) })} type="button">Rút toàn bộ</button>
                </div>
                <div className="collaborator-withdraw-notice"><ShieldCheck size={19} /><div><strong>Thông tin được bảo vệ</strong><p>Nếu admin từ chối yêu cầu, toàn bộ số tiền sẽ tự động hoàn lại ví CTV.</p></div></div>
                <button className="primary-button collaborator-withdraw-submit" disabled={saving} type="submit"><Send size={17} />{saving ? "Đang gửi yêu cầu..." : "Gửi yêu cầu rút tiền"}</button>
              </form>
            </section>

            <aside className="collaborator-withdraw-guide">
              <div className="withdraw-guide-balance"><span><WalletCards size={21} /></span><p>Số dư khả dụng</p><strong>{formatVnd(wallet?.collaboratorBalance ?? 0)}</strong><small>Tiền hoa hồng có thể yêu cầu thanh toán</small></div>
              <div className="withdraw-guide-steps"><h3>Quy trình thanh toán</h3><div><span>1</span><p><strong>Gửi yêu cầu</strong><small>Nhập tài khoản và số tiền</small></p></div><div><span>2</span><p><strong>Admin kiểm tra</strong><small>Đối chiếu thông tin nhận tiền</small></p></div><div><span><CheckCircle2 size={15} /></span><p><strong>Nhận thanh toán</strong><small>Trạng thái được cập nhật tại lịch sử</small></p></div></div>
              <div className="withdraw-guide-time"><Clock3 size={18} /><p><strong>Thời gian xử lý</strong><small>Yêu cầu được admin duyệt thủ công.</small></p></div>
            </aside>
          </div>
        ) : (
          <section className="role-panel role-table-panel backoffice-table-card collaborator-withdraw-history-card">
            <div className="role-panel-head"><div><p className="section-kicker">LỊCH SỬ</p><h2>Yêu cầu rút tiền của tôi</h2></div><span><History size={15} /> {history?.totalElements ?? 0} yêu cầu</span></div>
            <div className="role-table-wrap"><table className="role-table collaborator-withdraw-table"><thead><tr><th>Thời gian</th><th>Mã giao dịch</th><th>Ngân hàng</th><th>Tài khoản nhận</th><th>Số tiền</th><th>Trạng thái</th><th>Ghi chú admin</th></tr></thead><tbody>
              {(history?.content ?? []).map((item) => <tr key={item.id}><td>{formatDate(item.createdAt)}</td><td><strong>{item.code}</strong></td><td>{item.bankName}</td><td><strong>{item.accountNumber}</strong><small>{item.accountName}</small></td><td><strong>{formatVnd(item.amount)}</strong></td><td><span className={`withdraw-status ${item.status.toLowerCase()}`}>{statusLabels[item.status]}</span></td><td>{item.adminNote || "—"}</td></tr>)}
            </tbody></table></div>
            {!loading && !history?.content.length ? <p className="collaborator-service-empty">Chưa có yêu cầu rút tiền.</p> : null}
            {loading ? <p className="collaborator-service-empty">Đang tải lịch sử...</p> : null}
            {history && history.totalPages > 1 ? <div className="admin-users-pagination"><button className="ghost-button h-10 px-4" disabled={history.first || loading} onClick={() => setPage((value) => Math.max(0, value - 1))}><ChevronLeft size={16} /> Trước</button><span>Trang {history.page + 1}/{history.totalPages}</span><button className="ghost-button h-10 px-4" disabled={history.last || loading} onClick={() => setPage((value) => value + 1)}>Sau <ChevronRight size={16} /></button></div> : null}
          </section>
        )}
      </section>
    </main>
  );
}

async function readJson(response: Response) { try { return await response.json() as unknown; } catch { return null; } }
function formatDate(value: string) { return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)); }
