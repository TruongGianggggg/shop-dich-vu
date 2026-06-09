import type { Metadata } from "next";
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
