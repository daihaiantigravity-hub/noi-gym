import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Noi Gym",
  description: "Noi Gym exercise library and content dashboard",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
