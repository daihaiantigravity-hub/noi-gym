import Link from "next/link";
import { notFound } from "next/navigation";
import ExerciseDetailMedia from "@/components/ExerciseDetailMedia";
import ExerciseLibrary from "@/components/ExerciseLibrary";
import { paginate, parsePage, PUBLIC_EXERCISES_PAGE_SIZE } from "@/lib/exercises/pagination";
import { getPublishedExerciseByKey, listPublishedExercises, listPublishedExercisesByTarget } from "@/lib/exercises/repository";
import { getLocalPublicExerciseById, getLocalPublicExercises } from "@/lib/exercises/source";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getAdvancedRoute, getAdvancedTarget, getExerciseCategoryBySlug, getJointTarget, isAdvancedSlugConflict } from "@/lib/exercises/targets";
import type { PublicExercise, PublicExercisePage } from "@/lib/exercises/types";

const muscleNameBySlug: Record<string, string> = {
  abdominals: "Abdominals",
  calves: "Calves",
  chest: "Chest",
  glutes: "Glutes",
  hamstrings: "Hamstrings",
  lats: "Lats",
  lowerback: "Lower back",
  obliques: "Obliques",
  quads: "Quads",
  shoulders: "Shoulders",
  traps: "Traps",
  triceps: "Triceps",
};

function formatMuscleName(muscle: string) {
  return muscleNameBySlug[muscle] ?? muscle.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function getDisplayExerciseName(name: string) {
  const normalizedName = name.trim().replace(/\s+/g, " ");
  return normalizedName.replace(/^(.+?)\s+\1$/iu, "$1");
}

export default async function ExerciseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ muscle: string; exerciseId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { muscle, exerciseId } = await params;
  const queryParams = await searchParams;
  const view = Array.isArray(queryParams.view) ? queryParams.view[0] : queryParams.view;
  const page = parsePage(queryParams.page);
  const category = getExerciseCategoryBySlug(exerciseId);
  const advancedTarget = getAdvancedTarget(muscle);
  const jointTarget = getJointTarget(muscle);
  const isJointRoute = Boolean(jointTarget && exerciseId === jointTarget.pathSuffix);
  const isAdvancedView = Boolean(advancedTarget && (!isAdvancedSlugConflict(muscle) || view === "advanced"));

  if (category || isJointRoute) {
    let databasePage: PublicExercisePage | null = null;
    if (isSupabaseConfigured()) {
      try {
        databasePage = isJointRoute && jointTarget
          ? await listPublishedExercisesByTarget("joint", jointTarget.slug, { page, pageSize: PUBLIC_EXERCISES_PAGE_SIZE })
          : isAdvancedView && advancedTarget
            ? await listPublishedExercisesByTarget("advanced", advancedTarget.slug, { category, page, pageSize: PUBLIC_EXERCISES_PAGE_SIZE })
            : await listPublishedExercises(muscle, { category, page, pageSize: PUBLIC_EXERCISES_PAGE_SIZE });
      } catch {
        databasePage = null;
      }
    }

    const localExercises = !jointTarget && !isAdvancedView ? getLocalPublicExercises(muscle).filter((exercise) => exercise.category === category) : [];
    const localPage = paginate(localExercises, page, PUBLIC_EXERCISES_PAGE_SIZE);
    const pageData = databasePage && (databasePage.total > 0 || localExercises.length === 0) ? databasePage : localPage;
    const routePath = isJointRoute
      ? `/exercises/${muscle}/${exerciseId}`
      : isAdvancedView
        ? getAdvancedRoute(muscle, exerciseId)
        : `/exercises/${muscle}/${exerciseId}`;
    const targetLabel = isJointRoute ? jointTarget?.label : isAdvancedView ? advancedTarget?.label : undefined;
    return <ExerciseLibrary exercises={pageData.items} muscle={muscle} page={pageData.page} pageSize={pageData.pageSize} routePath={routePath} targetLabel={targetLabel} total={pageData.total} />;
  }

  let databaseExercise: PublicExercise | null = null;
  if (isSupabaseConfigured()) {
    try {
      databaseExercise = await getPublishedExerciseByKey(exerciseId);
    } catch {
      databaseExercise = null;
    }
  }
  const exercise = databaseExercise ?? getLocalPublicExerciseById(exerciseId);
  if (!exercise) notFound();

  const displayName = getDisplayExerciseName(exercise.name);
  const steps = exercise.steps.filter(Boolean);
  const mediaCount = Math.max(exercise.media.length, 1);
  const from = typeof queryParams.from === "string" && queryParams.from.startsWith("/exercises/") ? queryParams.from : `/exercises/${muscle}`;

  return (
    <main aria-label={`${displayName} details`} className="exercise-detail-page">
      <header className="exercise-detail-topbar">
        <Link aria-label={`Quay lại ${formatMuscleName(muscle)}`} className="exercise-detail-topbar__icon" href={from}>
          <svg aria-hidden="true" fill="none" height="28" viewBox="0 0 24 24" width="28"><path d="m15 18-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>
        </Link>
        <button aria-label="Thêm vào bài tập yêu thích" className="exercise-detail-topbar__icon" type="button">
          <svg aria-hidden="true" fill="none" height="27" viewBox="0 0 24 24" width="27"><path d="M20.8 8.7c0 5.1-8.8 10.1-8.8 10.1S3.2 13.8 3.2 8.7A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>
        </button>
      </header>

      <ExerciseDetailMedia mediaCount={mediaCount} media={exercise.media} title={displayName} />

      <section className="exercise-detail-copy">
        <div className="exercise-detail-copy__heading"><h1>{displayName}</h1></div>
        <p>{exercise.description || `Hãy thử bài tập ${displayName} hàng ngày để duy trì sức khỏe và hoàn thành đúng kỹ thuật.`}</p>
      </section>

      <section aria-labelledby="exercise-instructions-title" className="exercise-detail-instructions">
        <h2 id="exercise-instructions-title">Các bước tập</h2>
        {steps.length > 0 ? <ol>{steps.map((step, index) => <li key={`${exercise.id}-${index}`}><span>{index + 1}</span><p>{step}</p></li>)}</ol> : <p>Chưa có hướng dẫn cho bài tập này.</p>}
      </section>
    </main>
  );
}
