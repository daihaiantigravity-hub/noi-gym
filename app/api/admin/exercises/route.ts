import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getExerciseStats, listExercises, createExercise } from "@/lib/exercises/repository";
import { parseExercisePayload } from "@/lib/exercises/validation";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Request không hợp lệ";
  const status = message.includes("quyền") || message.includes("Admin") ? 401 : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const params = new URL(request.url).searchParams;
    const page = Math.max(Number(params.get("page") ?? 1) || 1, 1);
    const pageSize = Math.min(Math.max(Number(params.get("pageSize") ?? 20) || 20, 1), 100);
    const status = params.get("status") ?? "";
    const source = params.get("source") ?? "";
    const result = await listExercises({
      page,
      pageSize,
      query: params.get("q") ?? "",
      category: params.get("category") ?? "",
      muscle: params.get("muscle") ?? "",
      status: status as never,
      source: source as never,
    });
    const stats = await getExerciseStats();
    return NextResponse.json({ ...result, stats });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = JSON.stringify(await request.json());
    const parsed = parseExercisePayload(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const exercise = await createExercise(parsed.data);
    revalidatePath("/admin/exercises");
    return NextResponse.json(exercise, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
