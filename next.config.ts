import type { NextConfig } from "next";

const backendBaseUrl = (
  process.env.SHOP_GAME_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    const backendApiPaths = [
      "banks",
      "currency-servers",
      "currency-settings",
      "service-categories",
      "service-orders/history",
      "service-sub-categories",
      "the9p",
      "wallet",
    ];

    return {
      beforeFiles: backendApiPaths.flatMap((path) => [
        {
          source: `/api/${path}`,
          destination: `${backendBaseUrl}/api/${path}`,
        },
        {
          source: `/api/${path}/:path+`,
          destination: `${backendBaseUrl}/api/${path}/:path+`,
        },
      ]),
    };
  },
};

export default nextConfig;
