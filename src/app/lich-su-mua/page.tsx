import Link from "next/link";
import { AccountActions } from "@/app/components/account-actions";
import { OrderHistory } from "@/app/components/order-history";
import { ShopBrand } from "@/app/components/shop-brand";
import { getPublicSiteSettings } from "@/lib/site-settings";

export default async function OrderHistoryPage() {
  const siteSettings = await getPublicSiteSettings();
  return (
    <div className="order-history-page">
      <header className="service-detail-header">
        <ShopBrand settings={siteSettings} />
        <nav><Link href="/">Trang chủ</Link><Link href="/lich-su-mua">Lịch sử mua</Link></nav>
        <AccountActions />
      </header>
      <main className="order-history-main">
        <div className="order-history-title">
          <p>TÀI KHOẢN CỦA TÔI</p>
          <h1>Lịch sử mua dịch vụ</h1>
          <span>Theo dõi trạng thái và thông tin các đơn đã đặt.</span>
        </div>
        <OrderHistory />
      </main>
    </div>
  );
}
