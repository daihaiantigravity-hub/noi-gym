"use client";

import { createContext, useContext, useState, useTransition, type ReactNode } from "react";
import { setLanguagePreferenceAction } from "@/app/actions/language";
import { getMessages } from "@/lib/i18n/messages";
import type { AppLanguage } from "@/lib/language";

type LanguageContextValue = {
  enabled: boolean;
  language: AppLanguage;
  preference: AppLanguage;
  pending: boolean;
  error: string | null;
  switchLanguage: () => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export default function LanguageProvider({ children, initialPreference, enabled }: {
  children: ReactNode;
  initialPreference: AppLanguage;
  enabled: boolean;
}) {
  const [snapshot, setSnapshot] = useState(initialPreference);
  const [preference, setPreference] = useState(initialPreference);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Synchronize refreshed server props without an effect that flashes an old locale.
  if (snapshot !== initialPreference) {
    setSnapshot(initialPreference);
    setPreference(initialPreference);
  }
  const language = enabled ? preference : "en";

  function switchLanguage() {
    if (pending) return;
    const nextLanguage = preference === "en" ? "vi" : "en";
    setError(null);
    startTransition(async () => {
      try {
        const saved = await setLanguagePreferenceAction(nextLanguage);
        setPreference(saved);
      } catch {
        setError(getMessages(language).languageChangeFailed);
      }
    });
  }

  return <LanguageContext.Provider value={{ enabled, language, preference, pending, error, switchLanguage }}>{children}</LanguageContext.Provider>;
}

export function useAppLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useAppLanguage must be used within LanguageProvider");
  return context;
}
