import Link from "next/link";
import { BellRing } from "lucide-react";
import {
  EMPTY_PAGE,
  NotificationsBoard,
} from "@/app/components/notifications-board";
import { AccountActions } from "@/app/components/account-actions";
import { ShopBrand } from "@/app/components/shop-brand";
import { fetchBackendJson } from "@/lib/backend";
import {
  GameNotification,
  GameNotificationFilters,
  PageResponse,
} from "@/lib/shop-api";
import { getPublicSiteSettings } from "@/lib/site-settings";
import "./notifications.css";

async function getNotificationData() {
  const [page, filters] = await Promise.all([
    fetchBackendJson<PageResponse<GameNotification>>("/api/notifications?page=0&size=20")
      .catch(() => EMPTY_PAGE),
    fetchBackendJson<GameNotificationFilters>("/api/notifications/filters")
      .catch(() => ({ serverNames: [], eventTypes: [] })),
  ]);
  return { page, filters };
}

export default async function NotificationsPage() {
  const [siteSettings, notificationData] = await Promise.all([
    getPublicSiteSettings(),
    getNotificationData(),
  ]);

  return (
    <div className="notifications-page">
      <header className="service-detail-header notifications-header">
        <ShopBrand settings={siteSettings} />
        <nav>
          <Link href="/">Trang chủ</Link>
          <Link aria-current="page" href="/thong-bao">Thông báo</Link>
          <Link href="/lich-su-mua">Lịch sử mua</Link>
        </nav>
        <AccountActions />
      </header>

      <main className="notifications-main">
        <div className="notifications-hero">
          <div className="notifications-hero-icon"><BellRing size={27} /></div>
          <div>
            <p>TRỰC TIẾP TỪ CÁC VŨ TRỤ NRO</p>
            <h1>Thông báo sự kiện</h1>
            <span>Theo dõi boss, vật phẩm hiếm và hoạt động nổi bật trong game.</span>
          </div>
        </div>
        <NotificationsBoard
          initialFilters={notificationData.filters}
          initialPage={notificationData.page}
        />
      </main>
    </div>
  );
}
