import Link from "next/link";
import { Coins, Gem, Mail, MessageCircle, Phone } from "lucide-react";
import { ShopBrand } from "@/app/components/shop-brand";
import { fetchBackendJson } from "@/lib/backend";
import {
  formatVnd,
  GameCurrencyDisplaySettings,
  MonthlyDepositLeaderboard,
  ServiceCategory,
  ServiceSubCategory,
  SiteSettings,
} from "@/lib/shop-api";
import { getPublicSiteSettings } from "@/lib/site-settings";

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
                {category.description ? <p>{category.description}</p> : null}
              </div>

              {category.children.length > 4 ? (
                <label className="reference-search">
                  <span>⌕</span>
                  <input
                    aria-label={`Tìm trong ${category.name}`}
                    placeholder={`Tìm nhóm trong ${category.name.toUpperCase()}...`}
                    readOnly
                    type="search"
                  />
                </label>
              ) : null}

              {category.children.length ? (
                <div className="reference-service-grid">
                  {category.children.map((service) => (
                    <ReferenceServiceCard service={service} key={service.id} />
                  ))}
                </div>
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
            <p>{siteSettings.footerDescription}</p>
          </section>
          <section className="reference-footer-support">
            <h2>{siteSettings.footerSupportTitle}</h2>
            <p>{siteSettings.footerSupportDescription}</p>
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
        <h2>Nạp Vàng và Ngọc</h2>
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
            <h3>MUA VÀNG</h3>
            <p>MUA VÀNG NRO</p>
            <strong className="currency-showcase-button">Mua ngay</strong>
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
            <h3>MUA NGỌC</h3>
            <p>MUA NGỌC NRO</p>
            <strong className="currency-showcase-button">Mua ngay</strong>
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
  if (!settings.bannerUrl && !leaderboard) return null;

  return (
    <section className="storefront-overview" aria-label="Banner và top nạp tháng">
      <div
        className={`storefront-banner${settings.bannerUrl ? " has-image" : ""}`}
        role="img"
        aria-label={`Banner ${settings.shopName}`}
        style={
          settings.bannerUrl
            ? { backgroundImage: `url(${JSON.stringify(settings.bannerUrl)})` }
            : undefined
        }
      >
        {!settings.bannerUrl ? (
          <div><strong>{settings.shopName}</strong><span>{settings.footerDescription}</span></div>
        ) : null}
      </div>
      <div className="monthly-leaderboard">
        <div className="monthly-leaderboard-head">
          <strong>TOP NẠP {String(leaderboard?.month ?? new Date().getMonth() + 1).padStart(2, "0")}/{leaderboard?.year ?? new Date().getFullYear()}</strong>
          <span>Thẻ + Bank</span>
        </div>
        <div className="monthly-leaderboard-list">
          {leaderboard?.entries.length ? (
            leaderboard.entries.map((entry) => (
              <div className="monthly-leaderboard-row" key={`${entry.rank}-${entry.maskedUsername}`}>
                <span className={`rank rank-${entry.rank}`}>{entry.rank}</span>
                <strong>{entry.maskedUsername}</strong>
                <b>{formatVnd(entry.totalAmount)}</b>
              </div>
            ))
          ) : (
            <p>Chưa có giao dịch nạp thành công trong tháng này.</p>
          )}
        </div>
        <div className="monthly-leaderboard-note">Chỉ tính tiền đã cộng vào ví</div>
      </div>
    </section>
  );
}

function ReferenceServiceCard({ service }: { service: ServiceSubCategory }) {
  return (
    <article className="reference-service-card">
      <div
        className="reference-service-image"
        style={
          service.imageUrl
            ? { backgroundImage: `url(${JSON.stringify(service.imageUrl)})` }
            : undefined
        }
      >
        {!service.imageUrl ? (
          <div className="reference-placeholder">
            <span>{service.name.slice(0, 2).toUpperCase()}</span>
            <small>SHOP GAME</small>
          </div>
        ) : null}
      </div>
      <div className="reference-card-content">
        <h3>{service.name}</h3>
        <strong className="reference-ready">Sẵn Sàng</strong>
        <p>{service.serviceCount.toLocaleString("vi-VN")} lượt đã phục vụ</p>
        <Link href={`/dich-vu/${encodeURIComponent(service.id)}`}>
          Xem Tất Cả <span>→</span>
        </Link>
      </div>
    </article>
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
