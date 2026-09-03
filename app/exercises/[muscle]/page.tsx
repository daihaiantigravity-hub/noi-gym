import ExerciseLibrary from "@/components/ExerciseLibrary";
import { listPublishedExercises } from "@/lib/exercises/repository";
import { getLocalPublicExercises } from "@/lib/exercises/source";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { PublicExercise } from "@/lib/exercises/types";

export default async function ExercisesPage({
  params,
}: {
  params: Promise<{ muscle: string }>;
}) {
  const { muscle } = await params;
  let databaseExercises: PublicExercise[] = [];
  if (isSupabaseConfigured()) {
    try {
      databaseExercises = await listPublishedExercises(muscle);
    } catch {
      databaseExercises = [];
    }
  }
  const exercises = databaseExercises.length > 0 ? databaseExercises : getLocalPublicExercises(muscle);

  return <ExerciseLibrary exercises={exercises} muscle={muscle} />;
}
