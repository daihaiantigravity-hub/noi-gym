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
    return NextResponse.json({ error: "Invalid source ID" }, { status: 400 });
  }

  const exercise = getSourceExerciseById(sourceId);
  return exercise ? NextResponse.json(exercise) : NextResponse.json({ error: "Source exercise not found" }, { status: 404 });
}
