import Link from "next/link";
import { AccountActions } from "@/app/components/account-actions";
import { ServiceOrderForm } from "@/app/components/service-order-form";
import { ShopBrand } from "@/app/components/shop-brand";
import { fetchBackendJson } from "@/lib/backend";
import {
  ServiceCategory,
  ServicePackage,
  ServiceSubCategory,
} from "@/lib/shop-api";
import { getPublicSiteSettings } from "@/lib/site-settings";
import "./detail.css";

async function getService(subCategoryId: string) {
  let service: ServiceSubCategory | null = null;

  try {
    service = await fetchBackendJson<ServiceSubCategory>(
      `/api/service-sub-categories/${encodeURIComponent(subCategoryId)}`,
    );
  } catch {
    try {
      const categories = await fetchBackendJson<ServiceCategory[]>(
        "/api/service-categories",
      );
      service =
        categories
          .flatMap((category) => category.children)
          .find((item) => item.id === subCategoryId && item.active) ?? null;
    } catch {
      service = null;
    }
  }

  if (!service) {
    return null;
  }

  try {
    const packages = await fetchBackendJson<ServicePackage[]>(
      `/api/service-sub-categories/${encodeURIComponent(subCategoryId)}/packages`,
    );
    return {
      service,
      packages: packages
        .filter((item) => item.active)
        .sort((a, b) => a.displayOrder - b.displayOrder),
    };
  } catch {
    return { service, packages: [] };
  }
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ subCategoryId: string }>;
}) {
  const { subCategoryId } = await params;
  const [data, siteSettings] = await Promise.all([
    getService(subCategoryId),
    getPublicSiteSettings(),
  ]);

  if (!data) {
    return (
      <main className="service-detail-missing">
        <strong>Không tìm thấy dịch vụ</strong>
        <p>Dịch vụ không tồn tại, đã tắt hoặc backend chưa phản hồi.</p>
        <Link href="/">Quay lại trang chủ</Link>
      </main>
    );
  }

  return (
    <div className="service-detail-page">
      <header className="service-detail-header">
        <ShopBrand settings={siteSettings} />
        <nav>
          <Link href="/">Trang chủ</Link>
          <Link href="/lich-su-mua">Lịch sử mua</Link>
        </nav>
        <AccountActions />
      </header>

      <main className="service-detail-main">
        <div className="detail-page-title">
          <h1>Dịch Vụ - {data.service.name}</h1>
          <span aria-hidden="true" />
        </div>
        <ServiceOrderForm packages={data.packages} service={data.service} />
      </main>
    </div>
  );
}
