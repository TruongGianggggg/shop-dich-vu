import Link from "next/link";
import { SiteSettings } from "@/lib/shop-api";

export function ShopBrand({ settings }: { settings: SiteSettings }) {
  return (
    <Link
      className={`reference-logo${settings.logoUrl ? " has-custom-logo" : ""}`}
      href="/"
    >
      {settings.logoUrl ? (
        <span
          aria-label={settings.shopName}
          className="reference-logo-picture"
          role="img"
          style={{ backgroundImage: `url(${JSON.stringify(settings.logoUrl)})` }}
        />
      ) : (
        <span>SG</span>
      )}
      {!settings.logoUrl ? <strong>{settings.shopName}</strong> : null}
    </Link>
  );
}
