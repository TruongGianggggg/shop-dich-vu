import { notFound, permanentRedirect } from "next/navigation";
import { ServiceCategoryBrowser } from "@/app/components/service-category-browser";
import { fetchBackendJson } from "@/lib/backend";
import { ServiceCategory } from "@/lib/shop-api";

async function getCategory(categoryId: string) {
  const backendCategoryId = categoryId === "auto-topup"
    ? "the9p-auto-topup"
    : categoryId;
  const categories = await fetchBackendJson<ServiceCategory[]>(
    "/api/service-categories",
  );
  return categories.find(
    (category) => category.active && category.id === backendCategoryId,
  );
}

export default async function ServiceCategoryPage({
  params,
}: PageProps<"/danh-muc/[categoryId]">) {
  const { categoryId } = await params;

  if (categoryId === "the9p-auto-topup") {
    permanentRedirect("/danh-muc/auto-topup");
  }

  const category = await getCategory(categoryId);

  if (!category) notFound();

  const services = category.children
    .filter((service) => service.active)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="reference-storefront reference-category-page">
      <main className="reference-main">
        <section className="reference-category">
          <div className="reference-category-title">
            <h1>{category.name}</h1>
            <span />
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
