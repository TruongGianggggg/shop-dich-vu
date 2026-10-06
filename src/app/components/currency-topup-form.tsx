"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Coins, Gem, Server } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useAuthSession } from "@/app/components/use-auth-session";
import { OrderConfirmationDialog } from "@/app/components/order-confirmation-dialog";
import { RecentCurrencyOrderHistory } from "@/app/components/recent-order-history";
import { useUserBalance } from "@/app/components/use-user-balance";
import { useAgencySummary } from "@/app/components/use-agency-summary";
import { formatReceivedCurrency, goldSaleTypeLabel } from "@/lib/game-currency";
import { formatIntegerInput, normalizeIntegerInput } from "@/lib/integer-input";
import {
  GameCurrencyOrder,
  GameCurrencyType,
  CurrencyServerCatalogItem,
  agencyRate,
  estimateAgencyCommission,
  formatVnd,
  getApiErrorMessage,
} from "@/lib/shop-api";

export function CurrencyTopupForm({
  currencyType,
  configs,
}: {
  currencyType: GameCurrencyType;
  configs: CurrencyServerCatalogItem[];
}) {
  const router = useRouter();
  const session = useAuthSession();
  const agency = useAgencySummary();
  const { error: balanceError, isLoading: isBalanceLoading, refresh: refreshBalance, wallet } = useUserBalance();
  const [selectedConfigId, setSelectedConfigId] = useState(configs[0]?.id ?? "");
  const [characterName, setCharacterName] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(
    String(currencyPrice(configs[0], currencyType)),
  );
  const [message, setMessage] = useState("");
  const [createdOrder, setCreatedOrder] = useState<GameCurrencyOrder | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedConfig = useMemo(
    () => configs.find((item) => item.id === selectedConfigId) ?? null,
    [configs, selectedConfigId],
  );
  const unitPrice = currencyPrice(selectedConfig, currencyType);
  const unitAmount = currencyAmount(selectedConfig, currencyType);
  const numericPayment = Number(paymentAmount) || 0;
  const isValidAmount = unitPrice > 0 && numericPayment >= unitPrice;
  const receivedAmount = isValidAmount
    ? Math.floor((numericPayment * unitAmount) / unitPrice)
    : 0;
  const isGold = currencyType === "GOLD";
  const goldSaleType = selectedConfig?.goldSaleType ?? "BAR";
  const currencyLabel = isGold ? goldSaleTypeLabel(goldSaleType) : "Ngọc";
  const returnUrl = isGold ? "/nap-vang" : "/nap-ngoc";
  const commissionRate = agencyRate(agency.summary, "CURRENCY");
  const estimatedCommission = estimateAgencyCommission(agency.summary, "CURRENCY", numericPayment);
  const estimatedNetCost = Math.max(0, numericPayment - estimatedCommission);
  const agencyLevel = agency.summary?.level ?? 0;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setCreatedOrder(null);

    if (!session) {
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    if (!selectedConfig || !isValidAmount) {
      setMessage(`Số tiền tối thiểu là ${formatVnd(unitPrice)}.`);
      return;
    }

    if (!characterName.trim()) {
      setMessage("Vui lòng nhập tên nhân vật.");
      return;
    }
    setConfirmationOpen(true);
    refreshBalance();
  }

  async function confirmOrder() {
    if (!selectedConfig || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(selectedConfig.source === "COLLABORATOR" ? "/api/collaborator-currency-orders" : "/api/currency-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currencyType,
          serverConfigId: selectedConfig.id,
          characterName: characterName.trim(),
          paymentAmount: numericPayment,
        }),
      });
      const data = (await response.json()) as GameCurrencyOrder | unknown;

      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, "Không tạo được đơn nạp."));
      }
      setCreatedOrder(data as GameCurrencyOrder);
      setConfirmationOpen(false);
      setHistoryRefreshKey((current) => current + 1);
      refreshBalance();
    } catch (exception) {
      setConfirmationOpen(false);
      setMessage(
        exception instanceof Error ? exception.message : "Không tạo được đơn nạp.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!configs.length) {
    return (
      <div className="currency-shop-empty">
        <Server size={30} />
        <strong>Chưa có server đang mở bán</strong>
        <p>Quản trị viên chưa cấu hình {isGold ? "Vàng" : "Ngọc"} cho server nào.</p>
        <Link href="/">Quay lại trang chủ</Link>
      </div>
    );
  }

  const Icon = isGold ? Coins : Gem;
  return (
    <>
    <form className="currency-topup-form" onSubmit={submit}>
      <div className={`currency-topup-heading ${isGold ? "gold" : "gem"}`}>
        <span><Icon size={25} /></span>
        <div>
          <p>NẠP {currencyLabel.toUpperCase()}</p>
          <h1>Thông tin đơn nạp</h1>
        </div>
      </div>

      <div className="currency-topup-fields">
        <label>
          <span>Tên nhân vật</span>
          <input
            maxLength={120}
            name="characterName"
            onChange={(event) => setCharacterName(event.target.value)}
            placeholder="Nhập chính xác tên nhân vật"
            required
            value={characterName}
          />
        </label>
        <label>
          <span>Server</span>
          <select
            onChange={(event) => {
              const config = configs.find((item) => item.id === event.target.value);
              setSelectedConfigId(event.target.value);
              setPaymentAmount(String(currencyPrice(config, currencyType)));
            }}
            value={selectedConfigId}
          >
            {configs.map((config) => <option key={config.id} value={config.id}>{config.name}</option>)}
          </select>
        </label>
        <label>
          <span>Nhập giá tiền</span>
          <input
            inputMode="numeric"
            onChange={(event) => setPaymentAmount(normalizeIntegerInput(event.target.value))}
            required
            type="text"
            value={formatIntegerInput(paymentAmount)}
          />
          <small>Mỗi {formatVnd(unitPrice)} nhận {formatReceivedCurrency(unitAmount, currencyType, goldSaleType)}</small>
        </label>
        <label>
          <span>Thực nhận</span>
          <output>{formatReceivedCurrency(receivedAmount, currencyType, goldSaleType)}</output>
          {!isValidAmount ? <small className="error">Số tiền chưa đạt mức tối thiểu của server.</small> : null}
        </label>
      </div>

      <div className="currency-topup-summary">
        <div><span>Thanh toán từ ví</span><strong>{formatVnd(numericPayment)}</strong></div>
        <div><span>Server nhận</span><strong>{selectedConfig?.name}</strong></div>
        <div className="currency-agency-refund">
          <span>Hoàn hoa hồng dự kiến</span>
          <strong>+{formatVnd(estimatedCommission)}</strong>
          <small>Đại lý cấp {agencyLevel} · {commissionRate / 100}% · chi phí sau hoàn {formatVnd(estimatedNetCost)}</small>
        </div>
      </div>
      {message ? <p className="currency-topup-message error">{message}</p> : null}
      {createdOrder ? (
        <div className="currency-topup-message success" role="status">
          <strong>Tạo đơn thành công</strong>
          <span>Mã đơn: {createdOrder.requestId}</span>
          <span>Thực nhận: {formatReceivedCurrency(createdOrder.receivedAmount, currencyType, createdOrder.goldSaleType)}</span>
        </div>
      ) : null}
      <button className="currency-topup-submit" disabled={isSubmitting || !isValidAmount} type="submit">
        {isSubmitting ? "Đang tạo đơn..." : session ? `Nạp ${currencyLabel.toLowerCase()}` : "Đăng nhập để tiếp tục"}
      </button>
    </form>
    <RecentCurrencyOrderHistory currencyType={currencyType} refreshKey={historyRefreshKey} />
    <OrderConfirmationDialog
      balance={isBalanceLoading ? null : wallet?.balance ?? null}
      balanceError={balanceError}
      details={[
        { label: "Nhân vật", value: characterName.trim() || "—" },
        { label: "Server", value: selectedConfig?.name ?? "—" },
        { label: "Thực nhận", value: formatReceivedCurrency(receivedAmount, currencyType, goldSaleType) },
        { label: "Hoàn hoa hồng dự kiến", value: `+${formatVnd(estimatedCommission)} · Cấp ${agencyLevel} (${commissionRate / 100}%) · sau hoàn ${formatVnd(estimatedNetCost)}` },
      ]}
      isOpen={confirmationOpen}
      isSubmitting={isSubmitting}
      onCancel={() => setConfirmationOpen(false)}
      onConfirm={confirmOrder}
      orderValue={numericPayment}
      title={`Xác nhận nạp ${currencyLabel}`}
    />
    </>
  );
}

function currencyAmount(config: CurrencyServerCatalogItem | null | undefined, type: GameCurrencyType) {
  if (!config) return 0;
  return type === "GOLD" ? config.goldAmount : config.gemAmount;
}

function currencyPrice(config: CurrencyServerCatalogItem | null | undefined, type: GameCurrencyType) {
  if (!config) return 0;
  return type === "GOLD" ? config.goldPrice : config.gemPrice;
}
