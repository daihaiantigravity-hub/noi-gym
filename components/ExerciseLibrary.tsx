"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, type PointerEvent, type WheelEvent } from "react";
import exerciseData from "@/data/musclewiki-exercises-collected.json";
import type { MuscleWikiExercise } from "@/lib/musclewiki";

type Exercise = {
  id: number;
  title: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  images: string[];
  steps: string[];
};

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

const collectedExercises = exerciseData.results as MuscleWikiExercise[];

const fakeExerciseThumbnails = [
  { variant: "full-body", kicker: "10 MINUTE MIRACLE", hero: "FULL BODY", sub: "WORKOUT" },
  { variant: "muscle", kicker: "10 MINUTE MIRACLE", hero: "MUSCLE", sub: "WORKOUT" },
  { variant: "home-yoga", kicker: "AT HOME", hero: "FLOW", sub: "YOGA" },
  { variant: "outdoor", kicker: "MOVE EVERY DAY", hero: "MOVE", sub: "OUTDOOR" },
  { variant: "zumba", kicker: "DANCE FITNESS", hero: "ZUMBA®", sub: "LET'S MOVE" },
  { variant: "dance", kicker: "DANCE FITNESS", hero: "DANCE", sub: "TOGETHER" },
] as const;

function formatMuscleName(muscle: string) {
  return muscleNameBySlug[muscle] ?? muscle.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function normalizeDifficulty(difficulty: string | undefined): Exercise["level"] {
  const normalizedDifficulty = difficulty?.toLowerCase();

  if (normalizedDifficulty === "advanced") return "Advanced";
  if (normalizedDifficulty === "intermediate") return "Intermediate";
  return "Beginner";
}

function mapLocalExercise(exercise: MuscleWikiExercise, isMale: boolean): Exercise {
  const preferredGender = isMale ? "male" : "female";
  const images = Array.from(
    new Set(
      (exercise.videos ?? [])
        .filter((video) => video.gender === preferredGender)
        .map((video) => video.og_image)
        .filter((image): image is string => Boolean(image)),
    ),
  );

  return {
    id: exercise.id,
    title: exercise.name,
    level: normalizeDifficulty(exercise.difficulty),
    images,
    steps: exercise.steps?.filter(Boolean) ?? [],
  };
}

function ExerciseCard({ exercise, muscle }: { exercise: Exercise; muscle: string }) {
  const imageCount = Math.max(exercise.images.length, 1);
  const dragState = useRef<{ pointerId: number; startX: number; startScrollLeft: number } | null>(null);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0 || event.currentTarget.scrollWidth <= event.currentTarget.clientWidth) return;

    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: event.currentTarget.scrollLeft,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.classList.add("exercise-library-showcase__media-track--dragging");
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    event.preventDefault();
    event.currentTarget.scrollLeft = drag.startScrollLeft - (event.clientX - drag.startX);
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (!dragState.current || dragState.current.pointerId !== event.pointerId) return;

    dragState.current = null;
    event.currentTarget.classList.remove("exercise-library-showcase__media-track--dragging");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    const track = event.currentTarget;
    const maxScrollLeft = track.scrollWidth - track.clientWidth;
    if (maxScrollLeft <= 0 || event.deltaY === 0) return;

    const nextScrollLeft = Math.max(0, Math.min(maxScrollLeft, track.scrollLeft + event.deltaY));
    if (nextScrollLeft === track.scrollLeft) return;

    event.preventDefault();
    track.scrollLeft = nextScrollLeft;
  }

  return (
    <article className="health-card exercise-library-exercise-card">
      <header className="exercise-library-exercise-card__header">
        <h2>{exercise.title}</h2>
        <Link
          aria-label={`Xem chi tiết ${exercise.title}`}
          className="workout-showcase__arrow exercise-library-exercise-card__detail"
          href={`/exercises/${muscle}/${exercise.id}`}
        >
          ›
        </Link>
      </header>
      <div className="exercise-library-showcase__media">
        <span className={`exercise-library-showcase__level exercise-library-showcase__level--${exercise.level.toLowerCase()}`}>
          {exercise.level}
        </span>
        <div
          aria-label={`${exercise.title} demonstration images`}
          className="exercise-library-showcase__media-track"
          onPointerCancel={handlePointerEnd}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onWheel={handleWheel}
          role="region"
          tabIndex={imageCount > 1 ? 0 : -1}
        >
          {Array.from({ length: imageCount }, (_, imageIndex) => {
            const thumbnail = fakeExerciseThumbnails[(exercise.id + imageIndex) % fakeExerciseThumbnails.length];

            return (
            <div
              aria-label={`${exercise.title} view ${imageIndex + 1}`}
              className={`workout-thumbnail workout-thumbnail--${thumbnail.variant} exercise-library-showcase__fake-image`}
              key={`${exercise.id}-${imageIndex}`}
              role="img"
            >
              <span className="workout-thumbnail__kicker">{thumbnail.kicker}</span>
              <strong className="workout-thumbnail__hero">{thumbnail.hero}</strong>
              <span className="workout-thumbnail__sub">{thumbnail.sub}</span>
              <span aria-hidden="true" className="workout-thumbnail__person" />
              <span aria-hidden="true" className="workout-thumbnail__play" />
            </div>
            );
          })}
        </div>
      </div>
      <p className="exercise-library-exercise-card__summary">{exercise.level} · {exercise.steps.length} steps</p>
      {exercise.steps.length > 0 ? (
        <ol aria-label={`${exercise.title} instructions`} className="exercise-library-exercise-card__steps">
          {exercise.steps.map((step, index) => (
            <li key={`${exercise.id}-step-${index}`}>
              <span>{index + 1}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="exercise-library-exercise-card__steps-empty">Instructions are not available for this exercise.</p>
      )}
    </article>
  );
}

export default function ExerciseLibrary({ muscle }: { muscle: string }) {
  const router = useRouter();
  const muscleName = formatMuscleName(muscle);
  const targetMuscle = muscleName.toLowerCase();
  const exercises = collectedExercises
    .filter((exercise) => exercise.primary_muscles?.some((group) => group.toLowerCase() === targetMuscle))
    .map((exercise) => mapLocalExercise(exercise, true));

  return (
    <main aria-label={`${muscleName} exercises`} className="exercise-library-page">
      <button
        aria-label="Quay lại trang chủ"
        className="exercise-library-back-button"
        onClick={() => router.push("/")}
        type="button"
      >
        <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
          <path d="m15 18-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
        <span>Quay lại</span>
      </button>

      {exercises.length > 0 ? (
        <section aria-labelledby="exercise-results-title" className="exercise-library-results">
          <h2 id="exercise-results-title" className="exercise-library-results__title">Bài tập {muscleName}</h2>
          <div className="exercise-library-results__list">
            {exercises.map((exercise) => <ExerciseCard exercise={exercise} key={exercise.id} muscle={muscle} />)}
          </div>
        </section>
      ) : (
        <p className="exercise-library-empty" role="status">No exercises found for this muscle yet.</p>
      )}
    </main>
  );
}
