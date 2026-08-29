"use client";

import { ExternalLink, Link2Off, MessageCircle, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type TelegramStatus = {
  configured: boolean;
  linked: boolean;
  botUsername: string;
  telegramUsername: string | null;
  linkedAt: string | null;
  linkUrl: string | null;
  expiresAt: string | null;
};

export function TelegramLinkCard() {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/telegram", { cache: "no-store" });
      if (!response.ok) throw new Error("Không tải được trạng thái Telegram.");
      setStatus((await response.json()) as TelegramStatus);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không tải được trạng thái Telegram.");
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadStatus(), 0);
    const handleFocus = () => void loadStatus();
    window.addEventListener("focus", handleFocus);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadStatus]);

  async function connect() {
    setIsBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/telegram/link", { method: "POST" });
      const data = (await response.json()) as TelegramStatus & { message?: string };
      if (!response.ok || !data.linkUrl) {
        throw new Error(data.message ?? "Không tạo được đường dẫn liên kết.");
      }
      setStatus(data);
      window.open(data.linkUrl, "_blank", "noopener,noreferrer");
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : "Không liên kết được Telegram.");
    } finally {
      setIsBusy(false);
    }
  }

  async function unlink() {
    if (!window.confirm("Bạn chắc chắn muốn hủy liên kết Telegram?")) return;
    setIsBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/telegram/link", { method: "DELETE" });
      if (!response.ok) throw new Error("Không hủy được liên kết Telegram.");
      await loadStatus();
    } catch (unlinkError) {
      setError(unlinkError instanceof Error ? unlinkError.message : "Không hủy được liên kết Telegram.");
    } finally {
      setIsBusy(false);
    }
  }

  const linkedName = status?.telegramUsername ? `@${status.telegramUsername}` : "Tài khoản Telegram của bạn";

  return (
    <article className="profile-info-card telegram-link-card">
      <div className="profile-card-heading">
        <span className="telegram-heading-icon"><MessageCircle size={21} /></span>
        <div><p>Thông báo cá nhân</p><h2>Telegram</h2></div>
        <span className={`telegram-status-badge ${status?.linked ? "is-linked" : ""}`}>
          {status?.linked ? "Đã liên kết" : "Chưa liên kết"}
        </span>
      </div>

      <p className="telegram-card-copy">
        {status?.linked
          ? `${linkedName} chỉ nhận thông báo thuộc tài khoản NapGem này.`
          : "Liên kết bot để nhận riêng trạng thái đơn hàng, nạp tiền và hoàn tiền của bạn."}
      </p>

      {error ? <p className="telegram-card-error">{error}</p> : null}

      <div className="telegram-card-actions">
        {status?.linked ? (
          <>
            <a href={`https://t.me/${status.botUsername}`} rel="noreferrer" target="_blank">
              <ExternalLink size={17} /> Mở bot
            </a>
            <button disabled={isBusy} onClick={unlink} type="button">
              <Link2Off size={17} /> Hủy liên kết
            </button>
          </>
        ) : (
          <button
            className="telegram-connect-button"
            disabled={isBusy || status?.configured === false}
            onClick={connect}
            type="button"
          >
            <MessageCircle size={17} />
            {isBusy ? "Đang tạo liên kết..." : "Liên kết Telegram"}
          </button>
        )}
        <button className="telegram-refresh-button" disabled={isBusy} onClick={() => void loadStatus()} type="button">
          <RefreshCw size={16} /> Kiểm tra lại
        </button>
      </div>

      {!status?.linked && status?.linkUrl ? (
        <p className="telegram-link-hint">Sau khi bấm Start trong Telegram, quay lại đây và chọn “Kiểm tra lại”.</p>
      ) : null}
    </article>
  );
}
