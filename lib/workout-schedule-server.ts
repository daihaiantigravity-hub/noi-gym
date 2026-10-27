import "server-only";

import type { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeWorkoutSchedule, type WorkoutScheduleDay } from "./workout-schedule";

type UserSupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export async function getUserWorkoutSchedule(supabase: UserSupabaseClient, userId: string): Promise<WorkoutScheduleDay[] | null> {
  const { data, error } = await supabase
    .from("user_weekly_workout_schedules")
    .select("weekday, muscle_groups")
    .eq("user_id", userId)
    .order("weekday", { ascending: true });
  if (error) throw new Error(error.message);
  if (!data?.length) return null;

  return normalizeWorkoutSchedule(data as Array<{ weekday: number; muscle_groups: string[] }>);
}
