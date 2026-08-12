import Link from "next/link";
import { AccountActions } from "@/app/components/account-actions";
import { CurrencyOrderHistory } from "@/app/components/currency-order-history";
import { ShopBrand } from "@/app/components/shop-brand";
import { getPublicSiteSettings } from "@/lib/site-settings";

export default async function CurrencyOrderHistoryPage() {
  const settings = await getPublicSiteSettings();
  return (
    <div className="order-history-page currency-history-page">
      <header className="service-detail-header">
        <ShopBrand settings={settings} />
        <nav><Link href="/">Trang chủ</Link><Link href="/lich-su-vang-ngoc">Lịch sử Vàng & Ngọc</Link></nav>
        <AccountActions />
      </header>
      <main className="order-history-main currency-history-main">
        <div className="order-history-title currency-history-title">
          <p>TÀI KHOẢN CỦA TÔI</p>
          <h1>Lịch sử nạp Vàng & Ngọc</h1>
          <span>Theo dõi trạng thái, số tiền và số lượng thực nhận của từng đơn.</span>
        </div>
        <CurrencyOrderHistory />
      </main>
    </div>
  );
}
