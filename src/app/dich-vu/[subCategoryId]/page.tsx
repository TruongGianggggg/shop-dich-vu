import Link from "next/link";
import { redirect } from "next/navigation";
import { SafeRichText } from "@/app/components/safe-rich-text";
import { ServiceOrderForm } from "@/app/components/service-order-form";
import { fetchBackendJson } from "@/lib/backend";
import {
  ServiceCategory,
  ServicePackage,
  ServiceSubCategory,
} from "@/lib/shop-api";
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
  const data = await getService(subCategoryId);

  if (!data) {
    return (
      <main className="service-detail-missing">
        <strong>Không tìm thấy dịch vụ</strong>
        <p>Dịch vụ không tồn tại, đã tắt hoặc backend chưa phản hồi.</p>
        <Link href="/">Quay lại trang chủ</Link>
      </main>
    );
  }

  if (data.service.type === "TOPUP_GOLD") {
    redirect("/nap-vang");
  }
  if (data.service.type === "TOPUP_GEM") {
    redirect("/nap-ngoc");
  }

  return (
    <div className="service-detail-page">
      <main className="service-detail-main">
        <div className="detail-page-title">
          <h1>Dịch Vụ - {data.service.name}</h1>
          <span aria-hidden="true" />
        </div>
        <section className="detail-service-intro">
          <div
            aria-label={`Ảnh ${data.service.name}`}
            className={
              data.service.imageUrl
                ? "detail-service-image has-image"
                : "detail-service-image"
            }
            role="img"
            style={
              data.service.imageUrl
                ? {
                    backgroundImage: `url(${JSON.stringify(
                      data.service.imageUrl,
                    )})`,
                  }
                : undefined
            }
          >
            {!data.service.imageUrl ? <span aria-hidden="true">🎮</span> : null}
          </div>
          <div>
            <p className="detail-service-type">
              {data.service.type === "TOPUP_CAROT"
                ? "Nạp Carot"
                : "Dịch vụ game"}
            </p>
            <h2>{data.service.name}</h2>
            <SafeRichText
              className="detail-service-description"
              html={data.service.description || "Dịch vụ đang mở bán."}
            />
          </div>
        </section>
        <ServiceOrderForm packages={data.packages} service={data.service} />
      </main>
    </div>
  );
}
