import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Activity | Samsung Health",
  description: "Samsung Health activity overview",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
