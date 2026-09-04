import Link from "next/link";
import { notFound } from "next/navigation";
import ExerciseDetailMedia from "@/components/ExerciseDetailMedia";
import { getPublishedExerciseByKey } from "@/lib/exercises/repository";
import { getLocalPublicExerciseById } from "@/lib/exercises/source";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { PublicExercise } from "@/lib/exercises/types";

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

export default async function ExerciseDetailPage({ params }: { params: Promise<{ muscle: string; exerciseId: string }> }) {
  const { muscle, exerciseId } = await params;
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

  const steps = exercise.steps.filter(Boolean);
  const mediaCount = Math.max(exercise.media.length, 1);

  return (
    <main aria-label={`${exercise.name} details`} className="exercise-detail-page">
      <header className="exercise-detail-topbar">
        <Link aria-label={`Quay lại ${formatMuscleName(muscle)}`} className="exercise-detail-topbar__icon" href={`/exercises/${muscle}`}>
          <svg aria-hidden="true" fill="none" height="28" viewBox="0 0 24 24" width="28"><path d="m15 18-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>
        </Link>
        <button aria-label="Thêm vào bài tập yêu thích" className="exercise-detail-topbar__icon" type="button">
          <svg aria-hidden="true" fill="none" height="27" viewBox="0 0 24 24" width="27"><path d="M20.8 8.7c0 5.1-8.8 10.1-8.8 10.1S3.2 13.8 3.2 8.7A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>
        </button>
      </header>

      <ExerciseDetailMedia mediaCount={mediaCount} media={exercise.media} title={exercise.name} />

      <section className="exercise-detail-copy">
        <div className="exercise-detail-copy__heading"><h1>{exercise.name}</h1><span>{exercise.difficulty || "Chưa phân loại"} · {steps.length} steps</span></div>
        <p>{exercise.description || `Hãy thử bài tập ${exercise.name} hàng ngày để duy trì sức khỏe và hoàn thành đúng kỹ thuật.`}</p>
      </section>

      <section aria-labelledby="exercise-instructions-title" className="exercise-detail-instructions">
        <h2 id="exercise-instructions-title">Các bước tập</h2>
        {steps.length > 0 ? <ol>{steps.map((step, index) => <li key={`${exercise.id}-${index}`}><span>{index + 1}</span><p>{step}</p></li>)}</ol> : <p>Chưa có hướng dẫn cho bài tập này.</p>}
      </section>
    </main>
  );
}
