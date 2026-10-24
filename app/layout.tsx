import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import HealthBackground from "@/components/HealthBackground";
import LanguageProvider from "@/components/LanguageProvider";
import { getLanguagePreference, isLocalizationEnabled } from "@/lib/i18n/server";
import { DEFAULT_HEALTH_MOOD, getHealthBackground, getHealthBackgroundBootstrapScript, HEALTH_THEMES } from "@/lib/health-mood";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const language = isLocalizationEnabled() ? await getLanguagePreference() : "en";
  return {
    title: "Noi Gym",
    description: language === "vi" ? "Thư viện bài tập và quản lý nội dung Noi Gym" : "Noi Gym exercise library and content dashboard",
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const initialPreference = await getLanguagePreference();
  const enabled = isLocalizationEnabled();
  return (
    <html lang={enabled ? initialPreference : "en"} suppressHydrationWarning style={{
      "--health-initial-background": getHealthBackground(DEFAULT_HEALTH_MOOD),
      "--health-canvas-color": HEALTH_THEMES[DEFAULT_HEALTH_MOOD].bottom,
    } as CSSProperties}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: getHealthBackgroundBootstrapScript(process.env.NODE_ENV === "development") }} />
      </head>
      <body><LanguageProvider enabled={enabled} initialPreference={initialPreference}><HealthBackground />{children}</LanguageProvider></body>
    </html>
  );
}
