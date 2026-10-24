"use client";

import { useAppLanguage } from "@/components/LanguageProvider";
import { getMessages } from "@/lib/i18n/messages";

function EnglishFlagIcon() {
  return (
    <svg aria-hidden="true" preserveAspectRatio="xMidYMid slice" viewBox="0 0 60 40">
      <rect fill="#012169" height="40" width="60" />
      <path d="M0 0 60 40M60 0 0 40" stroke="#fff" strokeWidth="8" />
      <path d="M0 0 60 40M60 0 0 40" stroke="#c8102e" strokeWidth="4" />
      <path d="M30 0v40M0 20h60" stroke="#fff" strokeWidth="12" />
      <path d="M30 0v40M0 20h60" stroke="#c8102e" strokeWidth="7" />
    </svg>
  );
}

function VietnamFlagIcon() {
  return (
    <svg aria-hidden="true" preserveAspectRatio="xMidYMid slice" viewBox="0 0 60 40">
      <rect fill="#da251d" height="40" width="60" />
      <path d="m30 8 3.1 9.4H43l-8 5.8 3.1 9.3-8.1-5.8-8.1 5.8 3.1-9.3-8-5.8h9.9Z" fill="#ffdf00" />
    </svg>
  );
}

export default function LanguageToggle({ whenEnabledOnly = false }: { whenEnabledOnly?: boolean }) {
  const { enabled, language, preference, pending, error, switchLanguage } = useAppLanguage();
  const messages = getMessages(language);
  const label = preference === "en" ? messages.switchToVietnamese : messages.switchToEnglish;
  if (whenEnabledOnly && !enabled) return null;

  return (
    <button
      aria-busy={pending}
      aria-label={label}
      className="health-language-toggle"
      data-language={preference}
      disabled={pending}
      onClick={switchLanguage}
      title={error ?? label}
      type="button"
    >
      <span className="health-language-toggle__flag">
        {preference === "en" ? <EnglishFlagIcon /> : <VietnamFlagIcon />}
      </span>
    </button>
  );
}
