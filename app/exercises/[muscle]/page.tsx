import ExerciseLibrary from "@/components/ExerciseLibrary";
import { paginate, parsePage, PUBLIC_EXERCISES_PAGE_SIZE } from "@/lib/exercises/pagination";
import { listPublishedExercises, listPublishedExercisesByTarget } from "@/lib/exercises/repository";
import { getLocalPublicExercises } from "@/lib/exercises/source";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getAdvancedRoute, getAdvancedTarget, isAdvancedSlugConflict } from "@/lib/exercises/targets";
import type { PublicExercisePage } from "@/lib/exercises/types";

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
  const page = parsePage(queryParams.page);
  const advancedTarget = getAdvancedTarget(muscle);
  const isAdvancedView = Boolean(advancedTarget && (!isAdvancedSlugConflict(muscle) || view === "advanced"));
  let databasePage: PublicExercisePage | null = null;
  if (isSupabaseConfigured()) {
    try {
      databasePage = isAdvancedView && advancedTarget
        ? await listPublishedExercisesByTarget("advanced", advancedTarget.slug, { page, pageSize: PUBLIC_EXERCISES_PAGE_SIZE })
        : await listPublishedExercises(muscle, { page, pageSize: PUBLIC_EXERCISES_PAGE_SIZE });
    } catch {
      databasePage = null;
    }
  }
  const localExercises = isAdvancedView ? [] : getLocalPublicExercises(muscle);
  const localPage = paginate(localExercises, page, PUBLIC_EXERCISES_PAGE_SIZE);
  const pageData = databasePage && (databasePage.total > 0 || localExercises.length === 0) ? databasePage : localPage;

  return <ExerciseLibrary exercises={pageData.items} muscle={muscle} page={pageData.page} pageSize={pageData.pageSize} routePath={isAdvancedView ? getAdvancedRoute(muscle) : `/exercises/${muscle}`} targetLabel={isAdvancedView ? advancedTarget?.label : undefined} total={pageData.total} />;
}
