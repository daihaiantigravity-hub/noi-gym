import { createHash } from "node:crypto";

export const TRANSLATION_LOCALES = ["en", "vi"];
export const TRANSLATION_STATUSES = ["draft", "reviewed", "stale"];

// Length-prefix UTF-8 values so punctuation, delimiters and Unicode remain unambiguous.
// Keep this identical to public.exercise_content_hash in the migration.
export function getExerciseContentHash(content) {
  const values = [content.name ?? "", content.description ?? "", ...(content.steps ?? [])];
  const input = values.map((value) => `${Buffer.byteLength(value, "utf8")}:${value}`).join("");
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export function getSourceLocale(content) {
  const text = [content.name, content.description, ...(content.steps ?? [])].filter(Boolean).join(" ");
  return /[\u0102\u0103\u0110\u0111\u0128\u0129\u0168\u0169\u01a0\u01a1\u01af\u01b0\u1ea0-\u1ef9]/u.test(text) ? "vi" : "en";
}

export function validateExerciseTranslation(translation, source) {
  const errors = [];
  if (translation.exercise_id !== source.id) errors.push("Exercise ID does not match the source");
  if (!TRANSLATION_LOCALES.includes(translation.locale)) errors.push("Unsupported translation locale");
  if (!TRANSLATION_LOCALES.includes(translation.source_locale)) errors.push("Unsupported source locale");
  if (!TRANSLATION_STATUSES.includes(translation.translation_status)) errors.push("Invalid translation status");
  if (typeof translation.name !== "string" || !translation.name.trim() || translation.name.length > 200) errors.push("A name of 1–200 characters is required");
  if (typeof translation.description !== "string" || translation.description.length > 2000) errors.push("Description must be at most 2000 characters");
  if (!Array.isArray(translation.steps) || translation.steps.some((step) => typeof step !== "string" || !step.trim() || step.length > 2000)) errors.push("Steps must be nonempty strings of at most 2000 characters");
  if (translation.source_hash !== getExerciseContentHash(source)) errors.push("Source content changed; export and translate the current version");
  if (translation.translation_status === "reviewed") {
    if (!translation.steps?.length || translation.steps.length !== source.steps?.filter((step) => step.trim()).length) errors.push("Reviewed instructions must preserve the source step count");
    if (source.description?.trim() && (typeof translation.description !== "string" || !translation.description.trim())) errors.push("The source description needs a translation");
    if (typeof translation.reviewed_at !== "string" || !Number.isFinite(Date.parse(translation.reviewed_at))) errors.push("A valid review timestamp is required");
  }
  return errors;
}

export function applyExerciseTranslation(exercise, translation, locale) {
  if (!translation || translation.locale !== locale || translation.translation_status !== "reviewed") return exercise;
  const source = { ...exercise, id: translation.exercise_id };
  if (exercise.id !== translation.exercise_id || validateExerciseTranslation(translation, source).length) return exercise;
  return { ...exercise, name: translation.name, description: translation.description, steps: [...translation.steps] };
}
