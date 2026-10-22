"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { createExercise, deleteExercise, updateExercise, upsertExercises } from "@/lib/exercises/repository";
import { normalizeSourcePayload } from "@/lib/exercises/source";
import { parseExercisePayload } from "@/lib/exercises/validation";

export type ExerciseActionState = {
  error?: string;
  success?: string;
};

function getActionError(error: unknown) {
  return error instanceof Error ? error.message : "An error occurred. Please try again.";
}

export async function saveExerciseAction(_previousState: ExerciseActionState, formData: FormData): Promise<ExerciseActionState> {
  const payload = formData.get("payload");
  if (typeof payload !== "string") return { error: "Exercise data was not received" };

  const parsed = parseExercisePayload(payload);
  if (!parsed.success) return { error: parsed.error };

  try {
    await requireAdmin();
    const id = parsed.data.id ?? null;

    if (id) {
      await updateExercise(id, parsed.data);
    } else {
      await createExercise(parsed.data);
    }
  } catch (error) {
    return { error: getActionError(error) };
  }

  revalidatePath("/admin/exercises");
  redirect("/admin/exercises");
}

export async function deleteExerciseAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) throw new Error("Invalid exercise ID");

  await requireAdmin();
  await deleteExercise(id);
  revalidatePath("/admin/exercises");
  redirect("/admin/exercises");
}

export async function importExercisesAction(_previousState: ExerciseActionState, formData: FormData): Promise<ExerciseActionState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Select a JSON file" };
  if (file.size > 5 * 1024 * 1024) return { error: "The JSON file cannot exceed 5 MB" };

  try {
    await requireAdmin();
    const payload = JSON.parse(await file.text()) as unknown;
    const sourceExercises = normalizeSourcePayload(payload);
    if (sourceExercises.length === 0) return { error: "No valid exercise records were found in the JSON file" };

    const count = await upsertExercises(
      sourceExercises.map((exercise) => ({
        ...exercise,
        status: "Draft" as const,
      })) as Parameters<typeof upsertExercises>[0],
    );

    revalidatePath("/admin/exercises");
    return { success: `Imported ${count} exercises as Draft` };
  } catch (error) {
    return { error: getActionError(error) };
  }
}
