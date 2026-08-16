"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

export function StorefrontBannerCarousel({
  bannerUrls,
  description,
  shopName,
}: {
  bannerUrls: string[];
  description: string;
  shopName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const visibleIndex = bannerUrls.length ? activeIndex % bannerUrls.length : 0;

  useEffect(() => {
    if (bannerUrls.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % bannerUrls.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [bannerUrls.length]);

  function showBanner(index: number) {
    setActiveIndex((index + bannerUrls.length) % bannerUrls.length);
  }

  return (
    <section
      aria-label={`Banner ${shopName}`}
      className={`storefront-banner${bannerUrls.length ? " has-image" : ""}`}
    >
      {bannerUrls.length ? (
        <>
          <Image
            alt={`Banner ${shopName} ${visibleIndex + 1}`}
            className="storefront-banner-image"
            fill
            priority
            sizes="(max-width: 820px) 100vw, 72vw"
            src={bannerUrls[visibleIndex]}
            unoptimized
          />
          {bannerUrls.length > 1 ? (
            <>
              <button
                aria-label="Banner trước"
                className="storefront-banner-arrow is-previous"
                onClick={() => showBanner(visibleIndex - 1)}
                type="button"
              >
                <ChevronLeft aria-hidden="true" size={22} />
              </button>
              <button
                aria-label="Banner tiếp theo"
                className="storefront-banner-arrow is-next"
                onClick={() => showBanner(visibleIndex + 1)}
                type="button"
              >
                <ChevronRight aria-hidden="true" size={22} />
              </button>
              <div className="storefront-banner-dots" role="group" aria-label="Chọn banner">
                {bannerUrls.map((_, index) => (
                  <button
                    aria-label={`Hiển thị banner ${index + 1}`}
                    className={index === visibleIndex ? "is-active" : ""}
                    key={index}
                    onClick={() => showBanner(index)}
                    type="button"
                  />
                ))}
              </div>
            </>
          ) : null}
        </>
      ) : (
        <div>
          <strong>{shopName}</strong>
          <span>{description}</span>
        </div>
      )}
    </section>
  );
}
