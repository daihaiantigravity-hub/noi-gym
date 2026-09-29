"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, type PointerEvent, type WheelEvent } from "react";
import { getPageHref, PUBLIC_EXERCISES_PAGE_SIZE } from "@/lib/exercises/pagination";
import { withExerciseGender } from "@/lib/exercises/gender";
import type { ExerciseGender, PublicExercise } from "@/lib/exercises/types";
import LazyExerciseVideo from "./LazyExerciseVideo";
import ExercisePagination from "./ExercisePagination";

const fakeExerciseThumbnails = [
  { variant: "full-body", kicker: "10 MINUTE MIRACLE", hero: "FULL BODY", sub: "WORKOUT" },
  { variant: "muscle", kicker: "10 MINUTE MIRACLE", hero: "MUSCLE", sub: "WORKOUT" },
  { variant: "home-yoga", kicker: "AT HOME", hero: "FLOW", sub: "YOGA" },
  { variant: "outdoor", kicker: "MOVE EVERY DAY", hero: "MOVE", sub: "OUTDOOR" },
  { variant: "zumba", kicker: "DANCE FITNESS", hero: "ZUMBA®", sub: "LET'S MOVE" },
  { variant: "dance", kicker: "DANCE FITNESS", hero: "DANCE", sub: "TOGETHER" },
] as const;

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

function ExerciseCard({ exercise, gender, muscle, routePath }: { exercise: PublicExercise; gender?: ExerciseGender; muscle: string; routePath: string }) {
  const detailRoute = withExerciseGender(`/exercises/${muscle}/${exercise.id}`, gender);
  const videos = Array.from(
    new Map(
      exercise.media
        .filter((item) => item.videoUrl)
        .map((item) => [item.videoUrl, item] as const),
    ).values(),
  );
  const videoCount = Math.max(videos.length, 1);
  const dragState = useRef<{ pointerId: number; startX: number; startScrollLeft: number } | null>(null);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0 || event.currentTarget.scrollWidth <= event.currentTarget.clientWidth) return;
    dragState.current = { pointerId: event.pointerId, startX: event.clientX, startScrollLeft: event.currentTarget.scrollLeft };
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
        <h2>{exercise.name}</h2>
        <Link aria-label={`Xem chi tiết ${exercise.name}`} className="workout-showcase__arrow exercise-library-exercise-card__detail" href={`${detailRoute}${detailRoute.includes("?") ? "&" : "?"}from=${encodeURIComponent(routePath)}`}>›</Link>
      </header>
      <div className="exercise-library-showcase__media">
        <div aria-label={`${exercise.name} demonstration videos`} className="exercise-library-showcase__media-track" onPointerCancel={handlePointerEnd} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerEnd} onWheel={handleWheel} role="region" tabIndex={videoCount > 1 ? 0 : -1}>
          {Array.from({ length: videoCount }, (_, videoIndex) => {
            const video = videos[videoIndex];
            const thumbnail = fakeExerciseThumbnails[(exercise.id.length + videoIndex) % fakeExerciseThumbnails.length];
            return (
              <div aria-label={`${exercise.name} view ${videoIndex + 1}`} className={`workout-thumbnail workout-thumbnail--${thumbnail.variant} exercise-library-showcase__fake-image${video ? " exercise-library-showcase__real-video" : ""}`} key={`${exercise.id}-${videoIndex}`} role="img">
                {video ? <LazyExerciseVideo className="exercise-library-showcase__video" label={`${exercise.name} video ${videoIndex + 1}`} poster={video.posterUrl} src={video.videoUrl} /> : <><span className="workout-thumbnail__kicker">{thumbnail.kicker}</span><strong className="workout-thumbnail__hero">{thumbnail.hero}</strong><span className="workout-thumbnail__sub">{thumbnail.sub}</span><span aria-hidden="true" className="workout-thumbnail__person" /><span aria-hidden="true" className="workout-thumbnail__play" /></>}
              </div>
            );
          })}
        </div>
      </div>
      {exercise.steps.length > 0 ? <ol aria-label={`${exercise.name} instructions`} className="exercise-library-exercise-card__steps">{exercise.steps.map((step, index) => <li key={`${exercise.id}-step-${index}`}><span>{index + 1}</span><p>{step}</p></li>)}</ol> : <p className="exercise-library-exercise-card__steps-empty">Instructions are not available for this exercise.</p>}
    </article>
  );
}

export default function ExerciseLibrary({ muscle, exercises, gender, page = 1, pageSize = PUBLIC_EXERCISES_PAGE_SIZE, routePath = `/exercises/${muscle}`, targetLabel, total = exercises.length }: { muscle: string; exercises: PublicExercise[]; gender?: ExerciseGender; page?: number; pageSize?: number; routePath?: string; targetLabel?: string; total?: number }) {
  const router = useRouter();
  const muscleName = targetLabel ?? formatMuscleName(muscle);
  const currentRoutePath = getPageHref(routePath, page);
  const isEmptyPage = exercises.length === 0 && (page > 1 || total > 0);

  return (
    <main aria-label={`${muscleName} exercises`} className="exercise-library-page health-mood-surface">
      <header className="exercise-library-header">
        <button aria-label="Back to Home" className="exercise-library-back-button" onClick={() => router.push("/")} title="Back to Home" type="button">
          <svg aria-hidden="true" fill="none" height="22" viewBox="0 0 24 24" width="22"><path d="m15 18-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>
        </button>
        <h1 className="exercise-library-results__title" id="exercise-results-title">{gender === "female" ? "Female " : ""}{muscleName} Exercises</h1>
      </header>
      {exercises.length > 0 ? (
        <section aria-labelledby="exercise-results-title" className="exercise-library-results">
          <div className="exercise-library-results__list">{exercises.map((exercise) => <ExerciseCard exercise={exercise} gender={gender} key={exercise.id} muscle={muscle} routePath={currentRoutePath} />)}</div>
        </section>
      ) : (
        <section aria-labelledby="exercise-empty-title" className="exercise-library-empty" role="status">
          <span aria-hidden="true" className="exercise-library-empty__icon">
            <svg fill="none" height="32" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 32 32" width="32">
              <path d="M8 11v10M12 8v16M20 8v16M24 11v10M12 16h8M5 13v6M27 13v6" />
            </svg>
          </span>
          <h2 id="exercise-empty-title">{isEmptyPage ? "No exercises on this page" : "No exercises available yet"}</h2>
          <p>{isEmptyPage ? "This page is empty. Return to the first page to see available exercises." : `There are no ${gender === "female" ? "female" : "male"} exercises for ${muscleName} in this selection yet.`}</p>
          <Link className="exercise-library-empty__action" href={isEmptyPage ? getPageHref(routePath, 1) : "/"}>
            {isEmptyPage ? "View first page" : "Explore other exercises"}
          </Link>
        </section>
      )}
      {exercises.length > 0 && <ExercisePagination page={page} pageSize={pageSize} routePath={routePath} total={total} />}
    </main>
  );
}
