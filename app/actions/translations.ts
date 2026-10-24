"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { saveExerciseTranslation, TranslationWriteError } from "@/lib/exercises/translations";
import type { WorkspaceMessageKey } from "@/lib/i18n/workspace-messages";

export type TranslationActionState = {
  error?: WorkspaceMessageKey;
  success?: WorkspaceMessageKey;
  updatedAt?: string;
};

const payloadSchema = z.strictObject({
  exerciseId: z.uuid(),
  locale: z.enum(["en", "vi"]),
  sourceLocale: z.enum(["en", "vi"]),
  sourceHash: z.string().regex(/^[0-9a-f]{64}$/),
  name: z.string().trim().min(1).max(200),
  description: z.string().max(2000),
  steps: z.array(z.string().trim().max(2000)).max(100),
  expectedUpdatedAt: z.string().max(64).refine((value) => Number.isFinite(Date.parse(value))).nullable(),
});

export async function saveTranslationAction(_previousState: TranslationActionState, formData: FormData): Promise<TranslationActionState> {
  const payload = formData.get("payload");
  const status = formData.get("intent");
  if (typeof payload !== "string" || payload.length > 250_000 || (status !== "draft" && status !== "reviewed")) return { error: "translationInvalid" };
  let json: unknown;
  try { json = JSON.parse(payload); } catch { return { error: "translationInvalid" }; }
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) return { error: "translationInvalid" };
  const input = parsed.data;
  const steps = [...input.steps];
  // Partial drafts store a completed prefix; never shift a later instruction into a blank earlier step.
  if (status === "draft") while (steps.length && !steps.at(-1)) steps.pop();
  if (steps.some((step) => !step)) return { error: "translationInvalid" };
  let saved: { updatedAt: string };
  try {
    // The data layer verifies admin access again for every write.
    saved = await saveExerciseTranslation({
      exercise_id: input.exerciseId, locale: input.locale, source_locale: input.sourceLocale,
      source_hash: input.sourceHash, name: input.name, description: input.description, steps,
      translation_status: status, reviewed_at: null,
    }, input.expectedUpdatedAt);
  } catch (error) {
    return { error: error instanceof TranslationWriteError ? error.code : "translationSaveFailed" };
  }
  revalidatePath("/admin/translations");
  revalidatePath(`/admin/translations/${input.exerciseId}`);
  revalidatePath("/exercises/[muscle]", "page");
  revalidatePath("/exercises/[muscle]/[exerciseId]", "page");
  revalidatePath("/favorites");
  return { success: status === "reviewed" ? "translationSavedReviewed" : "translationSavedDraft", updatedAt: saved.updatedAt };
}
