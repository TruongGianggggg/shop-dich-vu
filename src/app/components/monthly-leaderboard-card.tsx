"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CreditCard, Trophy } from "lucide-react";
import { cardOptions, DepositQrButton } from "@/app/components/deposit-qr-button";
import { useAuthSession } from "@/app/components/use-auth-session";
import {
  CardDepositResponse,
  CardDepositSettings,
  formatVnd,
  getApiErrorMessage,
  MonthlyDepositLeaderboard,
} from "@/lib/shop-api";

type LeaderboardView = "ranking" | "card";

export function MonthlyLeaderboardCard({
  leaderboard,
}: {
  leaderboard: MonthlyDepositLeaderboard | null;
}) {
  const session = useAuthSession();
  const [view, setView] = useState<LeaderboardView>("ranking");
  const [telco, setTelco] = useState(cardOptions[0].value);
  const [amount, setAmount] = useState(cardOptions[0].amounts[0]);
  const [serial, setSerial] = useState("");
  const [pin, setPin] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CardDepositResponse | null>(null);

  const selectedCard = useMemo(
    () => cardOptions.find((card) => card.value === telco) ?? cardOptions[0],
    [telco],
  );

  useEffect(() => {
    if (view !== "card") return;

    let ignore = false;
    async function loadSettings() {
      try {
        const response = await fetch("/api/deposits/cards/settings");
        const data = (await readResponseJson(response)) as CardDepositSettings | unknown;
        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Không tải được chiết khấu thẻ."));
        }
        if (!ignore) {
          const percent = Number((data as CardDepositSettings).discountPercent);
          setDiscountPercent(Number.isInteger(percent) ? Math.min(99, Math.max(0, percent)) : 0);
        }
      } catch (exception) {
        if (!ignore) {
          setError(exception instanceof Error ? exception.message : "Không tải được chiết khấu thẻ.");
        }
      }
    }

    void loadSettings();
    return () => {
      ignore = true;
    };
  }, [view]);

  async function submitCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      window.location.href = "/login";
      return;
    }

    setIsSubmitting(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/deposits/cards", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.userId,
          telco,
          amount,
          serial: serial.trim(),
          pin: pin.trim(),
        }),
      });
      const data = await readResponseJson(response);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, "Không gửi được card."));
      }

      setResult(data as CardDepositResponse);
      setPin("");
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Không gửi được card.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const month = String(leaderboard?.month ?? new Date().getMonth() + 1).padStart(2, "0");
  const year = leaderboard?.year ?? new Date().getFullYear();

  return (
    <div className="monthly-leaderboard">
      <div className="monthly-leaderboard-tabs" role="tablist" aria-label="Bảng nạp tiền">
        <button
          aria-selected={view === "ranking"}
          className={`monthly-leaderboard-tab ${view === "ranking" ? "is-active" : ""}`}
          onClick={() => setView("ranking")}
          role="tab"
          type="button"
        >
          <Trophy aria-hidden="true" size={18} />
          <strong>TOP NẠP {month}/{year}</strong>
        </button>
        <button
          aria-selected={view === "card"}
          className={`monthly-leaderboard-tab ${view === "card" ? "is-active" : ""}`}
          onClick={() => {
            setView("card");
            setError("");
          }}
          role="tab"
          type="button"
        >
          <CreditCard aria-hidden="true" size={18} />
          <strong>NẠP THẺ</strong>
        </button>
      </div>

      {view === "ranking" ? (
        <div className="monthly-leaderboard-list" role="tabpanel">
          {leaderboard?.entries.length ? (
            leaderboard.entries.map((entry) => (
              <div className="monthly-leaderboard-row" key={`${entry.rank}-${entry.maskedUsername}`}>
                <span className={`rank rank-${entry.rank}`}>
                  {entry.rank <= 3 ? <span aria-label={`Hạng ${entry.rank}`} role="img">{["🥇", "🥈", "🥉"][entry.rank - 1]}</span> : entry.rank}
                </span>
                <strong>{entry.maskedUsername}</strong>
                <b>+{formatVnd(entry.totalAmount)}</b>
              </div>
            ))
          ) : (
            <p>Chưa có giao dịch nạp thành công trong tháng này.</p>
          )}
        </div>
      ) : (
        <form
          className="leaderboard-card-form"
          id="leaderboard-card-deposit-form"
          onSubmit={submitCard}
          role="tabpanel"
        >
          <div className="leaderboard-card-form-grid">
            <label>
              Nhà mạng
              <select
                onChange={(event) => {
                  const nextCard = cardOptions.find((card) => card.value === event.target.value) ?? cardOptions[0];
                  setTelco(nextCard.value);
                  setAmount(nextCard.amounts[0]);
                  setResult(null);
                }}
                value={telco}
              >
                {cardOptions.map((card) => <option key={card.value} value={card.value}>{card.label}</option>)}
              </select>
            </label>
            <label>
              Mệnh giá
              <select onChange={(event) => setAmount(Number(event.target.value))} value={amount}>
                {selectedCard.amounts.map((cardAmount) => (
                  <option key={cardAmount} value={cardAmount}>{formatVnd(cardAmount)}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Serial
            <input
              autoComplete="off"
              inputMode="numeric"
              maxLength={32}
              minLength={8}
              onChange={(event) => setSerial(cleanCardValue(event.target.value))}
              placeholder="Nhập số serial"
              required
              value={serial}
            />
          </label>
          <label>
            Mã thẻ
            <input
              autoComplete="off"
              inputMode="numeric"
              maxLength={32}
              minLength={8}
              onChange={(event) => setPin(cleanCardValue(event.target.value))}
              placeholder="Nhập mã thẻ"
              required
              value={pin}
            />
          </label>
          <p className="leaderboard-card-estimate">
            Chiết khấu {discountPercent}% · Dự kiến nhận {formatVnd(Math.floor(amount * (100 - discountPercent) / 100))}
          </p>
          {result ? <p className="leaderboard-card-success">Đã gửi thẻ · {result.transId}</p> : null}
          {error ? <p className="leaderboard-card-error">{error}</p> : null}
        </form>
      )}

      <div className="monthly-leaderboard-action">
        {view === "card" ? (
          <button
            className="leaderboard-deposit-button"
            disabled={isSubmitting || serial.length < 8 || pin.length < 8}
            form="leaderboard-card-deposit-form"
            type="submit"
          >
            {isSubmitting ? "ĐANG XÁC NHẬN..." : "XÁC NHẬN"}
          </button>
        ) : (
          <DepositQrButton className="leaderboard-deposit-button" label="👉 NẠP TIỀN NGAY 👈" />
        )}
      </div>
    </div>
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
