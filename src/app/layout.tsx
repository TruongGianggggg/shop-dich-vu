import type { Metadata } from "next";
import { StorefrontHeader } from "@/app/components/storefront-header";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
