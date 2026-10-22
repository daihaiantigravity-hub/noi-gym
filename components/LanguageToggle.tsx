"use client";

import { useState } from "react";
import { LANGUAGE_COOKIE_NAME, type AppLanguage } from "@/lib/language";

const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

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

export default function LanguageToggle({ initialLanguage }: { initialLanguage: AppLanguage }) {
  const [language, setLanguage] = useState(initialLanguage);
  const nextLanguage: AppLanguage = language === "en" ? "vi" : "en";
  const nextLanguageLabel = nextLanguage === "vi" ? "Vietnamese" : "English";

  function switchLanguage() {
    setLanguage(nextLanguage);
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${LANGUAGE_COOKIE_NAME}=${nextLanguage}; Path=/; Max-Age=${LANGUAGE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
  }

  return (
    <button
      aria-label={`Switch to ${nextLanguageLabel}`}
      className="health-language-toggle"
      data-language={language}
      onClick={switchLanguage}
      title={`Switch to ${nextLanguageLabel}`}
      type="button"
    >
      <span className="health-language-toggle__flag">
        {language === "en" ? <EnglishFlagIcon /> : <VietnamFlagIcon />}
      </span>
    </button>
  );
}
