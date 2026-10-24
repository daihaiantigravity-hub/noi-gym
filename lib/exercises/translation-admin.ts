import "server-only";

import { requireAdmin } from "@/lib/admin-auth";
import type { AppLanguage } from "@/lib/language";
import { getExerciseContentHash, getSourceLocale } from "./translation-content.mjs";
import { buildTranslationOverview, getTranslationStatus, type TranslationRecord, type TranslationSource } from "./translation-overview";

const sourceColumns = "id,name,description,steps,category,status";
const translationColumns = "exercise_id,locale,name,description,steps,source_locale,source_hash,translation_status,reviewed_at,updated_at";

export async function getAdminTranslationOverview(filters: Parameters<typeof buildTranslationOverview>[2]) {
  const { supabase } = await requireAdmin();
  async function sources() {
    const rows: TranslationSource[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await supabase.from("exercises").select(sourceColumns).order("id").range(offset, offset + 499);
      if (error) throw new Error("Unable to load exercise sources");
      rows.push(...data as TranslationSource[]);
      if (data.length < 500) return rows;
    }
  }
  async function translations() {
    const rows: TranslationRecord[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await supabase.from("exercise_translations").select(translationColumns)
        .eq("locale", filters.locale).order("exercise_id").range(offset, offset + 499);
      if (error) throw new Error("Unable to load exercise translations");
      rows.push(...data as TranslationRecord[]);
      if (data.length < 500) return rows;
    }
  }
  const [sourceRows, translationRows] = await Promise.all([sources(), translations()]);
  return buildTranslationOverview(sourceRows, translationRows, filters);
}

export async function getAdminTranslationEditor(id: string, locale: AppLanguage) {
  const { supabase } = await requireAdmin();
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) return null;
  const [sourceResult, translationResult] = await Promise.all([
    supabase.from("exercises").select(sourceColumns).eq("id", id).maybeSingle(),
    supabase.from("exercise_translations").select(translationColumns).eq("exercise_id", id).eq("locale", locale).maybeSingle(),
  ]);
  if (sourceResult.error || translationResult.error) throw new Error("Unable to load exercise translation");
  if (!sourceResult.data) return null;
  const source = sourceResult.data as TranslationSource;
  const translation = translationResult.data as TranslationRecord | null;
  return { source, translation, locale, sourceHash: getExerciseContentHash(source), sourceLocale: getSourceLocale(source), status: getTranslationStatus(source, translation) };
}
