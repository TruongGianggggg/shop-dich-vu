"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BankAccount,
  BankQr,
  CardDepositResponse,
  CardDepositSettings,
  formatVnd,
  getApiErrorMessage,
} from "@/lib/shop-api";
import { useAuthSession } from "./use-auth-session";

type DepositMethod = "bank" | "card";

type DepositQrButtonProps = {
  className?: string;
  initialMethod?: DepositMethod;
  label?: string;
  onOpen?: () => void;
};

export type CardOption = {
  label: string;
  value: string;
  amounts: number[];
};

export const cardOptions: CardOption[] = [
  { label: "Viettel", value: "VIETTEL", amounts: [10000, 20000, 30000, 50000, 100000, 200000, 300000, 500000, 1000000] },
  { label: "Vinaphone", value: "VINAPHONE", amounts: [10000, 20000, 30000, 50000, 100000, 200000, 300000, 500000] },
  { label: "Mobifone", value: "MOBIFONE", amounts: [10000, 20000, 30000, 50000, 100000, 200000, 300000, 500000] },
  { label: "Garena", value: "GARENA", amounts: [5000, 10000, 20000, 50000, 100000, 200000, 500000] },
  { label: "Zing", value: "ZING", amounts: [10000, 20000, 50000, 100000, 200000, 500000, 1000000] },
  { label: "Scoin", value: "SCOIN", amounts: [10000, 20000, 50000, 100000, 200000, 300000, 500000, 1000000, 2000000, 5000000] },
  { label: "Vcoin", value: "VCOIN", amounts: [10000, 20000, 50000, 100000, 200000, 300000, 500000, 1000000, 2000000, 5000000, 10000000] },
];

