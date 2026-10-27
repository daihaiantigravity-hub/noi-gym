import type { User } from "@supabase/supabase-js";
import HomePage from "@/components/HomePage";
import type { SessionResponse } from "@/components/auth/UserAuthButton";
import { isAdminUser } from "@/lib/admin-auth";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getUserWorkoutSchedule } from "@/lib/workout-schedule-server";
import type { WorkoutScheduleDay } from "@/lib/workout-schedule";

function getSessionResponse(user: User | null): SessionResponse {
  if (!user) return { user: null, isAdmin: false };

  const metadata = user.user_metadata ?? {};
  const name = typeof metadata.full_name === "string"
    ? metadata.full_name
    : typeof metadata.name === "string"
      ? metadata.name
      : user.email?.split("@")[0] ?? "User";
  const avatarUrl = typeof metadata.avatar_url === "string"
    ? metadata.avatar_url
    : typeof metadata.picture === "string"
      ? metadata.picture
      : null;

  return {
    user: { id: user.id, email: user.email ?? "", name, avatarUrl },
    isAdmin: isAdminUser(user),
  };
}

async function getInitialHomeData(): Promise<{ initialAuthSession: SessionResponse; initialWorkoutSchedule: WorkoutScheduleDay[] | null }> {
  if (!isSupabaseConfigured()) return { initialAuthSession: { user: null, isAdmin: false }, initialWorkoutSchedule: null };

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user ?? null;
  let initialWorkoutSchedule: WorkoutScheduleDay[] | null = null;
  if (user) {
    try {
      initialWorkoutSchedule = await getUserWorkoutSchedule(supabase, user.id);
    } catch (error) {
      // Until the additive migration is applied, continue to show the public template.
      console.error("Unable to load the signed-in user's workout schedule.", error);
    }
  }

  return { initialAuthSession: getSessionResponse(user), initialWorkoutSchedule };
}

export default async function Home() {
  const { initialAuthSession, initialWorkoutSchedule } = await getInitialHomeData();
  return <HomePage initialAuthSession={initialAuthSession} initialWorkoutSchedule={initialWorkoutSchedule} />;
}
