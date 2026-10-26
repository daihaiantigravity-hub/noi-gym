"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types";
import { useAppLanguage } from "./LanguageProvider";

// Prefetch route data on intent only. Never mount cards or request their media.
export function useExerciseRoutePrefetch() {
  const router = useRouter();
  const { language } = useAppLanguage();
  const recentRoutes = useRef(new Map<string, number>());
  const requestTimes = useRef<number[]>([]);
  const scheduled = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelPrefetch = useCallback(() => {
    if (scheduled.current !== null) clearTimeout(scheduled.current);
    scheduled.current = null;
  }, []);

  useEffect(() => cancelPrefetch, [cancelPrefetch, language]);

  const prefetchRoute = useCallback((href: string, immediate = false) => {
    cancelPrefetch();
    const run = () => {
      scheduled.current = null;
      const now = Date.now();
      const key = `${language}:${href}`;
      for (const [route, timestamp] of recentRoutes.current) {
        if (now - timestamp >= 30_000) recentRoutes.current.delete(route);
      }
      requestTimes.current = requestTimes.current.filter((timestamp) => now - timestamp < 10_000);
      if (recentRoutes.current.has(key) || requestTimes.current.length >= 3) return;

      recentRoutes.current.set(key, now);
      requestTimes.current.push(now);
      router.prefetch(href, {
        // Required by the installed Next 16.3 types; matches its runtime default.
        kind: PrefetchKind.AUTO,
        onInvalidate: () => {
          if (recentRoutes.current.get(key) === now) recentRoutes.current.delete(key);
        },
      });
    };
    // Avoid requests when a pointer merely sweeps across several muscles/pages.
    if (immediate) run();
    else scheduled.current = setTimeout(run, 160);
  }, [cancelPrefetch, language, router]);

  return { prefetchRoute, cancelPrefetch };
}
