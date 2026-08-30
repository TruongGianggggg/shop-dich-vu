"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { getApiErrorMessage } from "@/lib/shop-api";

type StartResponse = {
  email?: string;
  expiresIn?: number;
  message?: string;
  retryAfterSeconds?: number;
};

export function AdminOtpForm({ next }: { next: string }) {
  const started = useRef(false);
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("email quản trị");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("Đang gửi mã xác minh...");
  const [isSending, setIsSending] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [retryAfter, setRetryAfter] = useState(60);

  const requestCode = useCallback(async () => {
    setError("");
    setIsSending(true);

    try {
      const response = await fetch("/api/admin-access/start", {
        method: "POST",
      });
      const data = (await response.json()) as StartResponse | unknown;
      if (!response.ok) {
        setError(getApiErrorMessage(data, "Không gửi được mã xác minh."));
        setNotice("");
        return;
      }

      const result = data as StartResponse;
      setEmail(result.email || "email quản trị");
      setNotice(result.message || "Mã xác minh đã được gửi.");
      setRetryAfter(result.retryAfterSeconds ?? 60);
    } catch {
      setError("Không kết nối được hệ thống gửi mã.");
      setNotice("");
    } finally {
      setIsSending(false);
    }
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void requestCode();
  }, [requestCode]);

  useEffect(() => {
    if (retryAfter <= 0) return;
    const timer = window.setInterval(
      () => setRetryAfter((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [retryAfter]);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!/^\d{8}$/.test(code)) {
      setError("Vui lòng nhập đúng 8 chữ số.");
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch("/api/admin-access/verify", {
        body: JSON.stringify({ code }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = (await response.json()) as unknown;
      if (!response.ok) {
        setError(getApiErrorMessage(data, "Mã xác minh không hợp lệ."));
        setCode("");
        return;
      }

      window.location.replace(next);
    } catch {
      setError("Không kết nối được hệ thống xác minh.");
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <section className="admin-access-card" aria-labelledby="admin-otp-title">
      <div className="admin-access-icon" aria-hidden="true">8</div>
      <div className="admin-access-heading">
        <p>ADMIN SECURITY</p>
        <h1 id="admin-otp-title">Xác minh truy cập</h1>
        <span>
          Nhập mã bảo mật 8 số đã gửi tới <strong>{email}</strong>.
        </span>
      </div>

      <form onSubmit={verify}>
        <label htmlFor="admin-otp">Mã xác minh</label>
        <input
          autoComplete="one-time-code"
          autoFocus
          disabled={isSending || isVerifying}
          id="admin-otp"
          inputMode="numeric"
          maxLength={8}
          onChange={(event) =>
            setCode(event.target.value.replace(/\D/g, "").slice(0, 8))
          }
          pattern="[0-9]{8}"
          placeholder="••••••••"
          value={code}
        />

        {notice ? <p className="admin-access-notice">{notice}</p> : null}
        {error ? <p className="admin-access-error" role="alert">{error}</p> : null}

        <button disabled={isSending || isVerifying || code.length !== 8}>
          {isVerifying ? "Đang xác minh..." : "Mở Admin Panel"}
        </button>
      </form>

      <div className="admin-access-actions">
        <button
          disabled={isSending || retryAfter > 0}
          onClick={() => void requestCode()}
          type="button"
        >
          {isSending
            ? "Đang gửi..."
            : retryAfter > 0
              ? `Gửi lại sau ${retryAfter}s`
              : "Gửi mã mới"}
        </button>
        <Link href="/">Quay về trang chủ</Link>
      </div>

      <p className="admin-access-footnote">
        Mã hết hạn sau 3 phút. Nhập sai 3 lần sẽ khóa tài khoản.
      </p>
    </section>
  );
}
