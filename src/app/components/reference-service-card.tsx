import Link from "next/link";
import { ServiceSubCategory } from "@/lib/shop-api";

export function ReferenceServiceCard({ service }: { service: ServiceSubCategory }) {
  const href = serviceHref(service);
  const serviceImage = service.imageUrl
    ? `url(${JSON.stringify(service.imageUrl)})`
    : null;
  const actionLabel = service.type === "TOPUP_GOLD" || service.type === "TOPUP_GEM"
    ? "Nạp ngay"
    : "Xem Tất Cả";
  return (
    <article className="reference-service-card">
      <div
        className={serviceImage
          ? "reference-service-image has-image"
          : "reference-service-image"}
        style={
          serviceImage
            ? {
                backgroundImage: `${serviceImage}, linear-gradient(rgba(15, 23, 42, 0.28), rgba(15, 23, 42, 0.28)), ${serviceImage}`,
              }
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
        <Link href={href}>
          {actionLabel} <span>→</span>
        </Link>
      </div>
    </article>
  );
}

function serviceHref(service: ServiceSubCategory) {
  if (service.type === "TOPUP_GOLD") return "/nap-vang";
  if (service.type === "TOPUP_GEM") return "/nap-ngoc";
  return `/dich-vu/${encodeURIComponent(service.id)}`;
}
