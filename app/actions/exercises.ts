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
  return error instanceof Error ? error.message : "Đã xảy ra lỗi. Vui lòng thử lại.";
}

export async function saveExerciseAction(_previousState: ExerciseActionState, formData: FormData): Promise<ExerciseActionState> {
  const payload = formData.get("payload");
  if (typeof payload !== "string") return { error: "Không nhận được dữ liệu bài tập" };

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
  if (typeof id !== "string" || !id) throw new Error("ID bài tập không hợp lệ");

  await requireAdmin();
  await deleteExercise(id);
  revalidatePath("/admin/exercises");
  redirect("/admin/exercises");
}

export async function importExercisesAction(_previousState: ExerciseActionState, formData: FormData): Promise<ExerciseActionState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Hãy chọn một file JSON" };
  if (file.size > 5 * 1024 * 1024) return { error: "File JSON không được vượt quá 5MB" };

  try {
    await requireAdmin();
    const payload = JSON.parse(await file.text()) as unknown;
    const sourceExercises = normalizeSourcePayload(payload);
    if (sourceExercises.length === 0) return { error: "Không tìm thấy record bài tập hợp lệ trong JSON" };

    const count = await upsertExercises(
      sourceExercises.map((exercise) => ({
        ...exercise,
        status: "Draft" as const,
      })) as Parameters<typeof upsertExercises>[0],
    );

    revalidatePath("/admin/exercises");
    return { success: `Đã import ${count} bài tập ở trạng thái Draft` };
  } catch (error) {
    return { error: getActionError(error) };
  }
}
