import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { getSourceExerciseById } from "@/lib/exercises/source";
import { isDatabaseConfigured } from "@/lib/supabase/server";

export async function GET(request: Request) {
  if (isDatabaseConfigured() && !(await getAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sourceId = Number(new URL(request.url).searchParams.get("sourceId"));
  if (!Number.isInteger(sourceId) || sourceId <= 0) {
    return NextResponse.json({ error: "Source ID không hợp lệ" }, { status: 400 });
  }

  const exercise = getSourceExerciseById(sourceId);
  return exercise ? NextResponse.json(exercise) : NextResponse.json({ error: "Không tìm thấy bài tập nguồn" }, { status: 404 });
}
