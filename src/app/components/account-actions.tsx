"use client";

import Link from "next/link";
import { useState } from "react";
import { getRoleDestination } from "@/lib/shop-api";
import { clearAuthSession, useAuthSession } from "./use-auth-session";

type AccountMenuItem = {
  href: string;
  label: string;
};

const historyItems: AccountMenuItem[] = [
  { href: "/history/deposits", label: "Lịch sử nạp tiền" },
  { href: "/history/orders", label: "Lịch sử mua vật phẩm" },
  { href: "/cart", label: "Giỏ hàng đã thêm" },
  { href: "/accounts/buy", label: "Mua tài khoản (nick)" },
  { href: "/minigames/history", label: "Minigame đã chơi" },
];

const serviceItems: AccountMenuItem[] = [
  { href: "/orders/boosting", label: "Đơn cày thuê" },
];

export function AccountActions() {
  const session = useAuthSession();
  const [isOpen, setIsOpen] = useState(false);

  function logout() {
    clearAuthSession();
    window.location.href = "/";
  }

  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Link className="nav-link" href="/login">
          Dang nhap
        </Link>
        <Link className="primary-button h-10 px-4 text-sm" href="/register">
          Dang ky
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
          <strong>{session.username}</strong>
          <small>{session.role}</small>
        </span>
        <span className="account-caret">›</span>
      </button>
      {isOpen ? (
        <div className="account-dropdown">
          {session.role === "ADMIN" ? (
            <AccountMenuLink
              href={getRoleDestination("ADMIN")}
              label="Admin Panel"
              onClick={() => setIsOpen(false)}
              prominent
            />
          ) : null}
          {session.role === "ADMIN" || session.role === "COLLABORATOR" ? (
            <AccountMenuLink
              href={getRoleDestination("COLLABORATOR")}
              label="CTV Panel"
              onClick={() => setIsOpen(false)}
              prominent
            />
          ) : null}

          <AccountMenuLink
            href="/account"
            label="Quản lý tài khoản"
            onClick={() => setIsOpen(false)}
            prominent
          />

          <AccountMenuSection items={historyItems} title="Lịch sử" />
          <AccountMenuSection items={serviceItems} title="Dịch vụ" />

          <div className="account-section">
            <p>Khác</p>
            <AccountMenuLink
              href="/inventory/withdraw"
              label="Rút vật phẩm"
              onClick={() => setIsOpen(false)}
            />
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

function AccountMenuSection({
  items,
  title,
}: {
  items: AccountMenuItem[];
  title: string;
}) {
  return (
    <div className="account-section">
      <p>{title}</p>
      {items.map((item) => (
        <AccountMenuLink href={item.href} key={item.href} label={item.label} />
      ))}
    </div>
  );
}

function AccountMenuLink({
  href,
  label,
  onClick,
  prominent = false,
}: AccountMenuItem & {
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
