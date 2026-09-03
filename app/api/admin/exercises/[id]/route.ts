import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteExercise, getExercise, updateExercise } from "@/lib/exercises/repository";
import { parseExercisePayload } from "@/lib/exercises/validation";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Request không hợp lệ";
  const status = message.includes("quyền") || message.includes("Admin") ? 401 : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(_request: Request, context: RouteContext<"/api/admin/exercises/[id]">) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const exercise = await getExercise(id);
    return exercise ? NextResponse.json(exercise) : NextResponse.json({ error: "Không tìm thấy bài tập" }, { status: 404 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext<"/api/admin/exercises/[id]">) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const parsed = parseExercisePayload(JSON.stringify(await request.json()));
    if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });
    if (parsed.data.id && parsed.data.id !== id) return NextResponse.json({ error: "ID trong body không khớp URL" }, { status: 400 });

    const exercise = await updateExercise(id, parsed.data);
    if (!exercise) return NextResponse.json({ error: "Không tìm thấy bài tập" }, { status: 404 });
    revalidatePath("/admin/exercises");
    return NextResponse.json(exercise);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext<"/api/admin/exercises/[id]">) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    await deleteExercise(id);
    revalidatePath("/admin/exercises");
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
