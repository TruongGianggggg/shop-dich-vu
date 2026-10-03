"use client";

import { AlertTriangle, CheckCircle2, WalletCards, X } from "lucide-react";
import { useEffect } from "react";
import { formatVnd } from "@/lib/shop-api";

type ConfirmationDetail = {
  label: string;
  value: string;
};

export function OrderConfirmationDialog({
  balance,
  balanceError,
  details,
  isOpen,
  isSubmitting,
  onCancel,
  onConfirm,
  orderValue,
  title,
}: {
  balance: number | null;
  balanceError?: string;
  details: ConfirmationDetail[];
  isOpen: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  orderValue: number;
  title: string;
}) {
  useEffect(() => {
    if (!isOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) onCancel();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen, isSubmitting, onCancel]);

  if (!isOpen) return null;

  const hasEnoughBalance = balance === null || balance >= orderValue;
  const balancePending = balance === null && !balanceError;
  const remainingBalance = balance === null ? null : balance - orderValue;

  return (
    <div
      aria-labelledby="order-confirmation-title"
      aria-modal="true"
      className="order-confirmation-backdrop"
      role="dialog"
    >
      <div className="order-confirmation-dialog">
        <div className="order-confirmation-head">
          <span><CheckCircle2 aria-hidden="true" size={23} /></span>
          <div>
            <small>XÁC NHẬN ĐẶT HÀNG</small>
            <h2 id="order-confirmation-title">{title}</h2>
          </div>
          <button
            aria-label="Đóng xác nhận"
            className="order-confirmation-close"
            disabled={isSubmitting}
            onClick={onCancel}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="order-confirmation-details">
          {details.map((detail) => (
            <div key={detail.label}>
              <span>{detail.label}</span>
              <strong>{detail.value}</strong>
            </div>
          ))}
        </div>

        <div className="order-confirmation-wallet">
          <span className="order-confirmation-wallet-icon">
            <WalletCards aria-hidden="true" size={22} />
          </span>
          <div><small>Số dư hiện tại</small><strong>{balance === null ? "Đang tải..." : formatVnd(balance)}</strong></div>
          <div><small>Giá trị đơn</small><strong className="is-order-value">-{formatVnd(orderValue)}</strong></div>
          <div><small>Số dư dự kiến</small><strong className={hasEnoughBalance ? "" : "is-insufficient"}>{remainingBalance === null ? "—" : formatVnd(Math.max(0, remainingBalance))}</strong></div>
        </div>

        {balanceError ? <p className="order-confirmation-warning"><AlertTriangle size={16} /> {balanceError}</p> : null}
        {!hasEnoughBalance ? <p className="order-confirmation-warning"><AlertTriangle size={16} /> Số dư hiện tại không đủ để thanh toán đơn này.</p> : null}

        <p className="order-confirmation-note">Vui lòng kiểm tra kỹ thông tin. Hệ thống sẽ trừ tiền sau khi bạn xác nhận.</p>
        <div className="order-confirmation-actions">
          <button disabled={isSubmitting} onClick={onCancel} type="button">Kiểm tra lại</button>
          <button disabled={isSubmitting || !hasEnoughBalance || balancePending} onClick={onConfirm} type="button">
            {isSubmitting ? "Đang tạo đơn..." : "Xác nhận đặt hàng"}
          </button>
        </div>
      </div>
    </div>
  );
}
