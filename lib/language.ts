export const LANGUAGE_COOKIE_NAME = "noi-gym-language";
export const DEFAULT_LANGUAGE = "en";

export type AppLanguage = "en" | "vi";

export function parseAppLanguage(value: string | null | undefined): AppLanguage {
  return value === "vi" ? "vi" : DEFAULT_LANGUAGE;
}
