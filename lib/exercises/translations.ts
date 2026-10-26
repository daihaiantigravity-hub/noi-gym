import "server-only";

import { unstable_cache } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { getAppLanguage, isLocalizationEnabled } from "@/lib/i18n/server";
import type { AppLanguage } from "@/lib/language";
import type { WorkspaceMessageKey } from "@/lib/i18n/workspace-messages";
import { createSupabasePublicClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { invalidateExerciseContent, isExerciseDataCacheEnabled, PUBLIC_EXERCISES_CONTENT_CACHE_TAG } from "./cache";
import { measureExerciseRead } from "./performance";
import { applyExerciseTranslation, getExerciseContentHash, getSourceLocale, validateExerciseTranslation, type ExerciseTranslation } from "./translation-content.mjs";

type LocalizableExercise = { id: string; name: string; description?: string; steps?: string[]; sourceContentHash?: string };
type TranslationRelation = ExerciseTranslation & {
  exercises: { id: string; source: string; source_id: number | null; name: string; description: string; steps: string[]; status: string };
};

async function readPublicTranslations(locale: AppLanguage, databaseIds: string[], sourceIds: number[]): Promise<TranslationRelation[]> {
  return measureExerciseRead("translations.query", async () => {
    const client = createSupabasePublicClient();
    const query = () => client.from("exercise_translations")
      .select("exercise_id,locale,name,description,steps,source_locale,source_hash,translation_status,reviewed_at,exercises!inner(id,source,source_id,name,description,steps,status)")
      .eq("locale", locale).eq("translation_status", "reviewed").eq("exercises.status", "Published");
    const results = await Promise.all([
      ...(databaseIds.length ? [query().in("exercise_id", databaseIds)] : []),
      ...(sourceIds.length ? [query().eq("exercises.source", "musclewiki").in("exercises.source_id", sourceIds)] : []),
    ]);
    const rows: TranslationRelation[] = [];
    for (const { data, error } of results) {
      // Throw before caching: an outage must not become a cached empty translation.
      if (error) throw new Error(`Translation read failed (${error.code ?? "unknown"})`);
      rows.push(...(data ?? []) as unknown as TranslationRelation[]);
    }
    return rows;
  });
}

const readCachedPublicTranslations = unstable_cache(
  async (locale: AppLanguage, databaseIds: string[], sourceIds: number[], sourceRevisions: string[]) => {
    // Full source revisions are part of the cache key, including cached empty results.
    void sourceRevisions;
    return readPublicTranslations(locale, databaseIds, sourceIds);
  },
  ["public-exercise-translations-v1"],
  { revalidate: 60, tags: [PUBLIC_EXERCISES_CONTENT_CACHE_TAG] },
);

function getSourceRevision(item: LocalizableExercise) {
  if (item.sourceContentHash) return item.sourceContentHash;
  if (item.description !== undefined && item.steps) {
    return getExerciseContentHash({ name: item.name, description: item.description, steps: item.steps });
  }
  return null;
}

/** Localize only the current page. Public/RLS reads never expose draft translations. */
export async function localizeExercises<T extends LocalizableExercise>(items: T[], language?: AppLanguage): Promise<T[]> {
  if (items.length === 0 || !isLocalizationEnabled()) return items;
  const locale = language ?? await getAppLanguage();
  const fallback = (item: T): T => ({ ...item, isTranslationFallback: locale !== getSourceLocale({ name: item.name, description: item.description ?? "", steps: item.steps ?? [] }) });
  if (!isSupabaseConfigured()) return items.map(fallback);
  const databaseIds = [...new Set(items.map((item) => item.id).filter((id) => /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)))].sort();
  const sourceIds = [...new Set(items.flatMap((item) => /^source-\d+$/.test(item.id) ? [Number(item.id.slice(7))] : []))].sort((a, b) => a - b);
  const sourceRevisions = [...new Set(items.flatMap((item) => {
    const revision = getSourceRevision(item);
    return databaseIds.includes(item.id) && revision ? [`${item.id}:${revision}`] : [];
  }))].sort();
  if (databaseIds.length === 0 && sourceIds.length === 0) return items.map(fallback);
  let translations: TranslationRelation[];
  try {
    translations = await measureExerciseRead("translations.read", () => isExerciseDataCacheEnabled()
      ? readCachedPublicTranslations(locale, databaseIds, sourceIds, sourceRevisions)
      : readPublicTranslations(locale, databaseIds, sourceIds));
  } catch {
    console.warn("Exercise translations could not be loaded");
    return items.map(fallback);
  }
  const rows = new Map<string, TranslationRelation>();
  for (const row of translations) {
    rows.set(row.exercise_id, row);
    if (row.exercises?.source === "musclewiki" && row.exercises.source_id) rows.set(`source-${row.exercises.source_id}`, row);
  }
  return items.map((item) => {
    const translation = rows.get(item.id);
    if (!translation) return fallback(item);
    const source = translation.exercises;
    if (!source || source.status !== "Published") return fallback(item);
    const revision = getSourceRevision(item);
    if (databaseIds.includes(item.id) && revision && revision !== getExerciseContentHash(source)) return fallback(item);
    const localized = applyExerciseTranslation(source, translation, locale);
    if (localized === source) return fallback(item);
    return {
      ...item,
      name: localized.name,
      isTranslationFallback: false,
      ...("description" in item ? { description: localized.description } : {}),
      ...("steps" in item ? { steps: localized.steps } : {}),
    };
  });
}

