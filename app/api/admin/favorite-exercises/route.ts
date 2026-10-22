import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { PUBLIC_EXERCISES_CACHE_TAG } from "@/lib/exercises/cache";
import { exerciseKeys, favoriteKeys, readExerciseKey, resolvePublishedExercise, type FavoriteRelationRow } from "@/lib/exercises/favorite-api";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Không thể cập nhật bài tập yêu thích";
  const status = message.includes("quyền") || message.includes("Admin")
    ? 401
    : message.includes("không hợp lệ") || message.includes("Thiếu")
      ? 400
      : message.includes("Không tìm thấy")
        ? 404
        : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
      .from("admin_featured_exercises")
      .select("exercise_id, exercises!inner(id, source, source_id, status)")
      .order("featured_at", { ascending: false });
    if (error) throw new Error(error.message);

    const exerciseIds = [...new Set(((data ?? []) as unknown as FavoriteRelationRow[]).flatMap(favoriteKeys))];
    return NextResponse.json({ exerciseIds });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const exerciseKey = await readExerciseKey(request);
    const { user, supabase } = await requireAdmin();
    const exercise = await resolvePublishedExercise(supabase, exerciseKey);
    const { error } = await supabase
      .from("admin_featured_exercises")
      .upsert({ featured_by: user.id, exercise_id: exercise.id }, { onConflict: "exercise_id" });
    if (error) throw new Error(error.message);

    revalidatePath("/admin/favorites");
    revalidateTag(PUBLIC_EXERCISES_CACHE_TAG, { expire: 0 });
    return NextResponse.json({ exerciseIds: exerciseKeys(exercise), saved: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const exerciseKey = await readExerciseKey(request);
    const { supabase } = await requireAdmin();
    const exercise = await resolvePublishedExercise(supabase, exerciseKey);
    const { error } = await supabase
      .from("admin_featured_exercises")
      .delete()
      .eq("exercise_id", exercise.id);
    if (error) throw new Error(error.message);

    revalidatePath("/admin/favorites");
    revalidateTag(PUBLIC_EXERCISES_CACHE_TAG, { expire: 0 });
    return NextResponse.json({ exerciseIds: exerciseKeys(exercise), saved: false });
  } catch (error) {
    return errorResponse(error);
  }
}
