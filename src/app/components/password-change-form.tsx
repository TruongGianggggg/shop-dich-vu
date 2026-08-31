"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getApiErrorMessage,
  getRoleDestination,
} from "@/lib/shop-api";
import {
  getPasswordPolicyError,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/lib/password-policy";
import {
  clearAuthSession,
  useAuthSession,
  verifyAuthSession,
} from "./use-auth-session";

type CodeResponse = {
  email?: string;
  expiresInSeconds?: number;
};

export function PasswordChangeForm() {
  const router = useRouter();
  const session = useAuthSession();
  const [codeSent, setCodeSent] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function sendCode() {
    setError("");
    setMessage("");
    setIsSending(true);
    try {
      const response = await fetch("/api/auth/password-change/code", {
        method: "POST",
      });
      const data = (await response.json()) as CodeResponse | unknown;
      if (!response.ok) {
        setError(getApiErrorMessage(data, "Không gửi được mã xác nhận."));
        return;
      }
      const codeData = data as CodeResponse;
      setMaskedEmail(codeData.email ?? session?.email ?? "email của bạn");
      setCodeSent(true);
      setMessage("Mã xác nhận 6 số đã được gửi và có hiệu lực trong 5 phút.");
    } catch {
      setError("Không kết nối được hệ thống gửi mã.");
    } finally {
      setIsSending(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const code = String(formData.get("code") ?? "").trim();
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!/^\d{6}$/.test(code)) {
      setError("Mã xác nhận phải gồm đúng 6 chữ số.");
      return;
    }
    const passwordError = getPasswordPolicyError(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/auth/password-change/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, newPassword }),
      });
      const data = (await response.json()) as unknown;
      if (!response.ok) {
        setError(getApiErrorMessage(data, "Không đổi được mật khẩu."));
        return;
      }

      const refreshedSession = await verifyAuthSession();
      if (!refreshedSession || refreshedSession.passwordChangeRequired) {
        setError("Mật khẩu đã đổi nhưng chưa làm mới được phiên đăng nhập.");
        return;
      }
      router.replace(getRoleDestination(refreshedSession.role));
    } catch {
      setError("Không kết nối được hệ thống đổi mật khẩu.");
    } finally {
      setIsSaving(false);
    }
  }

  async function logout() {
    await clearAuthSession();
    router.replace("/login");
  }

  return (
    <section className="password-change-card">
      <p className="section-kicker">Bảo mật tài khoản</p>
      <h1>Đổi mật khẩu để tiếp tục</h1>
      <p className="password-change-intro">
        Tài khoản hiện tại cần cập nhật mật khẩu theo chính sách bảo mật mới.
        Chúng tôi sẽ gửi mã xác nhận 6 số tới email đã đăng ký.
      </p>

      {!codeSent ? (
        <button
          className="primary-button password-change-primary"
          disabled={isSending || !session}
          onClick={sendCode}
          type="button"
        >
          {isSending ? "Đang gửi mã…" : "Gửi mã xác nhận qua email"}
        </button>
      ) : (
        <form className="password-change-form" onSubmit={submit}>
          <p className="password-change-email">Mã đã gửi tới {maskedEmail}.</p>
          <label>
            <span>Mã xác nhận</span>
            <input
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              name="code"
              pattern="[0-9]{6}"
              placeholder="Nhập 6 chữ số"
              required
            />
          </label>
          <label>
            <span>Mật khẩu mới</span>
            <input
              autoComplete="new-password"
              maxLength={PASSWORD_MAX_LENGTH}
              minLength={PASSWORD_MIN_LENGTH}
              name="newPassword"
              placeholder="Ít nhất 10 ký tự"
              required
              type="password"
            />
          </label>
          <p className="password-change-policy">
            Phải có ít nhất 10 ký tự, một chữ hoa và một ký tự đặc biệt.
          </p>
          <label>
            <span>Nhập lại mật khẩu mới</span>
            <input
              autoComplete="new-password"
              maxLength={PASSWORD_MAX_LENGTH}
              minLength={PASSWORD_MIN_LENGTH}
              name="confirmPassword"
              required
              type="password"
            />
          </label>
          <button
            className="primary-button password-change-primary"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? "Đang đổi mật khẩu…" : "Xác nhận đổi mật khẩu"}
          </button>
          <button
            className="password-change-resend"
            disabled={isSending}
            onClick={sendCode}
            type="button"
          >
            Gửi lại mã
          </button>
        </form>
      )}

      {message ? <p className="password-change-success">{message}</p> : null}
      {error ? <p className="password-change-error" role="alert">{error}</p> : null}
      <button className="password-change-logout" onClick={logout} type="button">
        Đăng xuất
      </button>
    </section>
  );
}
