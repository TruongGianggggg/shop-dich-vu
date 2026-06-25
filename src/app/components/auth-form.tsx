"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  AuthResponse,
  getApiErrorMessage,
  getRoleDestination,
} from "@/lib/shop-api";
import { saveAuthSession } from "./use-auth-session";

type AuthMode = "login" | "register";

type AuthFormProps = {
  mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        !("token" in data)
      ) {
        setMessage(getApiErrorMessage(data, "Khong the xu ly yeu cau."));
        return;
      }

      const authData = data as AuthResponse;

      saveAuthSession(authData);
      router.push(getRoleDestination(authData.role));
      router.refresh();
    } catch {
      setMessage("Khong ket noi duoc backend. Hay kiem tra server Spring Boot.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <form className="auth-panel" onSubmit={submit}>
      <div>
        <p className="section-kicker">Tai khoan</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          {isLogin ? "Dang nhap shop" : "Tao tai khoan moi"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {isLogin
            ? "Dung username hoac email de vao dung khu vuc theo role."
            : "Tai khoan moi se mac dinh la user theo API backend hien tai."}
        </p>
      </div>

      <div className="grid gap-4">
        {isLogin ? (
          <label className="field-label">
            Username hoac email
            <input
              className="text-field"
              name="login"
              placeholder="ten_dang_nhap"
              required
            />
          </label>
        ) : (
          <>
            <label className="field-label">
              Username
              <input
                className="text-field"
                maxLength={32}
                minLength={3}
                name="username"
                placeholder="ten_dang_nhap"
                required
              />
            </label>
            <label className="field-label">
              Email
              <input
                className="text-field"
                name="email"
                placeholder="email@example.com"
                required
                type="email"
              />
            </label>
          </>
        )}

        <label className="field-label">
          Mat khau
          <input
            className="text-field"
            maxLength={72}
            minLength={6}
            name="password"
            placeholder="Nhap mat khau"
            required
            type="password"
          />
        </label>
      </div>

      {message ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {message}
        </p>
      ) : null}

      <button className="primary-button h-12 w-full" disabled={isSubmitting}>
        {isSubmitting ? "Dang xu ly..." : isLogin ? "Dang nhap" : "Dang ky"}
      </button>

      <p className="text-center text-sm text-slate-600">
        {isLogin ? "Chua co tai khoan?" : "Da co tai khoan?"}{" "}
        <Link
          className="font-semibold text-emerald-700"
          href={isLogin ? "/register" : "/login"}
        >
          {isLogin ? "Dang ky" : "Dang nhap"}
        </Link>
      </p>
    </form>
  );
}
