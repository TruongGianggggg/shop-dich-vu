import "server-only";
import { fetchBackendJson } from "@/lib/backend";
import { SiteSettings } from "@/lib/shop-api";

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  shopName: "SHOP GAME",
  logoUrl: "",
  bannerUrl: "",
  bannerUrls: [],
  announcementEnabled: false,
  announcementTitle: "Thông báo mới",
  announcementContent: "",
  footerTitle: "SHOP GAME",
  footerDescription: "Dịch vụ game trực tuyến nhanh chóng và an toàn.",
  footerCopyright: "Shop Game. All rights reserved.",
  footerSupportTitle: "LIÊN HỆ HỖ TRỢ",
  footerSupportDescription: "Liên hệ ngay cho chăm sóc khách hàng nếu gặp lỗi khi sử dụng dịch vụ.",
  footerPhone: "",
  footerEmail: "",
  footerFacebookUrl: "",
  footerZaloUrl: "",
};

export async function getPublicSiteSettings() {
  try {
    const settings = await fetchBackendJson<SiteSettings>("/api/site-settings");
    const bannerUrls = Array.isArray(settings.bannerUrls)
      ? settings.bannerUrls
      : settings.bannerUrl
        ? [settings.bannerUrl]
        : [];
    return {
      ...DEFAULT_SITE_SETTINGS,
      ...settings,
      bannerUrl: bannerUrls[0] ?? "",
      bannerUrls,
    };
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}
