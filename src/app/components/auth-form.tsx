"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  AuthResponse,
  getApiErrorMessage,
  getRoleDestination,
} from "@/lib/shop-api";
import { saveAuthSession, verifyAuthSession } from "./use-auth-session";

type AuthMode = "login" | "register";

type AuthFormProps = {
  closeHref?: string;
  mode: AuthMode;
  returnUrl?: string;
};

type ToastState = {
  message: string;
  type: "success" | "error";
};

export function AuthForm({ closeHref = "/", mode, returnUrl }: AuthFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLogin = mode === "login";

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function showToast(nextToast: ToastState) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(nextToast);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload =
      mode === "login"
        ? {
            login: String(formData.get("login") ?? ""),
            password: String(formData.get("password") ?? ""),
          }
        : {
            username: String(formData.get("username") ?? ""),
            email: String(formData.get("email") ?? ""),
            password: String(formData.get("password") ?? ""),
          };

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as AuthResponse | unknown;

      if (
        !response.ok ||
        !data ||
        typeof data !== "object" ||
        !("userId" in data) ||
        !("role" in data)
      ) {
        const errorMessage =
          isLogin && response.status === 401
            ? "Tài khoản hoặc mật khẩu không chính xác."
            : getApiErrorMessage(
                data,
                "Không thể xử lý yêu cầu đăng nhập.",
              );
        if (isLogin) {
          if (response.status === 423) {
            setMessage(errorMessage);
          } else {
            showToast({ message: errorMessage, type: "error" });
          }
        } else setMessage(errorMessage);
        return;
      }

      const authData = data as AuthResponse;

      saveAuthSession(authData);
      const verifiedSession = await verifyAuthSession();
      if (!verifiedSession) {
        const verificationError =
          "Đăng nhập thành công nhưng không tạo được phiên đăng nhập. Vui lòng thử lại.";
        if (isLogin) {
          showToast({ message: verificationError, type: "error" });
        } else {
          setMessage(verificationError);
        }
        return;
      }

      if (isLogin) {
        showToast({ message: "Đăng nhập thành công.", type: "success" });
        await new Promise((resolve) => setTimeout(resolve, 850));
      }
      router.replace(
        verifiedSession.role === "USER" && returnUrl
          ? returnUrl
          : getRoleDestination(verifiedSession.role),
      );
    } catch {
      const errorMessage =
        "Không kết nối được hệ thống. Vui lòng thử lại sau.";
      if (isLogin) showToast({ message: errorMessage, type: "error" });
      else setMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  const authSwitchHref = `${isLogin ? "/register" : "/login"}${
    returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ""
  }`;

  return (
    <>
      {toast ? (
        <div className={`login-slide-toast is-${toast.type}`} role="status">
          {toast.message}
        </div>
      ) : null}
      <form className="login-popup" onSubmit={submit}>
        <Link className="login-popup-close" href={closeHref}>
          Đóng
        </Link>
        <div className="login-popup-heading">
          <h1>{isLogin ? "Đăng nhập" : "Đăng ký"}</h1>
          <p>
            {isLogin
              ? "Vui lòng đăng nhập để tiếp tục"
              : "Tạo tài khoản để sử dụng dịch vụ"}
          </p>
        </div>

        <div className="login-popup-fields">
          {isLogin ? (
            <label>
              <span>Tài khoản</span>
              <input
                autoComplete="username"
                name="login"
                placeholder="Nhập tên tài khoản hoặc email"
                required
              />
            </label>
          ) : (
            <>
              <label>
                <span>Tên tài khoản</span>
                <input
                  autoComplete="username"
                  maxLength={32}
                  minLength={3}
                  name="username"
                  placeholder="Nhập tên tài khoản"
                  required
                />
              </label>
              <label>
                <span>Email</span>
                <input
                  autoComplete="email"
                  name="email"
                  placeholder="Nhập địa chỉ email"
                  required
                  type="email"
                />
              </label>
          </>
        )}

        <label>
          <span>Mật khẩu</span>
          <input
            autoComplete={isLogin ? "current-password" : "new-password"}
            maxLength={72}
            minLength={6}
            name="password"
            placeholder={
              isLogin ? "Nhập mật khẩu của bạn" : "Tạo mật khẩu từ 6 ký tự"
            }
            required
            type="password"
          />
        </label>
      </div>

      {message ? (
        <p className="login-popup-error" role="alert">
          {message}
        </p>
      ) : null}

      <button className="login-popup-submit" disabled={isSubmitting}>
        {isSubmitting
          ? isLogin
            ? "Đang đăng nhập..."
            : "Đang đăng ký..."
          : isLogin
            ? "Đăng nhập"
            : "Đăng ký"}
      </button>

      <div className="login-popup-register">
        <span>{isLogin ? "Bạn chưa có tài khoản?" : "Bạn đã có tài khoản?"}</span>
        <Link href={authSwitchHref}>
          {isLogin ? "Đăng ký ngay" : "Đăng nhập ngay"}
        </Link>
      </div>
      </form>
    </>
  );
}
