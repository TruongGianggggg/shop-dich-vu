import Link from "next/link";
import { Coins, Gem, Mail, MessageCircle, Phone } from "lucide-react";
import { MonthlyLeaderboardCard } from "@/app/components/monthly-leaderboard-card";
import { ReferenceServiceCard } from "@/app/components/reference-service-card";
import { SafeRichText } from "@/app/components/safe-rich-text";
import { ShopBrand } from "@/app/components/shop-brand";
import { StorefrontBannerCarousel } from "@/app/components/storefront-banner-carousel";
import { StorefrontAnnouncement } from "@/app/components/storefront-announcement";
import { fetchBackendJson } from "@/lib/backend";
import {
  GameCurrencyDisplaySettings,
  MonthlyDepositLeaderboard,
  ServiceCategory,
  SiteSettings,
} from "@/lib/shop-api";
import { getPublicSiteSettings } from "@/lib/site-settings";
import { richTextToPlainText } from "@/lib/rich-text";

async function getCategories(): Promise<{
  categories: ServiceCategory[];
  hasApiError: boolean;
}> {
  try {
    const response = await fetchBackendJson<ServiceCategory[]>(
      "/api/service-categories",
    );
    const categories = response
      .filter((category) => category.active)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((category) => ({
        ...category,
        children: category.children
          .filter((child) => child.active)
          .sort((a, b) => a.displayOrder - b.displayOrder),
      }));

    return { categories, hasApiError: false };
  } catch {
    return { categories: [], hasApiError: true };
  }
}

async function getMonthlyLeaderboard() {
  try {
    return await fetchBackendJson<MonthlyDepositLeaderboard>(
      "/api/deposits/leaderboard/monthly?limit=5",
    );
  } catch {
    return null;
  }
}

async function getCurrencyDisplaySettings() {
  try {
    return await fetchBackendJson<GameCurrencyDisplaySettings>(
      "/api/currency-settings",
    );
  } catch {
    return { goldImageUrl: "", gemImageUrl: "", goldDescription: "", gemDescription: "" };
  }
}

