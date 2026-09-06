"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  getPasswordPolicyError,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/lib/password-policy";
import { getApiErrorMessage } from "@/lib/shop-api";
import { TurnstileWidget } from "./turnstile-widget";

const TURNSTILE_SITE_KEY = "0x4AAAAAAEhecQe6XQz_6kOV";

type ResetStep = "request" | "reset" | "success";

export function ForgotPasswordForm({ closeHref = "/", returnUrl }: { closeHref?: string; returnUrl?: string }) {
  const [step, setStep] = useState<ResetStep>("request");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const loginHref = `/login${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ""}`;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData(event.currentTarget);
    if (!turnstileToken) {
      setMessage("Vui lòng xác nhận bạn không phải người máy.");
      return;
    }

    const nextEmail = String(formData.get("email") ?? email).trim();
    const isReset = step === "reset";
    const newPassword = String(formData.get("newPassword") ?? "");
    if (isReset) {
      const passwordError = getPasswordPolicyError(newPassword);
      if (passwordError) {
        setMessage(passwordError);
        return;
      }
      if (newPassword !== String(formData.get("confirmPassword") ?? "")) {
        setMessage("Mật khẩu xác nhận không khớp.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/auth/${isReset ? "reset-password" : "forgot-password"}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Turnstile-Token": turnstileToken,
        },
        body: JSON.stringify(isReset
          ? { email: nextEmail, code: String(formData.get("code") ?? "").trim(), newPassword }
          : { email: nextEmail }),
      });
      const data = (await response.json()) as unknown;
      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, isReset
          ? "Mã xác nhận không đúng hoặc đã hết hạn."
          : "Không gửi được mã xác nhận."));
      }

      if (isReset) {
        setStep("success");
      } else {
        setEmail(nextEmail);
        setStep("reset");
        setMessage("Nếu email tồn tại, mã xác nhận 6 số đã được gửi và có hiệu lực trong 5 phút.");
        setTurnstileResetKey((value) => value + 1);
      }
    } catch (exception) {
      setMessage(exception instanceof Error ? exception.message : "Không kết nối được hệ thống.");
      setTurnstileResetKey((value) => value + 1);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (step === "success") {
    return (
      <section className="login-popup">
        <Link className="login-popup-close" href={closeHref}>Đóng</Link>
        <div className="forgot-password-success">
          <span><CheckCircle2 size={30} /></span>
          <strong>Đặt lại mật khẩu thành công</strong>
          <p>Bạn có thể đăng nhập ngay bằng mật khẩu mới.</p>
          <Link href={loginHref}>Quay lại đăng nhập</Link>
        </div>
      </section>
    );
  }

  return (
    <form className="login-popup" onSubmit={submit}>
      <Link className="login-popup-close" href={closeHref}>Đóng</Link>
      <div className="login-popup-heading">
        <h1>Quên mật khẩu</h1>
        <p>{step === "request" ? "Nhận mã xác nhận qua email" : "Nhập mã và tạo mật khẩu mới"}</p>
      </div>

      <div className="login-popup-fields">
        <label>
          <span>Email tài khoản</span>
          <input
            autoComplete="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Nhập địa chỉ email đã đăng ký"
            readOnly={step === "reset"}
            required
            type="email"
            value={email}
          />
        </label>

        {step === "reset" ? (
          <>
            <label>
              <span>Mã xác nhận</span>
              <input autoComplete="one-time-code" inputMode="numeric" maxLength={6} name="code" pattern="[0-9]{6}" placeholder="Nhập mã gồm 6 số" required />
            </label>
            <label>
              <span>Mật khẩu mới</span>
              <input autoComplete="new-password" maxLength={PASSWORD_MAX_LENGTH} minLength={PASSWORD_MIN_LENGTH} name="newPassword" placeholder="Tạo mật khẩu mới" required type="password" />
            </label>
            <label>
              <span>Xác nhận mật khẩu</span>
              <input autoComplete="new-password" maxLength={PASSWORD_MAX_LENGTH} minLength={PASSWORD_MIN_LENGTH} name="confirmPassword" placeholder="Nhập lại mật khẩu mới" required type="password" />
            </label>
            <p className="forgot-password-note">Mật khẩu cần ít nhất 10 ký tự, có chữ hoa và ký tự đặc biệt.</p>
          </>
        ) : null}

        <TurnstileWidget
          action={step === "request" ? "forgot_password" : "reset_password"}
          key={step}
          onTokenChange={setTurnstileToken}
          resetKey={turnstileResetKey}
          siteKey={TURNSTILE_SITE_KEY}
        />
      </div>

      {message ? <p className={step === "reset" ? "forgot-password-note" : "login-popup-error"} role="status">{message}</p> : null}

      <button className="login-popup-submit" disabled={isSubmitting}>
        {isSubmitting ? "Đang xử lý..." : step === "request" ? "Gửi mã xác nhận" : "Đặt lại mật khẩu"}
      </button>

      <div className="login-popup-register">
        <span>Đã nhớ mật khẩu?</span>
        <Link href={loginHref}>Quay lại đăng nhập</Link>
      </div>
    </form>
  );
}
