import type { Metadata } from "next";
import localFont from "next/font/local";
import { ScrollToPageTop } from "@/app/components/scroll-to-page-top";
import { PasswordChangeGate } from "@/app/components/password-change-gate";
import { StorefrontHeader } from "@/app/components/storefront-header";
import { DEFAULT_SITE_SETTINGS, getPublicSiteSettings } from "@/lib/site-settings";
import "./globals.css";
import "./storefront-v2.css";

const storefrontFont = localFont({
  src: "../../node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf",
  display: "swap",
  variable: "--font-storefront",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const shopName = settings.shopName.trim() || DEFAULT_SITE_SETTINGS.shopName;
  const logoUrl = settings.logoUrl.trim() || "/favicon.ico";

  return {
    title: shopName,
    applicationName: shopName,
    description: "Shop nap game va dich vu game theo phan quyen",
    icons: {
      icon: [{ url: logoUrl }],
      shortcut: [logoUrl],
      apple: [{ url: logoUrl }],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${storefrontFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <PasswordChangeGate>
          <StorefrontHeader />
          <ScrollToPageTop />
          {children}
        </PasswordChangeGate>
      </body>
    </html>
  );
}
