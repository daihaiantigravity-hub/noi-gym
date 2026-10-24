"use client";

import { useAppLanguage } from "@/components/LanguageProvider";
import { getWorkspaceMessages } from "@/lib/i18n/workspace-messages";

export default function TranslationsError({ reset }: { reset: () => void }) {
  const text = getWorkspaceMessages(useAppLanguage().language);
  return <main className="admin-page"><div className="admin-empty-state" role="alert"><h1>{text.translationsLoadFailed}</h1><button className="admin-button" onClick={reset}>{text.retry}</button></div></main>;
}
