import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import HealthBackground from "@/components/HealthBackground";
import { DEFAULT_HEALTH_MOOD, getHealthBackground, getHealthBackgroundBootstrapScript, HEALTH_THEMES } from "@/lib/health-mood";
import "./globals.css";

export const metadata: Metadata = {
  title: "Noi Gym",
  description: "Noi Gym exercise library and content dashboard",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning style={{
      "--health-initial-background": getHealthBackground(DEFAULT_HEALTH_MOOD),
      "--health-canvas-color": HEALTH_THEMES[DEFAULT_HEALTH_MOOD].bottom,
    } as CSSProperties}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: getHealthBackgroundBootstrapScript(process.env.NODE_ENV === "development") }} />
      </head>
      <body><HealthBackground />{children}</body>
    </html>
  );
}
