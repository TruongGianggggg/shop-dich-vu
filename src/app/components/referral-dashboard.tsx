"use client";

import { Copy, Gift, HandCoins, Link2, LoaderCircle, Users } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  PageResponse,
  ReferralCommission,
  ReferralSummary,
  ReferralWithdrawal,
  formatVnd,
  getApiErrorMessage,
} from "@/lib/shop-api";
import styles from "./referral-dashboard.module.css";

const categoryLabels = { CAROT: "Nạp Carot", CURRENCY: "Vàng / Ngọc", SERVICE: "Dịch vụ game", VPS: "VPS" } as const;
const statusLabels = { PENDING: "Chờ hoàn thành", PAID: "Đã cộng", CANCELLED: "Đã hủy", REVERSED: "Đã thu hồi" } as const;
const withdrawalLabels = { PENDING: "Chờ duyệt", PAID: "Đã thanh toán", REJECTED: "Đã từ chối" } as const;

export function ReferralDashboard() {
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [commissions, setCommissions] = useState<PageResponse<ReferralCommission> | null>(null);
  const [withdrawals, setWithdrawals] = useState<PageResponse<ReferralWithdrawal> | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const responses = await Promise.all([
        fetch("/api/referrals/me", { cache: "no-store" }),
        fetch("/api/referrals/commissions?page=0&size=20", { cache: "no-store" }),
        fetch("/api/referrals/withdrawals?page=0&size=20", { cache: "no-store" }),
      ]);
      const data = await Promise.all(responses.map(readJson));
      const failed = responses.findIndex((response) => !response.ok);
      if (failed >= 0) throw new Error(getApiErrorMessage(data[failed], "Không tải được thông tin giới thiệu."));
      setSummary(data[0] as ReferralSummary);
      setCommissions(data[1] as PageResponse<ReferralCommission>);
      setWithdrawals(data[2] as PageResponse<ReferralWithdrawal>);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không tải được thông tin giới thiệu."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  const referralLink = useMemo(() => summary?.referralCode && typeof window !== "undefined"
    ? `${window.location.origin}/ref/${summary.referralCode}` : "", [summary?.referralCode]);

  async function saveCode(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/referrals/code", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code.trim().toLowerCase() }) });
      const data = await readJson(response);
      if (!response.ok) throw new Error(getApiErrorMessage(data, "Không lưu được mã giới thiệu."));
      setSummary(data as ReferralSummary); setMessage("Đã tạo mã giới thiệu. Mã này không thể thay đổi.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không lưu được mã giới thiệu."); }
    finally { setSaving(false); }
  }

  async function createWithdrawal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/referrals/withdrawals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: Number(form.get("amount")), bankName: form.get("bankName"), accountNumber: form.get("accountNumber"), accountName: form.get("accountName") }) });
      const data = await readJson(response);
      if (!response.ok) throw new Error(getApiErrorMessage(data, "Không tạo được yêu cầu rút tiền."));
      event.currentTarget.reset(); setMessage("Đã gửi yêu cầu rút hoa hồng."); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không tạo được yêu cầu rút tiền."); }
    finally { setSaving(false); }
  }

  return <main className={styles.main}>
    <header className={styles.header}><div><p>CHƯƠNG TRÌNH GIỚI THIỆU</p><h1>Giới thiệu người dùng</h1><span>Chia sẻ mã của bạn và nhận hoa hồng khi người được giới thiệu hoàn thành đơn hàng.</span></div><Gift size={34} /></header>
    {loading && !summary ? <div className={styles.loading}><LoaderCircle className={styles.spin} /> Đang tải...</div> : null}
    {message ? <p className={styles.success}>{message}</p> : null}{error ? <p className={styles.error}>{error}</p> : null}
    {!summary?.referralCode && !loading ? <form className={styles.codeForm} onSubmit={saveCode}><div><strong>Chọn mã giới thiệu của bạn</strong><span>Mã chỉ được đặt một lần, gồm chữ thường, số và dấu gạch ngang.</span></div><div><span>/ref/</span><input minLength={3} maxLength={32} pattern="[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?" required value={code} onChange={(event) => setCode(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} /><button disabled={saving}>Lưu mã</button></div></form> : null}
    {summary?.referralCode ? <section className={styles.linkPanel}><div><Link2 size={20} /><span>Link giới thiệu của bạn</span><strong>{referralLink}</strong></div><button onClick={async () => { await navigator.clipboard.writeText(referralLink); setMessage("Đã sao chép link giới thiệu."); }} type="button"><Copy size={16} /> Sao chép</button></section> : null}
    <section className={styles.stats}>
      <Stat icon={<HandCoins />} label="Số dư hoa hồng" value={formatVnd(summary?.balance ?? 0)} />
      <Stat icon={<Users />} label="Người đã giới thiệu" value={(summary?.referredUsers ?? 0).toLocaleString("vi-VN")} />
      <Stat icon={<LoaderCircle />} label="Hoa hồng chờ" value={formatVnd(summary?.pendingCommission ?? 0)} />
      <Stat icon={<Gift />} label="Tổng hoa hồng" value={formatVnd(summary?.totalCommission ?? 0)} />
    </section>
    <section className={styles.panel}><div className={styles.panelHead}><div><p>HOA HỒNG</p><h2>Lịch sử hoa hồng</h2></div><span>{commissions?.totalElements ?? 0} giao dịch</span></div><div className={styles.tableWrap}><table><thead><tr><th>Thời gian</th><th>Người dùng</th><th>Mã đơn</th><th>Danh mục</th><th>Giá trị</th><th>Tỷ lệ</th><th>Hoa hồng</th><th>Trạng thái</th></tr></thead><tbody>{commissions?.content.map((item) => <tr key={item.id}><td>{formatDate(item.createdAt)}</td><td>{item.referredUsername}</td><td><strong>{item.requestId}</strong><small>{item.description}</small></td><td>{categoryLabels[item.category]}</td><td>{formatVnd(item.orderAmount)}</td><td>{item.rateBasisPoints / 100}%</td><td className={styles.money}>+{formatVnd(item.commissionAmount)}</td><td><span className={styles.status}>{statusLabels[item.status]}</span></td></tr>)}</tbody></table></div>{!loading && !commissions?.content.length ? <p className={styles.empty}>Chưa có hoa hồng. Hãy chia sẻ link giới thiệu để bắt đầu.</p> : null}</section>
    <section className={styles.withdrawGrid}><form className={styles.withdrawForm} onSubmit={createWithdrawal}><div><p>RÚT TIỀN</p><h2>Rút hoa hồng</h2><span>Tối thiểu 10.000đ</span></div><label>Số tiền<input name="amount" type="number" min="10000" step="1000" required /></label><label>Ngân hàng<input name="bankName" maxLength={80} required /></label><label>Số tài khoản<input name="accountNumber" maxLength={80} required /></label><label>Tên chủ tài khoản<input name="accountName" maxLength={120} required /></label><button disabled={saving || (summary?.balance ?? 0) < 10000}>Gửi yêu cầu rút</button></form><section className={styles.panel}><div className={styles.panelHead}><div><p>LỊCH SỬ</p><h2>Yêu cầu rút tiền</h2></div></div><div className={styles.withdrawList}>{withdrawals?.content.map((item) => <article key={item.id}><div><strong>{item.code}</strong><span>{formatDate(item.createdAt)}</span></div><b>{formatVnd(item.amount)}</b><span className={styles.status}>{withdrawalLabels[item.status]}</span></article>)}{!withdrawals?.content.length ? <p className={styles.empty}>Chưa có yêu cầu rút tiền.</p> : null}</div></section></section>
  </main>;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <article><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></article>; }
async function readJson(response: Response) { try { return await response.json() as unknown; } catch { return null; } }
function formatDate(value: string) { return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)); }
