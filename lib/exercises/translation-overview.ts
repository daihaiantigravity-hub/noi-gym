import type { AppLanguage } from "@/lib/language";
import { getExerciseContentHash, getSourceLocale, type ExerciseTextContent, type ExerciseTranslation } from "./translation-content.mjs";

export type TranslationSource = ExerciseTextContent & { id: string; category: string; status: string };
export type TranslationRecord = ExerciseTranslation & { updated_at: string };
export type TranslationStatus = "missing" | "original" | "draft" | "reviewed" | "stale";
export const TRANSLATION_FILTERS: readonly TranslationStatus[] = ["missing", "draft", "reviewed", "stale", "original"];

export function getTranslationStatus(source: TranslationSource, row: TranslationRecord | null): TranslationStatus {
  if (!row) return "missing";
  return row.source_hash !== getExerciseContentHash(source) ? "stale" : row.translation_status;
}

function searchText(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").replace(/[đĐ]/g, "d").toLowerCase();
}

/** Coverage is computed on the server; only the selected page reaches the rendered UI. */
export function buildTranslationOverview(sources: TranslationSource[], translations: TranslationRecord[], filters: {
  locale: AppLanguage; query?: string; status?: string; page?: number;
}) {
  const rows = new Map(translations.filter((row) => row.locale === filters.locale).map((row) => [row.exercise_id, row]));
  const stats = { total: sources.length, missing: 0, original: 0, draft: 0, reviewed: 0, stale: 0 };
  const query = searchText(filters.query ?? "").trim();
  const items = sources.map((source) => {
    const translation = rows.get(source.id) ?? null;
    const status = !translation && getSourceLocale(source) === filters.locale ? "original" : getTranslationStatus(source, translation);
    stats[status]++;
    return { id: source.id, name: source.name, category: source.category, translatedName: translation?.name ?? "", status, updatedAt: translation?.updated_at ?? null };
  }).filter((item) => (!filters.status || item.status === filters.status)
    && (!query || searchText(`${item.name} ${item.translatedName}`).includes(query)))
    .sort((a, b) => a.name.localeCompare(b.name, "en") || a.id.localeCompare(b.id));
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / 25));
  const page = Math.min(totalPages, Math.max(1, Math.floor(Number(filters.page) || 1)));
  return { stats, items: items.slice((page - 1) * 25, page * 25), total, totalPages, page };
}
