import type { Metadata } from "next";
import localFont from "next/font/local";
import { ScrollToPageTop } from "@/app/components/scroll-to-page-top";
import { StorefrontHeader } from "@/app/components/storefront-header";
import "./globals.css";
import "./storefront-v2.css";

const storefrontFont = localFont({
  src: "../../node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf",
  display: "swap",
  variable: "--font-storefront",
});

export const metadata: Metadata = {
  title: "Shop Game",
  description: "Shop nap game va dich vu game theo phan quyen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${storefrontFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <StorefrontHeader />
        <ScrollToPageTop />
        {children}
      </body>
    </html>
  );
}
