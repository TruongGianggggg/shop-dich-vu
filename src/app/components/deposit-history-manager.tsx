"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Eye, RefreshCw, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  AuthResponse,
  CardDepositDetail,
  DepositHistory,
  DepositStatus,
  formatVnd,
  getApiErrorMessage,
  PageResponse,
  UserBalance,
} from "@/lib/shop-api";
import { AdminSidebar } from "@/app/components/admin/admin-sidebar";
import { useAuthSession } from "@/app/components/use-auth-session";

const pageSizeOptions = [10, 20, 50] as const;

export function DepositHistoryManager() {
  const session = useAuthSession();
  const [deposits, setDeposits] = useState<DepositHistory[]>([]);
  const [pageInfo, setPageInfo] = useState<PageResponse<DepositHistory> | null>(
    null,
  );
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<(typeof pageSizeOptions)[number]>(10);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [totalDeposited, setTotalDeposited] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositHistory | null>(null);
  const [cardDetail, setCardDetail] = useState<CardDepositDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const pageNumbers = getPageNumbers(
    pageInfo?.page ?? page,
    pageInfo?.totalPages ?? 0,
  );

  useEffect(() => {
    if (!session) {
      return;
    }

    const activeSession = session;
    let ignore = false;

    async function loadDeposits() {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          size: String(pageSize),
        });
        const headers = authHeaders(activeSession);
        const [response, walletResponse] = await Promise.all([
          fetch(`/api/service-orders/history/deposits?${params}`, { headers }),
          fetch(`/api/wallet/${activeSession.userId}`, { headers }),
        ]);
        const data = (await readResponseJson(response)) as
          | PageResponse<DepositHistory>
          | unknown;
        const walletData = (await readResponseJson(walletResponse)) as
          | UserBalance
          | unknown;

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(data, "Khong tai duoc lich su nap tien."),
          );
        }

        if (!walletResponse.ok) {
          throw new Error(
            getApiErrorMessage(walletData, "Khong tai duoc tong tien da nap."),
          );
        }

        if (!ignore) {
          const pageData = data as PageResponse<DepositHistory>;
          const wallet = walletData as UserBalance;
          setDeposits(pageData.content);
          setPageInfo(pageData);
          setTotalDeposited(wallet.totalDeposited);
        }
      } catch (exception) {
        if (!ignore) {
          setDeposits([]);
          setPageInfo(null);
          setTotalDeposited(null);
          setError(
            exception instanceof Error
              ? exception.message
              : "Khong tai duoc lich su nap tien.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadDeposits();

    return () => {
      ignore = true;
    };
  }, [page, pageSize, refreshKey, session]);

  const metrics = useMemo(() => {
    const bankCount = deposits.filter((item) => item.source === "BANK").length;
    const cardCount = deposits.filter((item) => item.source === "CARD").length;
    const completedCount = deposits.filter(
      (item) => item.status === "COMPLETED",
    ).length;

    return [
      {
        label: "Tổng giao dịch",
        value: String(pageInfo?.totalElements ?? deposits.length),
        trend: `Trang ${(pageInfo?.page ?? page) + 1}`,
        tone: "blue",
      },
      {
        label: "Đã hoàn tất",
        value: String(completedCount),
        trend: "Trong trang hiện tại",
        tone: "green",
      },
      {
        label: "Qua ngân hàng",
        value: String(bankCount),
        trend: `${cardCount} nguồn CARD`,
        tone: "amber",
      },
      {
        label: "Thực nhận",
        value: formatVnd(totalDeposited ?? 0),
        trend: "Tổng tiền đã nạp",
        tone: "rose",
      },
    ];
  }, [deposits, page, pageInfo, totalDeposited]);

  function changePageSize(value: string) {
    const parsed = Number(value) as (typeof pageSizeOptions)[number];

    if (pageSizeOptions.includes(parsed)) {
      setPageSize(parsed);
      setPage(0);
    }
  }

  async function openCardDetail(deposit: DepositHistory) {
    if (!session || deposit.source !== "CARD") {
      return;
    }

    setSelectedDeposit(deposit);
    setCardDetail(null);
    setIsDetailLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/deposits/cards/${encodeURIComponent(deposit.id)}`,
        { headers: authHeaders(session) },
      );
      const data = (await readResponseJson(response)) as CardDepositDetail | unknown;
      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, "Không tải được chi tiết giao dịch card."));
      }
      setCardDetail(data as CardDepositDetail);
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Không tải được chi tiết giao dịch card.",
      );
      setSelectedDeposit(null);
    } finally {
      setIsDetailLoading(false);
    }
  }

  function closeDetail() {
    setSelectedDeposit(null);
    setCardDetail(null);
    setIsDetailLoading(false);
  }

  return (
    <main className="role-dashboard">
      <AdminSidebar active="deposits" />

      <section className="role-main backoffice-users-main">
        <header className="role-topbar backoffice-users-header">
          <div>
            <p className="section-kicker">Lịch sử</p>
            <h1>Quản lý nạp tiền</h1>
          </div>
          <div className="role-topbar-actions">
            <Link className="ghost-button h-11 px-5" href="/">
              Trang chủ
            </Link>
            <button
              className="primary-button h-11 px-5"
              disabled={isLoading}
              onClick={() => setRefreshKey((current) => current + 1)}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={16} />
              Tải lại
            </button>
          </div>
        </header>

        <section className="role-metric-grid deposit-history-metrics">
          {metrics.map((metric) => (
            <article
              className={`role-metric-card tone-${metric.tone}`}
              key={metric.label}
            >
              <p>{metric.label}</p>
              <strong>{metric.value}</strong>
              <span>{metric.trend}</span>
            </article>
          ))}
        </section>

        <section className="role-panel admin-users-toolbar deposit-history-toolbar">
          <div className="admin-users-summary deposit-history-summary">
            <strong>
              {(pageInfo?.totalElements ?? 0).toLocaleString("vi-VN")} giao dịch
            </strong>
            <span>ATM/Bank hiển thị dưới nguồn BANK</span>
          </div>
          <label className="field-label deposit-history-size">
            Số dòng
            <select
              className="role-select"
              disabled={isLoading}
              onChange={(event) => changePageSize(event.target.value)}
              value={pageSize}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </section>

        {error ? <p className="admin-users-message error">{error}</p> : null}

        <section className="role-panel role-table-panel backoffice-table-card">
          <div className="role-panel-head">
            <div>
              <p className="section-kicker">Giao dịch</p>
              <h2>Danh sách nạp tiền</h2>
            </div>
            <span>{isLoading ? "Đang tải" : `Trang ${(pageInfo?.page ?? page) + 1}`}</span>
          </div>

          <div className="role-table-wrap">
            <table className="role-table admin-users-table deposit-history-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Mã giao dịch</th>
                  <th>Nguồn</th>
                  <th>Nhà cung cấp</th>
                  <th>Mệnh giá</th>
                  <th>Thực nhận</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((deposit) => (
                  <tr key={deposit.id}>
                    <td>{formatDateTime(deposit.createdAt)}</td>
                    <td className="deposit-transaction-cell">
                      <strong>{deposit.transId}</strong>
                      <small>{deposit.id}</small>
                    </td>
                    <td>
                      <span className={`deposit-source-pill ${deposit.source.toLowerCase()}`}>
                        {deposit.source}
                      </span>
                    </td>
                    <td>{deposit.provider}</td>
                    <td>{formatVnd(deposit.rawAmount)}</td>
                    <td>{formatVnd(deposit.creditedAmount)}</td>
                    <td className="deposit-status-cell">
                      <div className="deposit-status-stack">
                        <span
                          className={`deposit-status-pill ${deposit.status.toLowerCase()}`}
                        >
                          {statusLabel(deposit.status)}
                        </span>
                        {deposit.reason ? <small>{deposit.reason}</small> : null}
                      </div>
                    </td>
                    <td>
                      {deposit.source === "CARD" ? (
                        <button
                          className="ghost-button h-9 px-3"
                          disabled={isDetailLoading && selectedDeposit?.id === deposit.id}
                          onClick={() => void openCardDetail(deposit)}
                          type="button"
                        >
                          <Eye aria-hidden="true" size={15} />
                          Chi tiết
                        </button>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!isLoading && deposits.length === 0 ? (
                  <tr>
                    <td colSpan={8}>Chưa có giao dịch nạp tiền.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="admin-users-pagination deposit-pagination">
            <button
              aria-label="Trang trước"
              className="ghost-button deposit-page-icon"
              disabled={isLoading || pageInfo?.first !== false}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={18} />
            </button>
            <div className="deposit-page-numbers">
              {pageNumbers.map((item, index) =>
                item === "ellipsis" ? (
                  <span className="deposit-page-ellipsis" key={`ellipsis-${index}`}>
                    ...
                  </span>
                ) : (
                  <button
                    aria-current={item === (pageInfo?.page ?? page) ? "page" : undefined}
                    className={
                      item === (pageInfo?.page ?? page)
                        ? "deposit-page-number active"
                        : "deposit-page-number"
                    }
                    disabled={isLoading}
                    key={item}
                    onClick={() => setPage(item)}
                    type="button"
                  >
                    {item + 1}
                  </button>
                ),
              )}
            </div>
            <button
              aria-label="Trang sau"
              className="ghost-button deposit-page-icon"
              disabled={isLoading || pageInfo?.last !== false}
              onClick={() => setPage((current) => current + 1)}
              type="button"
            >
              <ChevronRight aria-hidden="true" size={18} />
            </button>
          </div>
        </section>
      </section>

      {selectedDeposit && typeof document !== "undefined"
        ? createPortal(
            <div className="admin-user-modal" role="presentation">
              <button
                aria-label="Đóng chi tiết giao dịch"
                className="admin-user-modal-backdrop"
                onClick={closeDetail}
                type="button"
              />
              <section
                aria-modal="true"
                className="admin-user-modal-panel admin-order-detail-panel"
                role="dialog"
              >
                <div className="admin-order-detail-header">
                  <div className="admin-order-detail-title">
                    <p className="section-kicker">Chi tiết nạp card</p>
                    <h2>{selectedDeposit.transId}</h2>
                  </div>
                  <button
                    aria-label="Đóng"
                    className="admin-user-modal-close"
                    onClick={closeDetail}
                    type="button"
                  >
                    <X aria-hidden="true" size={18} />
                  </button>
                </div>

                {isDetailLoading ? (
                  <p className="deposit-detail-loading">Đang tải chi tiết...</p>
                ) : cardDetail ? (
                  <div className="admin-order-basic-detail">
                    <section className="admin-order-detail-card">
                      <h3>Thông tin giao dịch</h3>
                      <div className="admin-order-compact-grid">
                        <DetailRow label="User ID" value={cardDetail.userId} />
                        <DetailRow label="Nhà mạng" value={cardDetail.telco} />
                        <DetailRow label="Mệnh giá" value={formatVnd(cardDetail.declaredAmount)} />
                        <DetailRow label="Thực nhận" value={formatVnd(cardDetail.creditedAmount)} />
                        <DetailRow label="Trạng thái" value={statusLabel(cardDetail.status)} />
                        <DetailRow label="Thời gian" value={formatDateTime(cardDetail.createdAt)} />
                      </div>
                    </section>
                    <section className="admin-order-detail-card deposit-card-secret-card">
                      <h3>Thông tin card</h3>
                      <div className="admin-order-compact-notes">
                        <DetailRow label="Serial" secret value={cardDetail.serial} />
                        <DetailRow label="Mã thẻ" secret value={cardDetail.pin} />
                        {cardDetail.reason ? (
                          <DetailRow label="Ghi chú" value={cardDetail.reason} />
                        ) : null}
                      </div>
                    </section>
                  </div>
                ) : null}
              </section>
            </div>,
            document.body,
          )
        : null}
    </main>
  );
}

function DetailRow({ label, secret = false, value }: { label: string; secret?: boolean; value: string }) {
  return (
    <div className="admin-order-compact-row">
      <span>{label}</span>
      <strong className={secret ? "deposit-card-secret" : undefined}>{value || "—"}</strong>
    </div>
  );
}

function authHeaders(_session: AuthResponse) {
  void _session;
  return {};
}

async function readResponseJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function statusLabel(status: DepositStatus) {
  if (status === "COMPLETED") {
    return "Hoàn tất";
  }

  if (status === "FAILED") {
    return "Thất bại";
  }

  return "Đang chờ";
}

function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getPageNumbers(
  currentPage: number,
  totalPages: number,
): Array<number | "ellipsis"> {
  if (totalPages <= 0) {
    return [0];
  }

  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const pages: Array<number | "ellipsis"> = [0, 1, 2];
  const lastPage = totalPages - 1;

  if (currentPage > 3) {
    pages.push("ellipsis");
  }

  if (currentPage > 2 && currentPage < lastPage) {
    pages.push(currentPage);
  }

  if (currentPage < lastPage - 1) {
    pages.push("ellipsis");
  }

  pages.push(lastPage);

  return pages;
}
