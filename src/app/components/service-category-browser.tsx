"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ReferenceServiceCard } from "@/app/components/reference-service-card";
import { ServiceSubCategory } from "@/lib/shop-api";

export function ServiceCategoryBrowser({
  categoryName,
  services,
}: {
  categoryName: string;
  services: ServiceSubCategory[];
}) {
  const [query, setQuery] = useState("");
  const filteredServices = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi");
    if (!normalizedQuery) return services;
    return services.filter((service) =>
      service.name.toLocaleLowerCase("vi").includes(normalizedQuery),
    );
  }, [query, services]);

  return (
    <>
      <label className="reference-search reference-all-services-search">
        <Search aria-hidden="true" size={15} />
        <input
          aria-label={`Tìm trong ${categoryName}`}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Tìm dịch vụ trong ${categoryName.toUpperCase()}...`}
          type="search"
          value={query}
        />
      </label>

      {filteredServices.length ? (
        <div className="reference-service-grid">
          {filteredServices.map((service) => (
            <ReferenceServiceCard key={service.id} service={service} />
          ))}
        </div>
      ) : (
        <p className="reference-empty-category">
          Không tìm thấy dịch vụ phù hợp.
        </p>
      )}
    </>
  );
}
