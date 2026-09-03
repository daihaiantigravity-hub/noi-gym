"use client";

import { useState } from "react";
import Link from "next/link";
import ExerciseFilters, { type EquipmentName } from "./ExerciseFilters";
import MuscleMap from "./MuscleMap";
import exerciseData from "@/data/musclewiki-exercises-collected.json";
import type { MuscleWikiExercise } from "@/lib/musclewiki";

type Exercise = {
  id: number;
  title: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  images: [string | null, string | null];
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
  const videos = exercise.videos?.filter((video) => video.gender === preferredGender) ?? [];
  const frontImage = videos.find((video) => video.angle === "front")?.og_image;
  const sideImage = videos.find((video) => video.angle === "side")?.og_image;

  return {
    id: exercise.id,
    title: exercise.name,
    level: normalizeDifficulty(exercise.difficulty),
    images: [frontImage ?? null, sideImage ?? null],
    steps: exercise.steps?.filter(Boolean) ?? [],
  };
}

function ShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="2.2" />
      <circle cx="6" cy="12" r="2.2" />
      <circle cx="18" cy="19" r="2.2" />
      <path d="m8 11 7.8-4.5M8 13l7.8 4.5" />
    </svg>
  );
}

function ExerciseCard({ exercise, index }: { exercise: Exercise; index: number }) {
  return (
    <article className="exercise-card">
      <header className="exercise-card__header">
        <h2>{exercise.title}</h2>
        <button className="exercise-card__share" type="button" aria-label={`Share ${exercise.title}`}>
          <ShareIcon />
        </button>
      </header>

      <div className="exercise-card__media" aria-label={`${exercise.title} demonstration images`}>
        <span className={`exercise-card__level exercise-card__level--${exercise.level.toLowerCase()}`}>
          {exercise.level}
        </span>
        {exercise.images.map((image, imageIndex) =>
          image ? (
            <div
              className="exercise-card__image"
              key={`${exercise.id}-${imageIndex}`}
              role="img"
              aria-label={`${exercise.title} view ${imageIndex + 1}`}
              style={{ backgroundImage: `url("${image}")` }}
            />
          ) : (
            <div
              className="exercise-card__image exercise-card__image--empty"
              key={`${exercise.id}-${imageIndex}`}
              role="img"
              aria-label={`${exercise.title} view ${imageIndex + 1} unavailable`}
            />
          ),
        )}
      </div>

      {exercise.steps.length > 0 ? (
        <ol className="exercise-card__steps">
          {exercise.steps.map((step, stepIndex) => (
            <li key={`${exercise.id}-${stepIndex}`}>
              <span className="exercise-card__step-number">{stepIndex + 1}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="exercise-card__steps-empty">Instructions are not available for this exercise.</p>
      )}

      <span className="exercise-card__index" aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
      </span>
    </article>
  );
}

export default function ExerciseListPage({ muscle }: { muscle: string }) {
  const [isMale, setIsMale] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentName[]>(["Featured"]);
  const muscleName = formatMuscleName(muscle);
  const targetMuscle = muscleName.toLowerCase();
  const hasEquipmentFilter = selectedEquipment.length > 0 && !selectedEquipment.includes("Featured");
  const exercises = collectedExercises
    .filter((exercise) => exercise.primary_muscles?.some((group) => group.toLowerCase() === targetMuscle))
    .filter((exercise) => !hasEquipmentFilter || selectedEquipment.includes(exercise.category as EquipmentName))
    .map((exercise) => mapLocalExercise(exercise, isMale));

  return (
    <main className="exercise-list-page" aria-label={`${muscleName} exercises`}>
      <div className="exercise-list-layout">
        <section className="exercise-list-results" aria-labelledby="exercise-list-title">
          <header className="exercise-list-toolbar">
            <Link className="exercise-list-toolbar__back" href="/">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
              <span>Muscle map</span>
            </Link>
            <div className="exercise-list-toolbar__title">
              <span>Exercise library</span>
              <h1 id="exercise-list-title">{muscleName}</h1>
            </div>
            <span className="exercise-list-toolbar__count">
              {exercises.length} {exercises.length === 1 ? "exercise" : "exercises"}
            </span>
          </header>

          {exercises.length > 0 ? (
            <div className="exercise-card-list">
              {exercises.map((exercise, index) => (
                <ExerciseCard key={exercise.id} exercise={exercise} index={index} />
              ))}
            </div>
          ) : (
            <p className="exercise-list-empty" role="status">
              No collected exercises match this muscle and equipment filter yet.
            </p>
          )}
        </section>

        <aside className="exercise-list-sidebar" aria-label="Exercise filters and muscle map">
          <ExerciseFilters
            isMale={isMale}
            onGenderChange={setIsMale}
            selectedEquipment={selectedEquipment}
            onEquipmentChange={setSelectedEquipment}
          >
            <div className="exercise-list-sidebar__map">
              <MuscleMap isMale={isMale} />
            </div>
          </ExerciseFilters>
        </aside>
      </div>
    </main>
  );
}
