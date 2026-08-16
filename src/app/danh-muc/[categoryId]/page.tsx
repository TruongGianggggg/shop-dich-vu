import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { ServiceCategoryBrowser } from "@/app/components/service-category-browser";
import { fetchBackendJson } from "@/lib/backend";
import { ServiceCategory } from "@/lib/shop-api";

async function getCategory(categoryId: string) {
  const categories = await fetchBackendJson<ServiceCategory[]>(
    "/api/service-categories",
  );
  return categories.find(
    (category) => category.active && category.id === categoryId,
  );
}

export default async function ServiceCategoryPage({
  params,
}: PageProps<"/danh-muc/[categoryId]">) {
  const { categoryId } = await params;
  const category = await getCategory(categoryId);

  if (!category) notFound();

  const services = category.children
    .filter((service) => service.active)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="reference-storefront reference-category-page">
      <main className="reference-main">
        <Link className="reference-back-link" href="/#dich-vu">
          <ArrowLeft aria-hidden="true" size={16} />
          Quay lại trang chủ
        </Link>
        <section className="reference-category">
          <div className="reference-category-title">
            <h1>{category.name}</h1>
            <span />
            <p>
              {category.description || `Tất cả dịch vụ trong ${category.name}`}
            </p>
          </div>
          <ServiceCategoryBrowser
            categoryName={category.name}
            services={services}
          />
        </section>
      </main>
    </div>
  );
}
