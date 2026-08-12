import Link from "next/link";
import { AccountActions } from "@/app/components/account-actions";
import { CurrencyTopupForm } from "@/app/components/currency-topup-form";
import { ShopBrand } from "@/app/components/shop-brand";
import { fetchBackendJson } from "@/lib/backend";
import { GameCurrencyType, GameServerCurrencyConfig } from "@/lib/shop-api";
import { getPublicSiteSettings } from "@/lib/site-settings";

export async function CurrencyTopupPage({ currencyType }: { currencyType: GameCurrencyType }) {
  const [settings, configs] = await Promise.all([
    getPublicSiteSettings(),
    getConfigs(currencyType),
  ]);
  const isGold = currencyType === "GOLD";

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
            <span>{isGold ? "VÀNG" : "NGỌC"}</span>
            <h2>Nạp {isGold ? "Vàng" : "Ngọc"} theo server</h2>
            <p>Chọn server và nhập số tiền. Hệ thống tự tính chính xác số lượng thực nhận theo cấu hình hiện tại.</p>
          </div>
          <CurrencyTopupForm configs={configs} currencyType={currencyType} />
        </section>
      </main>
    </div>
  );
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
