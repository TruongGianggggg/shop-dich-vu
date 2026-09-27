"use client";

import { BellRing, ExternalLink, Link2Off, MessageCircle, RefreshCw, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { TelegramNotificationType } from "@/lib/shop-api";

type TelegramStatus = {
  configured: boolean;
  linked: boolean;
  botUsername: string;
  telegramUsername: string | null;
  linkedAt: string | null;
  linkUrl: string | null;
  expiresAt: string | null;
  notificationTypes: TelegramNotificationType[];
};

const notificationOptions: { value: TelegramNotificationType; label: string; description: string }[] = [
  { value: "ORDER_CREATED", label: "Tạo đơn hàng", description: "Xác nhận khi bạn đặt dịch vụ thành công." },
  { value: "ORDER_STATUS", label: "Trạng thái đơn", description: "Đang xử lý, hoàn thành, lỗi và hoàn tiền." },
  { value: "COLLABORATOR_ORDER", label: "Đơn dành cho CTV", description: "Đơn dịch vụ, Vàng hoặc Ngọc được giao cho bạn." },
  { value: "VPS_ORDER", label: "Đơn VPS", description: "Thông báo đơn VPS mới dành cho quản trị viên." },
  { value: "DEPOSIT", label: "Nạp tiền", description: "Kết quả nạp thẻ và cập nhật giao dịch." },
  { value: "LOGIN", label: "Đăng nhập", description: "Cảnh báo mỗi lần tài khoản đăng nhập thành công." },
  { value: "SECURITY_ALERT", label: "Cảnh báo bảo mật", description: "Sai mật khẩu nhiều lần hoặc tài khoản bị khóa." },
];

export function TelegramLinkCard() {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<TelegramNotificationType[]>([]);
  const [savedMessage, setSavedMessage] = useState("");

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/telegram", { cache: "no-store" });
      if (!response.ok) throw new Error("Không tải được trạng thái Telegram.");
      const nextStatus = (await response.json()) as TelegramStatus;
      setStatus(nextStatus);
      setSelectedTypes(nextStatus.notificationTypes ?? notificationOptions.map((option) => option.value));
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
    if (!window.confirm("Hủy liên kết Telegram khỏi tài khoản NapGem này? Các tài khoản NapGem khác dùng chung Telegram vẫn được giữ nguyên.")) return;
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

  async function saveFilters() {
    setIsBusy(true);
    setError(null);
    setSavedMessage("");
    try {
      const response = await fetch("/api/telegram/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationTypes: selectedTypes }),
      });
      const data = (await response.json()) as TelegramStatus & { message?: string };
      if (!response.ok) throw new Error(data.message ?? "Không lưu được bộ lọc.");
      setStatus(data);
      setSelectedTypes(data.notificationTypes);
      setSavedMessage("Đã lưu bộ lọc thông báo Telegram.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Không lưu được bộ lọc.");
    } finally {
      setIsBusy(false);
    }
  }

  function toggleType(type: TelegramNotificationType) {
    setSavedMessage("");
    setSelectedTypes((current) => current.includes(type)
      ? current.filter((value) => value !== type)
      : [...current, type]);
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
          ? `${linkedName} đang nhận thông báo của tài khoản NapGem này. Một Telegram có thể liên kết thêm nhiều tài khoản NapGem khác.`
          : "Liên kết bot để nhận thông báo của tài khoản này. Bạn có thể dùng cùng một Telegram cho nhiều tài khoản NapGem."}
      </p>

      {error ? <p className="telegram-card-error">{error}</p> : null}

      {status?.linked ? (
        <div className="telegram-filter-section">
          <div className="telegram-filter-heading">
            <span><BellRing size={17} /></span>
            <div><strong>Thông báo muốn nhận</strong><small>Chỉ những nhóm được chọn mới gửi tới bot.</small></div>
          </div>
          <div className="telegram-filter-grid">
            {notificationOptions.map((option) => (
              <label key={option.value}>
                <input checked={selectedTypes.includes(option.value)} onChange={() => toggleType(option.value)} type="checkbox" />
                <span><strong>{option.label}</strong><small>{option.description}</small></span>
              </label>
            ))}
          </div>
          <div className="telegram-filter-footer">
            <button disabled={isBusy} onClick={() => void saveFilters()} type="button"><Save size={16} />{isBusy ? "Đang lưu..." : "Lưu bộ lọc"}</button>
            {savedMessage ? <span>{savedMessage}</span> : null}
          </div>
        </div>
      ) : null}

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
