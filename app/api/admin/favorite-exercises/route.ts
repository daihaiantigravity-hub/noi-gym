import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sourceKeyPattern = /^source-(\d+)$/;

type ExerciseKeyRow = {
  id: string;
  source: string;
  source_id: number | null;
  status: string;
};

type FavoriteRow = {
  exercise_id: string;
  exercises: ExerciseKeyRow | ExerciseKeyRow[] | null;
};

function exerciseKeys(exercise: Pick<ExerciseKeyRow, "id" | "source" | "source_id">) {
  const keys = [exercise.id];
  if (exercise.source === "musclewiki" && exercise.source_id) keys.push(`source-${exercise.source_id}`);
  return keys;
}

function favoriteKeys(row: FavoriteRow) {
  const relation = Array.isArray(row.exercises) ? row.exercises[0] : row.exercises;
  return relation ? exerciseKeys(relation) : [row.exercise_id];
}

async function resolvePublishedExercise(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  exerciseKey: string,
) {
  let query = supabase.from("exercises").select("id, source, source_id, status").eq("status", "Published");
  const sourceMatch = sourceKeyPattern.exec(exerciseKey);

  if (uuidPattern.test(exerciseKey)) {
    query = query.eq("id", exerciseKey);
  } else if (sourceMatch) {
    query = query.eq("source", "musclewiki").eq("source_id", Number(sourceMatch[1]));
  } else {
    throw new Error("ID bài tập không hợp lệ");
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Không tìm thấy bài tập đã xuất bản");
  return data as ExerciseKeyRow;
}

async function readExerciseKey(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new Error("Dữ liệu yêu cầu không hợp lệ");
  }

  const exerciseId = body && typeof body === "object" && "exerciseId" in body
    ? String((body as { exerciseId?: unknown }).exerciseId ?? "").trim()
    : "";
  if (!exerciseId) throw new Error("Thiếu ID bài tập");
  return exerciseId;
}

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
    const { user, supabase } = await requireAdmin();
    const { data, error } = await supabase
      .from("user_favorite_exercises")
      .select("exercise_id, exercises!inner(id, source, source_id, status)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const exerciseIds = [...new Set(((data ?? []) as unknown as FavoriteRow[]).flatMap(favoriteKeys))];
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
      .from("user_favorite_exercises")
      .upsert({ user_id: user.id, exercise_id: exercise.id }, { onConflict: "user_id,exercise_id", ignoreDuplicates: true });
    if (error) throw new Error(error.message);

    revalidatePath("/admin/favorites");
    return NextResponse.json({ exerciseIds: exerciseKeys(exercise), saved: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const exerciseKey = await readExerciseKey(request);
    const { user, supabase } = await requireAdmin();
    const exercise = await resolvePublishedExercise(supabase, exerciseKey);
    const { error } = await supabase
      .from("user_favorite_exercises")
      .delete()
      .eq("user_id", user.id)
      .eq("exercise_id", exercise.id);
    if (error) throw new Error(error.message);

    revalidatePath("/admin/favorites");
    return NextResponse.json({ exerciseIds: exerciseKeys(exercise), saved: false });
  } catch (error) {
    return errorResponse(error);
  }
}
