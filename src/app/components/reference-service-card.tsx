import Link from "next/link";
import { ServiceSubCategory } from "@/lib/shop-api";

export function ReferenceServiceCard({ service }: { service: ServiceSubCategory }) {
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
