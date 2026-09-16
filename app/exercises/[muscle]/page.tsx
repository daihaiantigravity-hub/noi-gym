import ExerciseLibrary from "@/components/ExerciseLibrary";
import { listPublishedExercises, listPublishedExercisesByTarget } from "@/lib/exercises/repository";
import { getLocalPublicExercises } from "@/lib/exercises/source";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getAdvancedRoute, getAdvancedTarget, isAdvancedSlugConflict } from "@/lib/exercises/targets";
import type { PublicExercise } from "@/lib/exercises/types";

export default async function ExercisesPage({
  params,
  searchParams,
}: {
  params: Promise<{ muscle: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { muscle } = await params;
  const queryParams = await searchParams;
  const view = Array.isArray(queryParams.view) ? queryParams.view[0] : queryParams.view;
  const advancedTarget = getAdvancedTarget(muscle);
  const isAdvancedView = Boolean(advancedTarget && (!isAdvancedSlugConflict(muscle) || view === "advanced"));
  let databaseExercises: PublicExercise[] = [];
  if (isSupabaseConfigured()) {
    try {
      databaseExercises = isAdvancedView && advancedTarget
        ? await listPublishedExercisesByTarget("advanced", advancedTarget.slug)
        : await listPublishedExercises(muscle);
    } catch {
      databaseExercises = [];
    }
  }
  const exercises = databaseExercises.length > 0 ? databaseExercises : isAdvancedView ? [] : getLocalPublicExercises(muscle);

  return <ExerciseLibrary exercises={exercises} muscle={muscle} routePath={isAdvancedView ? getAdvancedRoute(muscle) : `/exercises/${muscle}`} targetLabel={isAdvancedView ? advancedTarget?.label : undefined} />;
}
