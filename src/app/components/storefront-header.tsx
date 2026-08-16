"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AccountActions } from "@/app/components/account-actions";
import { DepositQrButton } from "@/app/components/deposit-qr-button";
import { ShopBrand } from "@/app/components/shop-brand";
import { SiteSettings } from "@/lib/shop-api";

const fallbackSettings: SiteSettings = {
  shopName: "SHOP GAME",
  logoUrl: "",
  bannerUrl: "",
  footerTitle: "SHOP GAME",
  footerDescription: "",
  footerCopyright: "",
  footerSupportTitle: "",
  footerSupportDescription: "",
  footerPhone: "",
  footerEmail: "",
  footerFacebookUrl: "",
  footerZaloUrl: "",
};

export function StorefrontHeader() {
  const pathname = usePathname();
  const [settings, setSettings] = useState<SiteSettings>(fallbackSettings);
  const isAdminRoute = pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdminRoute) {
      return;
    }

    let ignore = false;

    async function loadSettings() {
      try {
        const response = await fetch("/api/site-settings", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as SiteSettings;
        if (!ignore) {
          setSettings(data);
        }
      } catch {}
    }

    void loadSettings();

    return () => {
      ignore = true;
    };
  }, [isAdminRoute]);

  if (isAdminRoute) {
    return null;
  }

  return (
    <header className="reference-header-wrap storefront-global-header">
      <div className="reference-header">
        <ShopBrand settings={settings} />

        <nav aria-label="Điều hướng chính" className="reference-nav">
          <Link className={pathname === "/" ? "is-active" : ""} href="/">
            <i>⌂</i> Trang chủ
          </Link>
          <Link
            className={pathname === "/lich-su-mua" ? "is-active" : ""}
            href="/lich-su-mua"
          >
            <i>⌁</i> Lịch sử mua
          </Link>
          <Link
            className={pathname === "/thong-bao" ? "is-active" : ""}
            href="/thong-bao"
          >
            <i>◉</i> Thông báo
          </Link>
          <Link href="/#dich-vu">
            <i>▱</i> Dịch vụ khác
          </Link>
          <Link
            className={pathname === "/ho-so" ? "is-active" : ""}
            href="/ho-so"
          >
            <i>●</i> Hồ sơ
          </Link>
          <DepositQrButton />
        </nav>

        <div className="reference-account">
          <button aria-label="Đổi ngôn ngữ" type="button">
            ◎
          </button>
          <AccountActions />
        </div>
      </div>
    </header>
  );
}
