"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BankAccount,
  BankQr,
  getApiErrorMessage,
} from "@/lib/shop-api";
import { useAuthSession } from "./use-auth-session";

export function DepositQrButton() {
  const session = useAuthSession();
  const [isOpen, setIsOpen] = useState(false);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [selectedBankId, setSelectedBankId] = useState("");
  const selectedBankIdRef = useRef("");
  const [qrResult, setQrResult] = useState<BankQr | null>(null);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [isCreatingQr, setIsCreatingQr] = useState(false);
  const [error, setError] = useState("");

  const selectedBank = useMemo(
    () => banks.find((bank) => bank.id === selectedBankId) ?? null,
    [banks, selectedBankId],
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
        const params = new URLSearchParams({
          userId: session.userId,
        });
        const response = await fetch(
          `/api/banks/${encodeURIComponent(bankId)}/qr?${params}`,
        );
        const data = (await readResponseJson(response)) as BankQr | unknown;

        if (!response.ok) {
          throw new Error(getApiErrorMessage(data, "Khong tao duoc QR nap tien."));
        }

        if (!shouldIgnore?.()) {
          setQrResult(data as BankQr);
        }
      } catch (exception) {
        if (!shouldIgnore?.()) {
          setError(
            exception instanceof Error
              ? exception.message
              : "Khong tao duoc QR nap tien.",
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
    if (!isOpen) {
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
          throw new Error(getApiErrorMessage(data, "Khong tai duoc ngan hang."));
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
              : "Khong tai duoc ngan hang.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoadingBanks(false);
        }
      }
    }

    loadBanks();

    return () => {
      ignore = true;
    };
  }, [createQr, isOpen]);

  function openDeposit() {
    if (!session) {
      window.location.href = "/login";
      return;
    }

    setIsOpen(true);
    setQrResult(null);
    setError("");
  }

  function closeDeposit() {
    setIsOpen(false);
    setQrResult(null);
    setError("");
  }

  return (
    <>
      <button className="deposit-nav-button" onClick={openDeposit} type="button">
        Nap tien
      </button>

      {isOpen ? (
        <div className="deposit-modal" role="presentation">
          <button
            aria-label="Dong nap tien"
            className="deposit-modal-backdrop"
            onClick={closeDeposit}
            type="button"
          />
          <section aria-modal="true" className="deposit-modal-panel" role="dialog">
            <div className="deposit-modal-header">
              <div>
                <p className="section-kicker">Nap tien</p>
                <h2>Quet QR chuyen khoan</h2>
              </div>
              <button
                aria-label="Dong"
                className="deposit-modal-close"
                onClick={closeDeposit}
                type="button"
              >
                X
              </button>
            </div>

            <div className="deposit-form">
              <label className="field-label">
                Ngan hang
                <select
                  className="text-field"
                  disabled={isLoadingBanks || banks.length === 0}
                  onChange={(event) => {
                    const bankId = event.target.value;
                    selectedBankIdRef.current = bankId;
                    setSelectedBankId(bankId);
                    setQrResult(null);
                    createQr(bankId);
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
                    alt="QR nap tien"
                    height={220}
                    src={qrResult.qrUrl}
                    unoptimized
                    width={220}
                  />
                  <div>
                    <strong>Nhap so tien tren app ngan hang</strong>
                    <span>{qrResult.transferContent}</span>
                  </div>
                </div>
              ) : null}

              {error ? <p className="deposit-modal-error">{error}</p> : null}
              {!isLoadingBanks && banks.length === 0 ? (
                <p className="deposit-modal-error">Chua co ngan hang dang bat.</p>
              ) : null}

              <div className="deposit-modal-actions">
                <button
                  className="ghost-button h-11 px-5"
                  onClick={closeDeposit}
                  type="button"
                >
                  Dong
                </button>
                <button
                  className="primary-button h-11 px-5"
                  disabled={isCreatingQr || isLoadingBanks || !selectedBankId}
                  onClick={() => createQr(selectedBankId)}
                  type="button"
                >
                  {isCreatingQr ? "Dang tao..." : "Tao lai QR"}
                </button>
              </div>
            </div>
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
