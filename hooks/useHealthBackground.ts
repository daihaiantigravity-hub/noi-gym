"use client";

import { useLayoutEffect, useRef } from "react";
import { startHealthBackground } from "@/lib/health-background";

export function useHealthBackground() {
  const firstLayer = useRef<HTMLDivElement>(null);
  const secondLayer = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!firstLayer.current || !secondLayer.current) return;
    return startHealthBackground([firstLayer.current, secondLayer.current]);
  }, []);
  return [firstLayer, secondLayer] as const;
}
