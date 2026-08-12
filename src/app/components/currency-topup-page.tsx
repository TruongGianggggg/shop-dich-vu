import Link from "next/link";
import { Coins, Gem } from "lucide-react";
import { AccountActions } from "@/app/components/account-actions";
import { CurrencyTopupForm } from "@/app/components/currency-topup-form";
import { ShopBrand } from "@/app/components/shop-brand";
import { fetchBackendJson } from "@/lib/backend";
import { GameCurrencyDisplaySettings, GameCurrencyType, GameServerCurrencyConfig } from "@/lib/shop-api";
import { getPublicSiteSettings } from "@/lib/site-settings";

export async function CurrencyTopupPage({ currencyType }: { currencyType: GameCurrencyType }) {
  const [settings, configs, currencySettings] = await Promise.all([
    getPublicSiteSettings(),
    getConfigs(currencyType),
    getCurrencySettings(),
  ]);
  const isGold = currencyType === "GOLD";
  const description = isGold ? currencySettings.goldDescription : currencySettings.gemDescription;
  const Icon = isGold ? Coins : Gem;

  return (
    <div className="currency-shop-page">
      <header className="service-detail-header">
        <ShopBrand settings={settings} />
        <nav><Link href="/">Trang chủ</Link><Link href="/lich-su-vang-ngoc">Lịch sử Vàng & Ngọc</Link></nav>
        <AccountActions />
      </header>
      <main className="currency-shop-main">
        <div className="currency-shop-breadcrumb"><Link href="/">Trang chủ</Link><span>/</span><b>Nạp {isGold ? "Vàng" : "Ngọc"}</b></div>
        <section className="currency-shop-shell">
          <div className={`currency-shop-intro ${isGold ? "gold" : "gem"}`}>
            <div className="currency-shop-intro-title">
              <span className="currency-shop-intro-icon"><Icon aria-hidden="true" size={22} /></span>
              <div>
                <span className="currency-shop-intro-kicker">NẠP {isGold ? "VÀNG" : "NGỌC"}</span>
                <h2>Nạp {isGold ? "Vàng" : "Ngọc"} theo server</h2>
                <p>Chọn server, nhập số tiền và hệ thống sẽ tự tính số lượng thực nhận.</p>
              </div>
            </div>
            <div className="currency-shop-description">
              <strong>Thông tin</strong>
              <p className={description ? "" : "is-empty"}>
                {description || `Chưa cập nhật mô tả cho trang Nạp ${isGold ? "Vàng" : "Ngọc"}.`}
              </p>
            </div>
          </div>
          <CurrencyTopupForm configs={configs} currencyType={currencyType} />
        </section>
      </main>
    </div>
  );
}

async function getCurrencySettings(): Promise<GameCurrencyDisplaySettings> {
  try {
    return await fetchBackendJson<GameCurrencyDisplaySettings>("/api/currency-settings");
  } catch {
    return { goldImageUrl: "", gemImageUrl: "", goldDescription: "", gemDescription: "" };
  }
}

async function getConfigs(currencyType: GameCurrencyType) {
  try {
    const configs = await fetchBackendJson<GameServerCurrencyConfig[]>(
      "/api/currency-servers?activeOnly=true",
    );
    return configs.filter((item) =>
      currencyType === "GOLD" ? item.goldEnabled : item.gemEnabled,
    );
  } catch {
    return [];
  }
}
