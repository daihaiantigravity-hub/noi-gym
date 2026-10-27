import { redirect } from "next/navigation";
import WorkoutScheduleEditor from "@/components/WorkoutScheduleEditor";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/user-auth";
import { createDefaultWorkoutSchedule } from "@/lib/workout-schedule";
import { getUserWorkoutSchedule } from "@/lib/workout-schedule-server";

export default async function EditWorkoutSchedulePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/google?next=/schedule/edit");

  const supabase = await createSupabaseServerClient();
  let schedule = createDefaultWorkoutSchedule();
  let loadError = false;
  try {
    schedule = await getUserWorkoutSchedule(supabase, user.id) ?? schedule;
  } catch (error) {
    console.error("Unable to load the workout schedule editor.", error);
    loadError = true;
  }

  return <WorkoutScheduleEditor initialSchedule={schedule} initialLoadError={loadError} />;
}
