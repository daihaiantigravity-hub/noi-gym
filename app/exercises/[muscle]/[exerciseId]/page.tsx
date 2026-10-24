import Link from "next/link";
import { notFound } from "next/navigation";
import ExerciseDetailMedia from "@/components/ExerciseDetailMedia";
import ExerciseDetailSaveButton from "@/components/ExerciseDetailSaveButton";
import ExerciseLibrary from "@/components/ExerciseLibrary";
import { paginate, parsePage, PUBLIC_EXERCISES_PAGE_SIZE } from "@/lib/exercises/pagination";
import { getPublishedExerciseByKey, listPublishedExercises, listPublishedExercisesByTarget } from "@/lib/exercises/repository";
import { getLocalPublicExerciseById, getLocalPublicExercises } from "@/lib/exercises/source";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getAdvancedRoute, getAdvancedTarget, getExerciseCategoryBySlug, getJointTarget, isAdvancedSlugConflict } from "@/lib/exercises/targets";
import { parseExerciseGender, withExerciseGender } from "@/lib/exercises/gender";
import type { PublicExercise, PublicExercisePage } from "@/lib/exercises/types";
import { getAppLanguage, isLocalizationEnabled } from "@/lib/i18n/server";
import LanguageToggle from "@/components/LanguageToggle";
import { getMessages, translate } from "@/lib/i18n/messages";
import { getMuscleLabel } from "@/lib/i18n/labels";
import { localizeExercises } from "@/lib/exercises/translations";

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
  const language = await getAppLanguage();
  const messages = getMessages(language);
  const queryParams = await searchParams;
  const view = Array.isArray(queryParams.view) ? queryParams.view[0] : queryParams.view;
  const gender = parseExerciseGender(queryParams.gender);
  const page = parsePage(queryParams.page);
  const category = getExerciseCategoryBySlug(exerciseId);
  const advancedTarget = getAdvancedTarget(muscle);
  const jointTarget = getJointTarget(muscle);
  const isJointRoute = Boolean(jointTarget && exerciseId === jointTarget.pathSuffix && view !== "category");
  const isAdvancedView = Boolean(advancedTarget && (!isAdvancedSlugConflict(muscle) || view === "advanced"));

  if (category || isJointRoute) {
    let databasePage: PublicExercisePage | null = null;
    if (isSupabaseConfigured()) {
      try {
        databasePage = isJointRoute && jointTarget
          ? await listPublishedExercisesByTarget("joint", jointTarget.slug, { gender, page, pageSize: PUBLIC_EXERCISES_PAGE_SIZE })
          : isAdvancedView && advancedTarget
            ? await listPublishedExercisesByTarget("advanced", advancedTarget.slug, { category, gender, page, pageSize: PUBLIC_EXERCISES_PAGE_SIZE })
            : await listPublishedExercises(muscle, { category, gender, page, pageSize: PUBLIC_EXERCISES_PAGE_SIZE });
      } catch {
        databasePage = null;
      }
    }

    const localExercises = gender !== "female" && !jointTarget && !isAdvancedView ? getLocalPublicExercises(muscle, { category }) : [];
    const localPage = paginate(localExercises, page, PUBLIC_EXERCISES_PAGE_SIZE);
    const pageData = databasePage && (databasePage.total > 0 || localExercises.length === 0)
      ? databasePage
      : { ...localPage, items: await localizeExercises(localPage.items) };
    const routePath = isJointRoute
      ? `/exercises/${muscle}/${exerciseId}`
      : isAdvancedView
        ? getAdvancedRoute(muscle, exerciseId)
        : `/exercises/${muscle}/${exerciseId}${view === "category" ? "?view=category" : ""}`;
    const targetLabel = isJointRoute ? jointTarget?.label : isAdvancedView ? advancedTarget?.label : undefined;
    return <ExerciseLibrary exercises={pageData.items} gender={gender ?? "male"} muscle={muscle} page={pageData.page} pageSize={pageData.pageSize} routePath={withExerciseGender(routePath, gender)} targetLabel={targetLabel} total={pageData.total} />;
  }

  let databaseExercise: PublicExercise | null = null;
  if (isSupabaseConfigured()) {
    try {
      databaseExercise = await getPublishedExerciseByKey(exerciseId, gender);
    } catch {
      databaseExercise = null;
    }
  }
  const localExercise = !databaseExercise && gender !== "female" ? getLocalPublicExerciseById(exerciseId) : null;
  const exercise = databaseExercise ?? (localExercise ? (await localizeExercises([localExercise]))[0] : null);
  if (!exercise) notFound();

  const displayName = getDisplayExerciseName(exercise.name);
  const steps = exercise.steps.filter(Boolean);
  const mediaCount = Math.max(exercise.media.length, 1);
  const from = typeof queryParams.from === "string" && queryParams.from.startsWith("/exercises/") ? queryParams.from : withExerciseGender(`/exercises/${muscle}`, gender);

  return (
    <main aria-label={translate(language, "exerciseDetails", { name: displayName })} className="exercise-detail-page">
      <header className="exercise-detail-topbar">
        <Link aria-label={translate(language, "backToTarget", { name: getMuscleLabel(language, formatMuscleName(muscle)) })} className="exercise-detail-topbar__icon" href={from}>
          <svg aria-hidden="true" fill="none" height="28" viewBox="0 0 24 24" width="28"><path d="m15 18-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>
        </Link>
        {isLocalizationEnabled() ? <div className="exercise-detail-topbar__actions"><LanguageToggle /><ExerciseDetailSaveButton exerciseId={exercise.id} exerciseName={displayName} /></div> : <ExerciseDetailSaveButton exerciseId={exercise.id} exerciseName={displayName} />}
      </header>

      <ExerciseDetailMedia mediaCount={mediaCount} media={exercise.media} title={displayName} />

      <section className="exercise-detail-copy">
        <div className="exercise-detail-copy__heading"><h1>{displayName}</h1></div>
        {exercise.isTranslationFallback && <small>{messages.originalContent}</small>}
      </section>

      <section aria-labelledby="exercise-instructions-title" className="exercise-detail-instructions">
        <h2 id="exercise-instructions-title">{messages.instructions}</h2>
        {steps.length > 0 ? <ol>{steps.map((step, index) => <li key={`${exercise.id}-${index}`}><span>{index + 1}</span><p>{step}</p></li>)}</ol> : <p>{messages.noInstructions}</p>}
      </section>
    </main>
  );
}
