import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin-auth";
import { PUBLIC_EXERCISES_CACHE_TAG } from "@/lib/exercises/cache";
import { exerciseKeys, favoriteKeys, readExerciseKey, resolvePublishedExercise, type FavoriteRelationRow } from "@/lib/exercises/favorite-api";
import { createSupabaseAdminClient, isDatabaseConfigured } from "@/lib/supabase/server";
import { AuthenticationRequiredError, requireUser } from "@/lib/user-auth";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Không thể cập nhật bài tập yêu thích";
  const status = error instanceof AuthenticationRequiredError
    ? 401
    : message.includes("không hợp lệ") || message.includes("Thiếu")
      ? 400
      : message.includes("Không tìm thấy")
        ? 404
        : 500;
  return NextResponse.json({ error: message }, { status });
}

async function setAdminFeatured(userId: string, exerciseId: string, featured: boolean) {
  if (!isDatabaseConfigured()) return;

  const adminClient = createSupabaseAdminClient();
  const operation = featured
    ? adminClient.from("admin_featured_exercises").upsert(
      { exercise_id: exerciseId, featured_by: userId },
      { onConflict: "exercise_id" },
    )
    : adminClient.from("admin_featured_exercises").delete().eq("exercise_id", exerciseId);
  const { error } = await operation;
  if (error) throw new Error(error.message);
}

export async function GET() {
  try {
    const { user, supabase } = await requireUser();
    const { data, error } = await supabase
      .from("user_favorite_exercises")
      .select("exercise_id, exercises!inner(id, source, source_id, status)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const exerciseIds = [...new Set(((data ?? []) as unknown as FavoriteRelationRow[]).flatMap(favoriteKeys))];
    return NextResponse.json({ authenticated: true, userId: user.id, exerciseIds });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const exerciseKey = await readExerciseKey(request);
    const { user, supabase } = await requireUser();
    const exercise = await resolvePublishedExercise(supabase, exerciseKey);
    const { error } = await supabase
      .from("user_favorite_exercises")
      .upsert({ user_id: user.id, exercise_id: exercise.id }, { onConflict: "user_id,exercise_id", ignoreDuplicates: true });
    if (error) throw new Error(error.message);

    if (isAdminUser(user)) await setAdminFeatured(user.id, exercise.id, true);
    revalidatePath("/favorites");
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
    const { user, supabase } = await requireUser();
    const exercise = await resolvePublishedExercise(supabase, exerciseKey);
    const { error } = await supabase
      .from("user_favorite_exercises")
      .delete()
      .eq("user_id", user.id)
      .eq("exercise_id", exercise.id);
    if (error) throw new Error(error.message);

    if (isAdminUser(user)) await setAdminFeatured(user.id, exercise.id, false);
    revalidatePath("/favorites");
    revalidatePath("/admin/favorites");
    revalidateTag(PUBLIC_EXERCISES_CACHE_TAG, { expire: 0 });
    return NextResponse.json({ exerciseIds: exerciseKeys(exercise), saved: false });
  } catch (error) {
    return errorResponse(error);
  }
}
