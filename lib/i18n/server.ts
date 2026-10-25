import "server-only";

import { cookies } from "next/headers";
import { LANGUAGE_COOKIE_NAME, parseAppLanguage } from "@/lib/language";

// Localization is live now that the interface and exercise translations have passed QA.
// Keep an explicit opt-out for an emergency rollback, but do not require a
// Vercel-only environment variable for the production feature to work.
export function isLocalizationEnabled() {
  return process.env.APP_LOCALIZATION_ENABLED?.trim().toLowerCase() !== "false";
}

export async function getLanguagePreference() {
  return parseAppLanguage((await cookies()).get(LANGUAGE_COOKIE_NAME)?.value);
}

export async function getAppLanguage() {
  return isLocalizationEnabled() ? getLanguagePreference() : "en";
}
