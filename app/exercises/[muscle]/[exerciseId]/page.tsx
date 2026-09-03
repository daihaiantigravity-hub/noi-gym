import Link from "next/link";
import { notFound } from "next/navigation";
import exerciseData from "@/data/musclewiki-exercises-collected.json";
import ExerciseDetailMedia from "@/components/ExerciseDetailMedia";
import type { MuscleWikiExercise } from "@/lib/musclewiki";

const collectedExercises = exerciseData.results as MuscleWikiExercise[];

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

function normalizeDifficulty(difficulty: string | undefined) {
  const normalizedDifficulty = difficulty?.toLowerCase();

  if (normalizedDifficulty === "advanced") return "Advanced";
  if (normalizedDifficulty === "intermediate") return "Intermediate";
  return "Beginner";
}

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ muscle: string; exerciseId: string }>;
}) {
  const { muscle, exerciseId } = await params;
  const exercise = collectedExercises.find((item) => item.id === Number(exerciseId));

  if (!exercise) notFound();

  const steps = exercise.steps?.filter(Boolean) ?? [];
  const imageCount = Math.max(
    exercise.videos?.filter((video) => video.gender === "male" && Boolean(video.og_image)).length ?? 0,
    1,
  );

  return (
    <main aria-label={`${exercise.name} details`} className="exercise-detail-page">
      <header className="exercise-detail-topbar">
        <Link aria-label={`Quay lại ${formatMuscleName(muscle)}`} className="exercise-detail-topbar__icon" href={`/exercises/${muscle}`}>
          <svg aria-hidden="true" fill="none" height="28" viewBox="0 0 24 24" width="28">
            <path d="m15 18-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          </svg>
        </Link>
        <button aria-label="Thêm vào bài tập yêu thích" className="exercise-detail-topbar__icon" type="button">
          <svg aria-hidden="true" fill="none" height="27" viewBox="0 0 24 24" width="27">
            <path d="M20.8 8.7c0 5.1-8.8 10.1-8.8 10.1S3.2 13.8 3.2 8.7A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
          </svg>
        </button>
      </header>

      <ExerciseDetailMedia imageCount={imageCount} title={exercise.name} />

      <section className="exercise-detail-copy">
        <div className="exercise-detail-copy__heading">
          <h1>{exercise.name}</h1>
          <span>{normalizeDifficulty(exercise.difficulty)} · {steps.length} steps</span>
        </div>
        <p>Hãy thử bài tập {exercise.name} hàng ngày để duy trì sức khỏe và hoàn thành đúng kỹ thuật.</p>
      </section>

      <section aria-labelledby="exercise-instructions-title" className="exercise-detail-instructions">
        <h2 id="exercise-instructions-title">Các bước tập</h2>
        {steps.length > 0 ? (
          <ol>
            {steps.map((step, index) => (
              <li key={`${exercise.id}-${index}`}>
                <span>{index + 1}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p>Chưa có hướng dẫn cho bài tập này.</p>
        )}
      </section>
    </main>
  );
}
