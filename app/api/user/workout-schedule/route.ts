import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isValidWorkoutSchedule, normalizeWorkoutSchedule } from "@/lib/workout-schedule";
import { AuthenticationRequiredError, requireUser } from "@/lib/user-auth";

const responseHeaders = { "Cache-Control": "private, no-store" };

function errorResponse(error: unknown) {
  const status = error instanceof AuthenticationRequiredError ? 401 : 500;
  if (status === 500) console.error("Unable to access the workout schedule API.", error);
  const message = status === 401 ? "You need to sign in to manage your workout schedule." : "Unable to access your workout schedule.";
  return NextResponse.json({ error: message }, { status, headers: responseHeaders });
}

export async function GET() {
  try {
    const { user, supabase } = await requireUser();
    const { data, error } = await supabase
      .from("user_weekly_workout_schedules")
      .select("weekday, muscle_groups")
      .eq("user_id", user.id)
      .order("weekday", { ascending: true });
    if (error) throw new Error(error.message);
    const schedule = data?.length
      ? normalizeWorkoutSchedule(data as Array<{ weekday: number; muscle_groups: string[] }>)
      : null;
    return NextResponse.json({ schedule }, { headers: responseHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => null) as { schedule?: unknown } | null;
    if (!body || !isValidWorkoutSchedule(body.schedule)) {
      return NextResponse.json({ error: "Invalid workout schedule." }, { status: 400, headers: responseHeaders });
    }

    const { user, supabase } = await requireUser();
    const rows = body.schedule.map((day) => ({
      user_id: user.id,
      weekday: day.weekday,
      muscle_groups: day.muscleGroups,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase
      .from("user_weekly_workout_schedules")
      .upsert(rows, { onConflict: "user_id,weekday" });
    if (error) throw new Error(error.message);

    revalidatePath("/");
    revalidatePath("/schedule/edit");
    return NextResponse.json({ saved: true }, { headers: responseHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}
