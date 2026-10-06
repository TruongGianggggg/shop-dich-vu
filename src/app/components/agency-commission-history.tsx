"use client";

import { ChevronLeft, ChevronRight, Gift, LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  AgencyCommission,
  AgencyCommissionStatus,
  PageResponse,
  formatVnd,
  getApiErrorMessage,
} from "@/lib/shop-api";
import { useAgencySummary } from "./use-agency-summary";
import styles from "./agency-commission-history.module.css";

const categoryLabels = { CAROT: "Carot", CURRENCY: "Vàng/Ngọc", SERVICE: "Dịch vụ", VPS: "VPS" } as const;
const statusLabels: Record<AgencyCommissionStatus, string> = {
  PENDING: "Chờ hoàn thành",
  PAID: "Đã cộng tiền",
  CANCELLED: "Không đủ điều kiện",
  REVERSED: "Đã thu hồi",
};

export function AgencyCommissionHistory() {
  const agency = useAgencySummary();
  const [result, setResult] = useState<PageResponse<AgencyCommission> | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/agency/commissions?page=${page}&size=20`, { cache: "no-store" });
      const data = (await response.json()) as PageResponse<AgencyCommission> | unknown;
      if (!response.ok) throw new Error(getApiErrorMessage(data, "Không tải được lịch sử hoa hồng."));
      setResult(data as PageResponse<AgencyCommission>);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không tải được lịch sử hoa hồng.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div><p>TÀI KHOẢN CỦA TÔI</p><h1>Lịch sử hoa hồng</h1><span>Cấp được tính theo tiền đã tiêu trong 30 ngày gần nhất; hoa hồng giữ theo cấp tại lúc tạo đơn.</span></div>
        <div className={styles.tier}><Gift size={23} /><span>Đại lý cấp {agency.summary?.level ?? 0}</span><strong>{formatVnd(agency.summary?.totalCommissionEarned ?? 0)}</strong><small>Tổng hoa hồng đã nhận</small></div>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}
      <section className={styles.panel}>
        <div className={styles.tableHead}>
          <span>Thời gian</span><span>Mã đơn</span><span>Loại đơn</span><span>Giá trị đơn</span><span>Cấp và tỷ lệ</span><span>Hoa hồng</span><span>Trạng thái</span>
        </div>
        {loading && !result ? <div className={styles.empty}><LoaderCircle className={styles.spin} />Đang tải lịch sử...</div> : null}
        {!loading && !result?.content.length ? <div className={styles.empty}><Gift /><strong>Chưa có hoa hồng</strong><span>Đơn đủ điều kiện sẽ xuất hiện tại đây.</span></div> : null}
        <div className={styles.list}>
          {result?.content.map((item) => (
            <article className={styles.row} key={item.id}>
              <Cell label="Thời gian" value={formatDateTime(item.createdAt)} />
              <Cell label="Mã đơn" value={item.requestId} secondary={item.description} />
              <Cell label="Loại đơn" value={categoryLabels[item.category]} />
              <Cell label="Giá trị đơn" value={formatVnd(item.orderAmount)} />
              <Cell label="Cấp và tỷ lệ" value={`Cấp ${item.agencyLevel} · ${item.rateBasisPoints / 100}%`} />
              <Cell label="Hoa hồng" value={`+${formatVnd(item.commissionAmount)}`} emphasize />
              <div className={styles.cell}><small>Trạng thái</small><span className={`${styles.status} ${styles[item.status.toLowerCase()]}`}>{statusLabels[item.status]}</span></div>
            </article>
          ))}
        </div>
        {result && result.totalPages > 1 ? (
          <footer className={styles.pagination}>
            <button disabled={result.first || loading} onClick={() => setPage((value) => Math.max(0, value - 1))} type="button"><ChevronLeft size={16} />Trang trước</button>
            <span>Trang {result.page + 1}/{result.totalPages}</span>
            <button disabled={result.last || loading} onClick={() => setPage((value) => value + 1)} type="button">Trang sau<ChevronRight size={16} /></button>
          </footer>
        ) : null}
      </section>
    </main>
  );
}

function Cell({ label, value, secondary, emphasize = false }: { label: string; value: string; secondary?: string; emphasize?: boolean }) {
  return <div className={styles.cell}><small>{label}</small><strong className={emphasize ? styles.emphasize : ""}>{value}</strong>{secondary ? <span>{secondary}</span> : null}</div>;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value));
}
