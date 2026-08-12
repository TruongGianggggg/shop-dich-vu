"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Coins, Gem, Server } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useAuthSession } from "@/app/components/use-auth-session";
import { formatIntegerInput, normalizeIntegerInput } from "@/lib/integer-input";
import {
  GameCurrencyOrder,
  GameCurrencyType,
  GameServerCurrencyConfig,
  formatVnd,
  getApiErrorMessage,
} from "@/lib/shop-api";

export function CurrencyTopupForm({
  currencyType,
  configs,
}: {
  currencyType: GameCurrencyType;
  configs: GameServerCurrencyConfig[];
}) {
  const router = useRouter();
  const session = useAuthSession();
  const [selectedConfigId, setSelectedConfigId] = useState(configs[0]?.id ?? "");
  const [paymentAmount, setPaymentAmount] = useState(
    String(currencyPrice(configs[0], currencyType)),
  );
  const [message, setMessage] = useState("");
  const [createdOrder, setCreatedOrder] = useState<GameCurrencyOrder | null>(null);
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
  const returnUrl = isGold ? "/nap-vang" : "/nap-ngoc";

  async function submit(event: FormEvent<HTMLFormElement>) {
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

    const formData = new FormData(event.currentTarget);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/currency-orders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currencyType,
          serverConfigId: selectedConfig.id,
          characterName: String(formData.get("characterName") ?? "").trim(),
          paymentAmount: numericPayment,
        }),
      });
      const data = (await response.json()) as GameCurrencyOrder | unknown;

      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, "Không tạo được đơn nạp."));
      }
      setCreatedOrder(data as GameCurrencyOrder);
    } catch (exception) {
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
    <form className="currency-topup-form" onSubmit={submit}>
      <div className={`currency-topup-heading ${isGold ? "gold" : "gem"}`}>
        <span><Icon size={25} /></span>
        <div>
          <p>NẠP {isGold ? "VÀNG" : "NGỌC"}</p>
          <h1>Thông tin đơn nạp</h1>
        </div>
      </div>

      <div className="currency-topup-fields">
        <label>
          <span>Tên nhân vật</span>
          <input maxLength={120} name="characterName" placeholder="Nhập chính xác tên nhân vật" required />
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
          <small>Mỗi {formatVnd(unitPrice)} nhận {unitAmount.toLocaleString("vi-VN")} {isGold ? "Vàng" : "Ngọc"}</small>
        </label>
        <label>
          <span>Thực nhận</span>
          <output>{receivedAmount.toLocaleString("vi-VN")} {isGold ? "Vàng" : "Ngọc"}</output>
          {!isValidAmount ? <small className="error">Số tiền chưa đạt mức tối thiểu của server.</small> : null}
        </label>
      </div>

      <div className="currency-topup-summary">
        <div><span>Thanh toán từ ví</span><strong>{formatVnd(numericPayment)}</strong></div>
        <div><span>Server nhận</span><strong>{selectedConfig?.name}</strong></div>
      </div>
      {message ? <p className="currency-topup-message error">{message}</p> : null}
      {createdOrder ? (
        <div className="currency-topup-message success" role="status">
          <strong>Tạo đơn thành công</strong>
          <span>Mã đơn: {createdOrder.requestId}</span>
          <span>Thực nhận: {createdOrder.receivedAmount.toLocaleString("vi-VN")} {isGold ? "Vàng" : "Ngọc"}</span>
        </div>
      ) : null}
      <button className="currency-topup-submit" disabled={isSubmitting || !isValidAmount} type="submit">
        {isSubmitting ? "Đang tạo đơn..." : session ? `Nạp ${isGold ? "Vàng" : "Ngọc"}` : "Đăng nhập để tiếp tục"}
      </button>
    </form>
  );
}

function currencyAmount(config: GameServerCurrencyConfig | null | undefined, type: GameCurrencyType) {
  if (!config) return 0;
  return type === "GOLD" ? config.goldAmount : config.gemAmount;
}

function currencyPrice(config: GameServerCurrencyConfig | null | undefined, type: GameCurrencyType) {
  if (!config) return 0;
  return type === "GOLD" ? config.goldPrice : config.gemPrice;
}