export class TranslationWriteError extends Error {
  constructor(public readonly code: WorkspaceMessageKey) { super(code); }
}

export async function saveExerciseTranslation(translation: ExerciseTranslation, expectedUpdatedAt: string | null) {
  const { supabase } = await requireAdmin().catch(() => { throw new TranslationWriteError("translationAccessDenied"); });
  if (!["draft", "reviewed"].includes(translation.translation_status)
    || (expectedUpdatedAt !== null && (typeof expectedUpdatedAt !== "string" || !Number.isFinite(Date.parse(expectedUpdatedAt))))) {
    throw new TranslationWriteError("translationInvalid");
  }
  const { data: source, error: sourceError } = await supabase.from("exercises")
    .select("id,name,description,steps").eq("id", translation.exercise_id).maybeSingle();
  if (sourceError) throw new TranslationWriteError("translationSaveFailed");
  if (!source) throw new TranslationWriteError("translationNotFound");
  if (translation.source_hash !== getExerciseContentHash(source)) throw new TranslationWriteError("translationSourceChanged");
  // Only the server assigns the approval time.
  const reviewedAt = translation.translation_status === "reviewed" ? new Date().toISOString() : null;
  translation = { ...translation, reviewed_at: reviewedAt };
  const errors = validateExerciseTranslation(translation, source);
  if (errors.length) throw new TranslationWriteError("translationInvalid");
  // Explicit allowlist: a caller cannot inject timestamps or fields belonging to exercises.
  const values = {
    exercise_id: translation.exercise_id,
    locale: translation.locale,
    source_locale: translation.source_locale,
    source_hash: translation.source_hash,
    name: translation.name,
    description: translation.description,
    steps: translation.steps,
    translation_status: translation.translation_status,
    reviewed_at: reviewedAt,
  };
  // Compare-and-swap prevents two open editors from silently overwriting one another.
  // Insert (rather than upsert) also detects a translation created after this page loaded.
  const query = expectedUpdatedAt === null
    ? supabase.from("exercise_translations").insert(values)
    : supabase.from("exercise_translations").update(values)
      .eq("exercise_id", translation.exercise_id).eq("locale", translation.locale).eq("updated_at", expectedUpdatedAt);
  const { data, error } = await query.select("updated_at").maybeSingle();
  if (error) {
    if (error.code === "23505") throw new TranslationWriteError("translationConflict");
    if (error.code === "23503") throw new TranslationWriteError("translationNotFound");
    if (error.code === "23514") throw new TranslationWriteError(error.message?.includes("Source content changed") ? "translationSourceChanged" : "translationInvalid");
    throw new TranslationWriteError("translationSaveFailed");
  }
  if (!data) throw new TranslationWriteError("translationConflict");
  invalidateExerciseContent();
  return { updatedAt: data.updated_at as string };
}