export function DepositQrButton({
  className = "",
  initialMethod = "bank",
  label = "Nạp tiền",
  onOpen,
}: DepositQrButtonProps = {}) {
  const session = useAuthSession();
  const [isOpen, setIsOpen] = useState(false);
  const [method, setMethod] = useState<DepositMethod>(initialMethod);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [selectedBankId, setSelectedBankId] = useState("");
  const selectedBankIdRef = useRef("");
  const modalPanelRef = useRef<HTMLElement>(null);
  const [qrResult, setQrResult] = useState<BankQr | null>(null);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [isCreatingQr, setIsCreatingQr] = useState(false);
  const [cardTelco, setCardTelco] = useState(cardOptions[0].value);
  const [cardAmount, setCardAmount] = useState(cardOptions[0].amounts[0]);
  const [cardSerial, setCardSerial] = useState("");
  const [cardPin, setCardPin] = useState("");
  const [cardResult, setCardResult] = useState<CardDepositResponse | null>(null);
  const [cardDiscountPercent, setCardDiscountPercent] = useState(0);
  const [isSubmittingCard, setIsSubmittingCard] = useState(false);
  const [error, setError] = useState("");

  const selectedBank = useMemo(
    () => banks.find((bank) => bank.id === selectedBankId) ?? null,
    [banks, selectedBankId],
  );
  const selectedCard = useMemo(
    () => cardOptions.find((card) => card.value === cardTelco) ?? cardOptions[0],
    [cardTelco],
  );

  const createQr = useCallback(
    async (bankId: string, shouldIgnore?: () => boolean) => {
      if (!session || !bankId) {
        return;
      }

      setIsCreatingQr(true);
      setQrResult(null);
      setError("");

      try {
        const params = new URLSearchParams({ userId: session.userId });
        const response = await fetch(
          `/api/banks/${encodeURIComponent(bankId)}/qr?${params}`,
        );
        const data = (await readResponseJson(response)) as BankQr | unknown;

        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Không tạo được QR nạp tiền."));
        }

        if (!shouldIgnore?.()) {
          setQrResult(data as BankQr);
        }
      } catch (exception) {
        if (!shouldIgnore?.()) {
          setError(
            exception instanceof Error
              ? exception.message
              : "Không tạo được QR nạp tiền.",
          );
        }
      } finally {
        if (!shouldIgnore?.()) {
          setIsCreatingQr(false);
        }
      }
    },
    [session],
  );

  useEffect(() => {
    if (!isOpen || method !== "bank") {
      return;
    }

    let ignore = false;

    async function loadBanks() {
      setIsLoadingBanks(true);
      setError("");

      try {
        const response = await fetch("/api/banks?activeOnly=true");
        const data = (await readResponseJson(response)) as BankAccount[] | unknown;

        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Không tải được ngân hàng."));
        }

        if (!ignore) {
          const activeBanks = Array.isArray(data)
            ? data.filter((bank) => bank.active)
            : [];
          const nextBankId = activeBanks.some(
            (bank) => bank.id === selectedBankIdRef.current,
          )
            ? selectedBankIdRef.current
            : activeBanks[0]?.id || "";
          setBanks(activeBanks);
          selectedBankIdRef.current = nextBankId;
          setSelectedBankId(nextBankId);

          if (nextBankId) {
            await createQr(nextBankId, () => ignore);
          }
        }
      } catch (exception) {
        if (!ignore) {
          setBanks([]);
          setError(
            exception instanceof Error
              ? exception.message
              : "Không tải được ngân hàng.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoadingBanks(false);
        }
      }
    }

    void loadBanks();

    return () => {
      ignore = true;
    };
  }, [createQr, isOpen, method]);

  useEffect(() => {
    if (!isOpen || method !== "card") {
      return;
    }

    let ignore = false;

    async function loadCardSettings() {
      try {
        const response = await fetch("/api/deposits/cards/settings");
        const data = (await readResponseJson(response)) as CardDepositSettings | unknown;
        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Không tải được chiết khấu thẻ."));
        }
        if (!ignore) {
          const percent = Number((data as CardDepositSettings).discountPercent);
          setCardDiscountPercent(Number.isInteger(percent) ? Math.min(99, Math.max(0, percent)) : 0);
        }
      } catch (exception) {
        if (!ignore) {
          setError(exception instanceof Error ? exception.message : "Không tải được chiết khấu thẻ.");
        }
      }
    }

    void loadCardSettings();
    return () => {
      ignore = true;
    };
  }, [isOpen, method]);

  useEffect(() => {
    if (!isOpen) return;

    const frame = window.requestAnimationFrame(() => {
      modalPanelRef.current?.scrollTo({ top: 0 });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isOpen, method, qrResult]);

  function openDeposit() {
    if (!session) {
      window.location.href = "/login";
      return;
    }

    onOpen?.();
    setMethod(initialMethod);
    setIsOpen(true);
    setError("");
  }

  function closeDeposit() {
    setIsOpen(false);
    setQrResult(null);
    setCardResult(null);
    setError("");
  }

  function selectMethod(nextMethod: DepositMethod) {
    setMethod(nextMethod);
    setError("");
    setCardResult(null);
  }

  async function submitCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      return;
    }

    setIsSubmittingCard(true);
    setCardResult(null);
    setError("");

    try {
      const response = await fetch("/api/deposits/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.userId,
          telco: cardTelco,
          amount: cardAmount,
          serial: cardSerial.trim(),
          pin: cardPin.trim(),
        }),
      });
      const data = await readResponseJson(response);

      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, "Không gửi được card."));
      }

      setCardResult(data as CardDepositResponse);
      setCardPin("");
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Không gửi được card.",
      );
    } finally {
      setIsSubmittingCard(false);
    }
  }

  return (
    <>
      <button className={`deposit-nav-button ${className}`.trim()} onClick={openDeposit} type="button">
        {label}
      </button>

      {isOpen ? (
        <div className="deposit-modal" role="presentation">
          <button
            aria-label="Đóng nạp tiền"
            className="deposit-modal-backdrop"
            onClick={closeDeposit}
            type="button"
          />
          <section
            aria-modal="true"
            className="deposit-modal-panel"
            ref={modalPanelRef}
            role="dialog"
          >
            <div className="deposit-modal-header">
              <div>
                <p className="section-kicker">Nạp tiền</p>
                <h2>Chọn phương thức nạp</h2>
              </div>
              <button
                aria-label="Đóng"
                className="deposit-modal-close"
                onClick={closeDeposit}
                type="button"
              >
                X
              </button>
            </div>

            <div aria-label="Phương thức nạp tiền" className="deposit-method-tabs" role="tablist">
              <button
                aria-selected={method === "bank"}
                className={method === "bank" ? "is-active" : ""}
                onClick={() => selectMethod("bank")}
                role="tab"
                type="button"
              >
                Chuyển khoản QR
              </button>
              <button
                aria-selected={method === "card"}
                className={method === "card" ? "is-active" : ""}
                onClick={() => selectMethod("card")}
                role="tab"
                type="button"
              >
                Nạp card
              </button>
            </div>

            {method === "bank" ? (
              <div className="deposit-form">
                <label className="field-label">
                  Ngân hàng
                  <select
                    className="text-field"
                    disabled={isLoadingBanks || banks.length === 0}
                    onChange={(event) => {
                      const bankId = event.target.value;
                      selectedBankIdRef.current = bankId;
                      setSelectedBankId(bankId);
                      setQrResult(null);
                      void createQr(bankId);
                    }}
                    required
                    value={selectedBankId}
                  >
                    {banks.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.shortName} - {bank.accountNumber}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedBank ? (
                  <div className="deposit-bank-summary">
                    <strong>{selectedBank.accountName}</strong>
                    <span>
                      {selectedBank.shortName} - {selectedBank.accountNumber}
                    </span>
                  </div>
                ) : null}

                {qrResult ? (
                  <div className="deposit-qr-result">
                    <Image
                      alt="QR nạp tiền"
                      height={220}
                      src={qrResult.qrUrl}
                      unoptimized
                      width={220}
                    />
                    <div>
                      <strong>Nhập số tiền trên ứng dụng ngân hàng</strong>
                      <span>{qrResult.transferContent}</span>
                    </div>
                  </div>
                ) : null}

                {error ? <p className="deposit-modal-error">{error}</p> : null}
                {!isLoadingBanks && banks.length === 0 ? (
                  <p className="deposit-modal-error">Chưa có ngân hàng đang bật.</p>
                ) : null}

                <div className="deposit-modal-actions">
                  <button className="ghost-button h-11 px-5" onClick={closeDeposit} type="button">
                    Đóng
                  </button>
                  <button
                    className="primary-button h-11 px-5"
                    disabled={isCreatingQr || isLoadingBanks || !selectedBankId}
                    onClick={() => void createQr(selectedBankId)}
                    type="button"
                  >
                    {isCreatingQr ? "Đang tạo..." : "Tạo lại QR"}
                  </button>
                </div>
              </div>
            ) : (
              <form className="deposit-form deposit-card-form" onSubmit={submitCard}>
                <div className="deposit-card-grid">
                  <label className="field-label">
                    Nhà mạng
                    <select
                      className="text-field"
                      onChange={(event) => {
                        const nextCard = cardOptions.find((card) => card.value === event.target.value) ?? cardOptions[0];
                        setCardTelco(nextCard.value);
                        setCardAmount(nextCard.amounts[0]);
                        setCardResult(null);
                      }}
                      value={cardTelco}
                    >
                      {cardOptions.map((card) => (
                        <option key={card.value} value={card.value}>{card.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field-label">
                    Mệnh giá
                    <select
                      className="text-field"
                      onChange={(event) => setCardAmount(Number(event.target.value))}
                      value={cardAmount}
                    >
                      {selectedCard.amounts.map((amount) => (
                        <option key={amount} value={amount}>{formatVnd(amount)}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="field-label">
                  Số serial
                  <input
                    autoComplete="off"
                    className="text-field"
                    inputMode="numeric"
                    maxLength={32}
                    minLength={8}
                    onChange={(event) => setCardSerial(cleanCardValue(event.target.value))}
                    placeholder="Nhập số serial trên thẻ"
                    required
                    type="text"
                    value={cardSerial}
                  />
                </label>
                <label className="field-label">
                  Mã thẻ
                  <input
                    autoComplete="off"
                    className="text-field"
                    inputMode="numeric"
                    maxLength={32}
                    minLength={8}
                    onChange={(event) => setCardPin(cleanCardValue(event.target.value))}
                    placeholder="Nhập mã thẻ"
                    required
                    type="text"
                    value={cardPin}
                  />
                </label>

                <p className="deposit-card-note">
                  Chọn đúng nhà mạng và mệnh giá. Card sai mệnh giá có thể bị áp dụng phí phạt.
                </p>

                <div className="deposit-card-result deposit-card-estimate">
                  <strong>Chiết khấu shop: {cardDiscountPercent}%</strong>
                  <span>
                    Mệnh giá {formatVnd(cardAmount)} dự kiến nhận tối đa {formatVnd(Math.floor(cardAmount * (100 - cardDiscountPercent) / 100))}.
                  </span>
                  <span>Số tiền thực nhận không vượt quá số tiền nhà cung cấp thanh toán.</span>
                </div>

                {cardResult ? (
                  <div className="deposit-card-result" role="status">
                    <strong>Đã gửi thẻ thành công</strong>
                    <span>Mã giao dịch: {cardResult.transId}</span>
                    <span>Trạng thái: Đang chờ xử lý</span>
                  </div>
                ) : null}
                {error ? <p className="deposit-modal-error">{error}</p> : null}

                <div className="deposit-modal-actions">
                  <button className="ghost-button h-11 px-5" onClick={closeDeposit} type="button">
                    Đóng
                  </button>
                  <button
                    className="primary-button h-11 px-5"
                    disabled={isSubmittingCard || cardSerial.length < 8 || cardPin.length < 8}
                    type="submit"
                  >
                    {isSubmittingCard ? "Đang gửi..." : "Nạp thẻ"}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}

async function readResponseJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function cleanCardValue(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}