export default async function Home() {
  const [
    { categories, hasApiError },
    siteSettings,
    leaderboard,
    currencyDisplaySettings,
  ] =
    await Promise.all([
      getCategories(),
      getPublicSiteSettings(),
      getMonthlyLeaderboard(),
      getCurrencyDisplaySettings(),
    ]);

  return (
    <div className="reference-storefront">
      <StorefrontAnnouncement
        content={siteSettings.announcementContent}
        enabled={siteSettings.announcementEnabled}
        title={siteSettings.announcementTitle}
      />
      <main className="reference-main" id="dich-vu">
        <StorefrontOverview
          leaderboard={leaderboard}
          settings={siteSettings}
        />

        <CurrencyTopupSection displaySettings={currencyDisplaySettings} />

        {hasApiError ? (
          <StoreState
            title="Không thể tải dữ liệu cửa hàng"
            description="API shop-game hiện chưa phản hồi. Vui lòng kiểm tra backend rồi tải lại trang."
          />
        ) : categories.length === 0 ? (
          <StoreState
            title="Cửa hàng chưa có dịch vụ"
            description="Hãy thêm và bật danh mục trong trang quản trị. Trang chủ không sử dụng dữ liệu mẫu."
          />
        ) : (
          categories.map((category) => (
            <section className="reference-category" key={category.id}>
              <div className="reference-category-title">
                <h2>{category.name}</h2>
                <span />
                {category.description ? (
                  <SafeRichText
                    className="reference-category-description"
                    html={category.description}
                  />
                ) : null}
              </div>

              {category.children.length ? (
                <>
                  <div className="reference-service-grid reference-service-row">
                    {category.children.map((service) => (
                      <ReferenceServiceCard service={service} key={service.id} />
                    ))}
                  </div>
                  {category.children.length > 4 ? (
                    <div className="reference-more-wrap">
                      <Link
                        className="reference-more-link"
                        href={`/danh-muc/${encodeURIComponent(category.id)}`}
                      >
                        Xem tất cả <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="reference-empty-category">
                  Danh mục này chưa có dịch vụ đang hoạt động.
                </p>
              )}
            </section>
          ))
        )}
      </main>

      <footer className="reference-footer">
        <div className="reference-footer-inner">
          <section className="reference-footer-about">
            <ShopBrand settings={siteSettings} />
            <strong className="reference-footer-title">{siteSettings.footerTitle}</strong>
            <SafeRichText
              className="reference-footer-description"
              html={siteSettings.footerDescription}
            />
          </section>
          <section className="reference-footer-support">
            <h2>{siteSettings.footerSupportTitle}</h2>
            <SafeRichText
              className="reference-footer-description"
              html={siteSettings.footerSupportDescription}
            />
            <div className="reference-footer-contacts">
              {siteSettings.footerFacebookUrl ? (
                <a href={siteSettings.footerFacebookUrl} rel="noreferrer" target="_blank">
                  <span aria-hidden="true" className="reference-footer-facebook-mark">f</span> Facebook
                </a>
              ) : null}
              {siteSettings.footerPhone ? (
                <a href={`tel:${siteSettings.footerPhone.replace(/[^\d+]/g, "")}`}>
                  <Phone aria-hidden="true" size={15} /> {siteSettings.footerPhone}
                </a>
              ) : null}
              {siteSettings.footerEmail ? (
                <a href={`mailto:${siteSettings.footerEmail}`}>
                  <Mail aria-hidden="true" size={15} /> {siteSettings.footerEmail}
                </a>
              ) : null}
              {siteSettings.footerZaloUrl ? (
                <a href={siteSettings.footerZaloUrl} rel="noreferrer" target="_blank">
                  <MessageCircle aria-hidden="true" size={15} /> Zalo
                </a>
              ) : null}
            </div>
          </section>
        </div>
        <p className="reference-footer-copyright">© {new Date().getFullYear()} {siteSettings.footerCopyright}</p>
      </footer>
    </div>
  );
}

function CurrencyTopupSection({
  displaySettings,
}: {
  displaySettings: GameCurrencyDisplaySettings;
}) {
  return (
    <section className="reference-category currency-home-category">
      <div className="reference-category-title">
        <h2>Nạp Thỏi vàng và Ngọc</h2>
        <span />
      </div>
      <div className="currency-showcase-grid">
        <Link className="currency-showcase-card gold" href="/nap-vang">
          <div
            className={displaySettings.goldImageUrl ? "currency-showcase-cover has-image" : "currency-showcase-cover"}
            style={displaySettings.goldImageUrl ? { backgroundImage: `url(${JSON.stringify(displaySettings.goldImageUrl)})` } : undefined}
          >
            {!displaySettings.goldImageUrl ? <Coins size={58} /> : null}
          </div>
          <div className="currency-showcase-content">
            <h3>NẠP THỎI VÀNG</h3>
            <p>NẠP THỎI VÀNG NRO</p>
            <strong className="currency-showcase-button">Nạp ngay</strong>
          </div>
        </Link>
        <Link className="currency-showcase-card gem" href="/nap-ngoc">
          <div
            className={displaySettings.gemImageUrl ? "currency-showcase-cover has-image" : "currency-showcase-cover"}
            style={displaySettings.gemImageUrl ? { backgroundImage: `url(${JSON.stringify(displaySettings.gemImageUrl)})` } : undefined}
          >
            {!displaySettings.gemImageUrl ? <Gem size={58} /> : null}
          </div>
          <div className="currency-showcase-content">
            <h3>NẠP NGỌC</h3>
            <p>NẠP NGỌC NRO</p>
            <strong className="currency-showcase-button">Nạp ngay</strong>
          </div>
        </Link>
      </div>
    </section>
  );
}

function StorefrontOverview({
  leaderboard,
  settings,
}: {
  leaderboard: MonthlyDepositLeaderboard | null;
  settings: SiteSettings;
}) {
  const bannerUrls = settings.bannerUrls?.length
    ? settings.bannerUrls
    : settings.bannerUrl
      ? [settings.bannerUrl]
      : [];
  if (!bannerUrls.length && !leaderboard) return null;

  return (
    <section className="storefront-overview" aria-label="Banner và top nạp tháng">
      <StorefrontBannerCarousel
        bannerUrls={bannerUrls}
        description={richTextToPlainText(settings.footerDescription)}
        shopName={settings.shopName}
      />
      <MonthlyLeaderboardCard leaderboard={leaderboard} />
    </section>
  );
}

function StoreState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="reference-state" role="status">
      <span>!</span>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </div>
  );
}
