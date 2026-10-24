import "server-only";

import { cookies } from "next/headers";
import { LANGUAGE_COOKIE_NAME, parseAppLanguage } from "@/lib/language";

// The switch remains in preference-only mode until UI and exercise translations pass QA.
export function isLocalizationEnabled() {
  return process.env.APP_LOCALIZATION_ENABLED === "true";
}

export async function getLanguagePreference() {
  return parseAppLanguage((await cookies()).get(LANGUAGE_COOKIE_NAME)?.value);
}

export async function getAppLanguage() {
  return isLocalizationEnabled() ? getLanguagePreference() : "en";
}
