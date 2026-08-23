"use client";

import Link from "next/link";
import { useState } from "react";
import { formatVnd, getRoleDestination } from "@/lib/shop-api";
import { clearAuthSession, useAuthSession } from "./use-auth-session";
import { useUserBalance } from "./use-user-balance";

export function AccountActions() {
  const session = useAuthSession();
  const { isLoading: isLoadingBalance, wallet } = useUserBalance();
  const [isOpen, setIsOpen] = useState(false);

  function logout() {
    clearAuthSession();
    window.location.href = "/";
  }

  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Link className="nav-link" href="/login">
          Đăng nhập
        </Link>
        <Link className="primary-button h-10 px-4 text-sm" href="/register">
          Đăng ký
        </Link>
      </div>
    );
  }

  return (
    <div className="account-menu-wrap">
      <button
        aria-expanded={isOpen}
        className="account-trigger"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="account-avatar">{session.username.slice(0, 1)}</span>
        <span className="account-trigger-copy">
          <span className="account-trigger-name-row">
            <strong>{session.username}</strong>
            <b>{isLoadingBalance && !wallet ? "..." : formatVnd(wallet?.balance ?? 0)}</b>
          </span>
        </span>
        <span className="account-caret">›</span>
      </button>
      {isOpen ? (
        <div className="account-dropdown">
          <AccountMenuLink
            href="/ho-so"
            label="Hồ sơ tài khoản"
            onClick={() => setIsOpen(false)}
            prominent
          />
          {session.role === "ADMIN" ? (
            <AccountMenuLink
              href={getRoleDestination("ADMIN")}
              label="Admin Panel"
              onClick={() => setIsOpen(false)}
            />
          ) : null}
          <AccountMenuLink
            href="/lich-su-mua"
            label="Lịch sử mua"
            onClick={() => setIsOpen(false)}
          />
          <AccountMenuLink
            href="/lich-su-vang-ngoc"
            label="Lịch sử Thỏi vàng & Ngọc"
            onClick={() => setIsOpen(false)}
          />
          <div className="account-section">
            <p>Khác</p>
            <button className="account-menu-button" onClick={logout}>
              <span>›</span>
              Đăng xuất
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AccountMenuLink({
  href,
  label,
  onClick,
  prominent = false,
}: {
  href: string;
  label: string;
  onClick?: () => void;
  prominent?: boolean;
}) {
  return (
    <Link
      className={prominent ? "account-menu-link is-prominent" : "account-menu-link"}
      href={href}
      onClick={onClick}
    >
      {prominent ? null : <span>›</span>}
      {label}
    </Link>
  );
}
