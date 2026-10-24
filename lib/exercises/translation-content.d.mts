export type ExerciseTextContent = { name: string; description: string; steps: string[] };
export type ExerciseTranslation = ExerciseTextContent & {
  exercise_id: string;
  locale: "en" | "vi";
  source_locale: "en" | "vi";
  source_hash: string;
  translation_status: "draft" | "reviewed" | "stale";
  reviewed_at: string | null;
};
export const TRANSLATION_LOCALES: readonly ["en", "vi"];
export const TRANSLATION_STATUSES: readonly ["draft", "reviewed", "stale"];
export function getExerciseContentHash(content: ExerciseTextContent): string;
/** A heuristic for inventory triage, not confirmation of a source's language. */
export function getSourceLocale(content: ExerciseTextContent): "en" | "vi";
export function validateExerciseTranslation(translation: ExerciseTranslation, source: ExerciseTextContent & { id: string }): string[];
export function applyExerciseTranslation<T extends ExerciseTextContent & { id: string }>(exercise: T, translation: ExerciseTranslation | undefined, locale: "en" | "vi"): T;
