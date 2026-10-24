"use server";

import { cookies } from "next/headers";
import { LANGUAGE_COOKIE_NAME, type AppLanguage } from "@/lib/language";

export async function setLanguagePreferenceAction(language: AppLanguage) {
  if (language !== "en" && language !== "vi") throw new Error("Unsupported language");
  (await cookies()).set(LANGUAGE_COOKIE_NAME, language, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return language;
}
