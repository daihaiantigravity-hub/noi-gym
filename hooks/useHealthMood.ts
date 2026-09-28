"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_HEALTH_MOOD,
  getHealthMood,
  getMillisecondsUntilNextHealthMood,
  type HealthMood,
} from "@/lib/health-mood";

export function useHealthMood(): HealthMood {
  const [mood, setMood] = useState<HealthMood>(DEFAULT_HEALTH_MOOD);

  useEffect(() => {
    let timerId: number | undefined;

    const updateMood = () => {
      if (timerId !== undefined) window.clearTimeout(timerId);
      const now = new Date();
      setMood(getHealthMood(now));
      timerId = window.setTimeout(updateMood, getMillisecondsUntilNextHealthMood(now) + 50);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") updateMood();
    };

    updateMood();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", updateMood);

    return () => {
      if (timerId !== undefined) window.clearTimeout(timerId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", updateMood);
    };
  }, []);

  return mood;
}
