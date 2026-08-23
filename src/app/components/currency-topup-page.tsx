import Link from "next/link";
import { Coins, Gem } from "lucide-react";
import { CurrencyTopupForm } from "@/app/components/currency-topup-form";
import { fetchBackendJson } from "@/lib/backend";
import { GameCurrencyDisplaySettings, GameCurrencyType, GameServerCurrencyConfig } from "@/lib/shop-api";

export async function CurrencyTopupPage({ currencyType }: { currencyType: GameCurrencyType }) {
  const [configs, currencySettings] = await Promise.all([
    getConfigs(currencyType),
    getCurrencySettings(),
  ]);
  const isGold = currencyType === "GOLD";
  const description = isGold ? currencySettings.goldDescription : currencySettings.gemDescription;
  const currencyName = isGold ? "Thỏi vàng" : "Ngọc";
  const currencyNameUpper = isGold ? "THỎI VÀNG" : "NGỌC";
  const Icon = isGold ? Coins : Gem;

  return (
    <div className="currency-shop-page">
      <main className="currency-shop-main">
        <div className="currency-shop-breadcrumb"><Link href="/">Trang chủ</Link><span>/</span><b>Nạp {currencyName}</b></div>
        <section className="currency-shop-shell">
          <div className={`currency-shop-intro ${isGold ? "gold" : "gem"}`}>
            <div className="currency-shop-intro-title">
              <span className="currency-shop-intro-icon"><Icon aria-hidden="true" size={22} /></span>
              <div>
                <span className="currency-shop-intro-kicker">NẠP {currencyNameUpper}</span>
                <h2>Nạp {currencyName} theo server</h2>
                <p>Chọn server, nhập số tiền và hệ thống sẽ tự tính số lượng thực nhận.</p>
              </div>
            </div>
            <div className="currency-shop-description">
              <strong>Thông tin</strong>
              <p className={description ? "" : "is-empty"}>
                {description || `Chưa cập nhật mô tả cho trang Nạp ${currencyName}.`}
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
