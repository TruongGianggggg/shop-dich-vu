import type { Metadata } from "next";
import { ScrollToPageTop } from "@/app/components/scroll-to-page-top";
import { StorefrontHeader } from "@/app/components/storefront-header";
import "./globals.css";
import "./storefront-v2.css";

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
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <StorefrontHeader />
        <ScrollToPageTop />
        {children}
      </body>
    </html>
  );
}
