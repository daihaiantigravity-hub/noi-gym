"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, type PointerEvent, type WheelEvent } from "react";
import { PUBLIC_EXERCISES_PAGE_SIZE } from "@/lib/exercises/pagination";
import type { PublicExercise } from "@/lib/exercises/types";
import LazyExerciseVideo from "./LazyExerciseVideo";

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

function getPageHref(path: string, page: number) {
  const [pathname, query = ""] = path.split("?", 2);
  const searchParams = new URLSearchParams(query);

  if (page <= 1) {
    searchParams.delete("page");
  } else {
    searchParams.set("page", String(page));
  }

  const serializedQuery = searchParams.toString();
  return `${pathname}${serializedQuery ? `?${serializedQuery}` : ""}`;
}

type PaginationItem = number | "ellipsis";

function getPaginationItems(page: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (page <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", totalPages];
  }

  if (page >= totalPages - 3) {
    return [1, "ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages];
}

function ExerciseCard({ exercise, muscle, routePath }: { exercise: PublicExercise; muscle: string; routePath: string }) {
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
        <Link aria-label={`Xem chi tiết ${exercise.name}`} className="workout-showcase__arrow exercise-library-exercise-card__detail" href={`/exercises/${muscle}/${exercise.id}?from=${encodeURIComponent(routePath)}`}>›</Link>
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

export default function ExerciseLibrary({ muscle, exercises, page = 1, pageSize = PUBLIC_EXERCISES_PAGE_SIZE, routePath = `/exercises/${muscle}`, targetLabel, total = exercises.length }: { muscle: string; exercises: PublicExercise[]; page?: number; pageSize?: number; routePath?: string; targetLabel?: string; total?: number }) {
  const router = useRouter();
  const muscleName = targetLabel ?? formatMuscleName(muscle);
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, total);
  const paginationItems = getPaginationItems(page, totalPages);
  const currentRoutePath = getPageHref(routePath, page);

  return (
    <main aria-label={`${muscleName} exercises`} className="exercise-library-page">
      <button aria-label="Quay lại trang chủ" className="exercise-library-back-button" onClick={() => router.push("/")} type="button">
        <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18"><path d="m15 18-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>
        <span>Quay lại</span>
      </button>
      {exercises.length > 0 ? <section aria-labelledby="exercise-results-title" className="exercise-library-results"><h2 className="exercise-library-results__title" id="exercise-results-title">Bài tập {muscleName}</h2><div className="exercise-library-results__list">{exercises.map((exercise) => <ExerciseCard exercise={exercise} key={exercise.id} muscle={muscle} routePath={currentRoutePath} />)}</div></section> : <p className="exercise-library-empty" role="status">No exercises found for this muscle yet.</p>}
      {totalPages > 1 ? <nav aria-label="Phân trang bài tập" className="exercise-library-pagination">
        <div className="exercise-library-pagination__pages">
          {page > 1 ? <Link aria-label="Trang trước" className="exercise-library-pagination__link" href={getPageHref(routePath, page - 1)}>← Trước</Link> : <span aria-hidden="true" className="exercise-library-pagination__link exercise-library-pagination__link--disabled">← Trước</span>}
          {paginationItems.map((item, index) => item === "ellipsis" ? <span aria-hidden="true" className="exercise-library-pagination__ellipsis" key={`ellipsis-${index}`}>…</span> : item === page ? <span aria-current="page" aria-label={`Trang ${item}`} className="exercise-library-pagination__page exercise-library-pagination__page--active" key={item}>{item}</span> : <Link aria-label={`Trang ${item}`} className="exercise-library-pagination__page" href={getPageHref(routePath, item)} key={item}>{item}</Link>)}
          {page < totalPages ? <Link aria-label="Trang sau" className="exercise-library-pagination__link" href={getPageHref(routePath, page + 1)}>Sau →</Link> : <span aria-hidden="true" className="exercise-library-pagination__link exercise-library-pagination__link--disabled">Sau →</span>}
        </div>
        <span className="exercise-library-pagination__status">Bài {firstItem}–{lastItem} / {total} · Trang {page} / {totalPages}</span>
      </nav> : null}
    </main>
  );
}
