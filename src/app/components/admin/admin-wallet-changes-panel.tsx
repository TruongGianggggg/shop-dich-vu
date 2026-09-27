"use client";

import { ChevronLeft, ChevronRight, Search, WalletCards, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import {
  AdminWalletTransaction,
  formatVnd,
  getApiErrorMessage,
  PageResponse,
  WalletTransactionType,
} from "@/lib/shop-api";
import styles from "./admin-wallet-changes-panel.module.css";

const typeOptions: WalletTransactionType[] = [
  "TOPUP_CARD", "TOPUP_BANK", "ADMIN_ADJUSTMENT", "SERVICE_ORDER_PAYMENT", "SERVICE_ORDER_REFUND",
];

export function AdminWalletChangesPanel() {
  const [result, setResult] = useState<PageResponse<AdminWalletTransaction> | null>(null);
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState("");
  const [applied, setApplied] = useState({ keyword: "", type: "" });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ page: String(page), size: "10" });
        if (applied.keyword) params.set("keyword", applied.keyword);
        if (applied.type) params.set("type", applied.type);
        const response = await fetch(`/api/admin/wallet-transactions?${params}`, { cache: "no-store", signal: controller.signal });
        const payload = await readJson(response);
        if (!response.ok) throw new Error(getApiErrorMessage(payload, "Không tải được biến động số dư."));
        setResult(payload as PageResponse<AdminWalletTransaction>);
      } catch (requestError) {
        if (controller.signal.aborted) return;
        setError(requestError instanceof Error ? requestError.message : "Không tải được biến động số dư.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [applied, page]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(0);
    setApplied({ keyword: keyword.trim(), type });
  }

  function clear() {
    setKeyword(""); setType(""); setApplied({ keyword: "", type: "" }); setPage(0);
  }

  return (
    <section className={`role-panel ${styles.panel}`}>
      <div className={`role-panel-head ${styles.header}`}>
        <div>
          <p className="section-kicker">Theo dõi tài chính</p>
          <h2>Biến động số dư</h2>
          <small>Dữ liệu được lưu trong 7 ngày và tự động xóa khi hết hạn.</small>
        </div>
        <span className={styles.count}><WalletCards size={17} />{(result?.totalElements ?? 0).toLocaleString("vi-VN")} giao dịch</span>
      </div>
      <form className={styles.filter} onSubmit={submit}>
        <label><span>Tìm tài khoản hoặc giao dịch</span><input className="text-field" onChange={(event) => setKeyword(event.target.value)} placeholder="Username, mã hoặc nội dung..." value={keyword} /></label>
        <label><span>Loại biến động</span><select className="role-select wide" onChange={(event) => setType(event.target.value)} value={type}><option value="">Tất cả loại biến động</option>{typeOptions.map((value) => <option key={value} value={value}>{transactionLabel(value)}</option>)}</select></label>
        <div className={styles.filterActions}><button className="primary-button" disabled={loading} type="submit"><Search size={16} />Lọc</button><button className="ghost-button" disabled={loading} onClick={clear} type="button"><X size={16} />Xóa lọc</button></div>
      </form>
      {error ? <p className="form-error">{error}</p> : null}
      <div className={`role-table-wrap ${styles.tableWrap}`}>
        <table className={`role-table ${styles.table}`}>
          <thead><tr><th>Thời gian</th><th>Người dùng</th><th>Nội dung</th><th>Trước → Sau</th><th>Biến động</th></tr></thead>
          <tbody>
            {!loading && !result?.content.length ? <tr><td colSpan={5}>Chưa có biến động số dư phù hợp.</td></tr> : null}
            {result?.content.map((item) => <tr key={item.id}><td className={styles.timeCell}>{formatDateTime(item.createdAt)}</td><td className={styles.userCell}><strong>{item.username}</strong><small>{item.userId}</small></td><td className={styles.contentCell}><strong>{transactionLabel(item.type)}</strong><small>{item.content}</small><code>{item.code}</code></td><td className={styles.balanceCell}>{formatVnd(item.balanceBefore)} <span>→</span> {formatVnd(item.balanceAfter)}</td><td><strong className={item.amount > 0 ? styles.credit : styles.debit}>{item.amount > 0 ? "+" : "-"}{formatVnd(Math.abs(item.amount))}</strong></td></tr>)}
          </tbody>
        </table>
      </div>
      {result && result.totalPages > 1 ? <div className="admin-users-pagination activity-log-pagination"><button disabled={result.first || loading} onClick={() => setPage((value) => Math.max(0, value - 1))} type="button"><ChevronLeft size={16} />Trang trước</button><span>Trang {result.page + 1}/{result.totalPages}</span><button disabled={result.last || loading} onClick={() => setPage((value) => value + 1)} type="button">Trang sau<ChevronRight size={16} /></button></div> : null}
    </section>
  );
}

function transactionLabel(type: string) {
  return ({ TOPUP_CARD: "Nạp thẻ", TOPUP_BANK: "Nạp ngân hàng", ADMIN_ADJUSTMENT: "Admin điều chỉnh", SERVICE_ORDER_PAYMENT: "Thanh toán đơn", SERVICE_ORDER_REFUND: "Hoàn tiền" } as Record<string, string>)[type] ?? type;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "medium", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value));
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text) as unknown; } catch { return { message: text }; }
}
