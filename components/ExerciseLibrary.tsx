"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, type PointerEvent, type WheelEvent } from "react";
import { getPageHref, PUBLIC_EXERCISES_PAGE_SIZE } from "@/lib/exercises/pagination";
import { withExerciseGender } from "@/lib/exercises/gender";
import { getMuscleLabel } from "@/lib/exercises/labels";
import { useSavedExercise } from "@/lib/exercises/use-saved-exercise";
import type { ExerciseGender, PublicExercise } from "@/lib/exercises/types";
import LazyExerciseVideo from "./LazyExerciseVideo";
import ExercisePagination from "./ExercisePagination";

const fakeExerciseThumbnails = [
  { variant: "full-body", kicker: "10 PHÚT TẬP LUYỆN", hero: "TOÀN THÂN", sub: "BÀI TẬP" },
  { variant: "muscle", kicker: "10 PHÚT TẬP LUYỆN", hero: "NHÓM CƠ", sub: "BÀI TẬP" },
  { variant: "home-yoga", kicker: "TẬP TẠI NHÀ", hero: "CHUYỂN ĐỘNG", sub: "YOGA" },
  { variant: "outdoor", kicker: "VẬN ĐỘNG MỖI NGÀY", hero: "VẬN ĐỘNG", sub: "NGOÀI TRỜI" },
  { variant: "zumba", kicker: "THỂ LỰC VŨ ĐẠO", hero: "ZUMBA®", sub: "CÙNG TẬP" },
  { variant: "dance", kicker: "THỂ LỰC VŨ ĐẠO", hero: "VŨ ĐẠO", sub: "CÙNG NHAU" },
] as const;

function formatMuscleName(muscle: string) {
  return getMuscleLabel(muscle);
}

function ExerciseCard({ exercise, gender, muscle, routePath }: { exercise: PublicExercise; gender?: ExerciseGender; muscle: string; routePath: string }) {
  const detailRoute = withExerciseGender(`/exercises/${muscle}/${exercise.id}`, gender);
  const { isLoading: saveIsLoading, isPending: saveIsPending, isSaved, toggleSaved, error: saveError } = useSavedExercise(exercise.id);
  const saveLabel = `${isSaved ? "Bỏ lưu bài tập" : "Lưu bài tập"} ${exercise.name}`;
  const videos = Array.from(
    new Map(
      exercise.media
        .filter((item) => item.videoUrl)
        .map((item) => [item.videoUrl, item] as const),
    ).values(),
  );
  const fallbackPoster = exercise.media.find((item) => item.posterUrl)?.posterUrl;
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
    const horizontalDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ? event.deltaX
      : event.shiftKey ? event.deltaY : 0;
    if (maxScrollLeft <= 0 || horizontalDelta === 0) return;
    const nextScrollLeft = Math.max(0, Math.min(maxScrollLeft, track.scrollLeft + horizontalDelta));
    if (nextScrollLeft === track.scrollLeft) return;
    event.preventDefault();
    track.scrollLeft = nextScrollLeft;
  }

  return (
    <article className="health-card exercise-library-exercise-card">
      <header className="exercise-library-exercise-card__header">
        <h2>{exercise.name}</h2>
        <div className="exercise-library-exercise-card__actions">
          <button
            aria-label={saveLabel}
            aria-pressed={isSaved}
            disabled={saveIsLoading || saveIsPending}
            className="exercise-library-exercise-card__save"
            onClick={toggleSaved}
            title={saveLabel}
            type="button"
          >
            <svg aria-hidden="true" fill={isSaved ? "currentColor" : "none"} height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width="24">
              <path d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1.55.83L12 17.2l-5.45 3.63A1 1 0 0 1 5 20V4a1 1 0 0 1 1-1Z" />
            </svg>
          </button>
          <Link aria-label={`Xem chi tiết ${exercise.name}`} className="exercise-detail-topbar__icon exercise-library-exercise-card__detail" href={`${detailRoute}${detailRoute.includes("?") ? "&" : "?"}from=${encodeURIComponent(routePath)}`}>
            <svg aria-hidden="true" fill="none" height="28" viewBox="0 0 24 24" width="28"><path d="m9 6 6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>
          </Link>
        </div>
      </header>
      {saveError && <p className="exercise-library-exercise-card__save-error" role="alert">{saveError}</p>}
      <div className="exercise-library-showcase__media">
        <div aria-label={`Video minh họa ${exercise.name}`} className="exercise-library-showcase__media-track" onPointerCancel={handlePointerEnd} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerEnd} onWheel={handleWheel} role="region" tabIndex={videoCount > 1 ? 0 : -1}>
          {Array.from({ length: videoCount }, (_, videoIndex) => {
            const video = videos[videoIndex];
            const thumbnail = fakeExerciseThumbnails[(exercise.id.length + videoIndex) % fakeExerciseThumbnails.length];
            return (
              <div aria-label={`${exercise.name}, góc quay ${videoIndex + 1}`} className={`workout-thumbnail workout-thumbnail--${thumbnail.variant} exercise-library-showcase__fake-image${video ? " exercise-library-showcase__real-video" : ""}`} key={`${exercise.id}-${videoIndex}`} role="img">
                {video ? <LazyExerciseVideo className="exercise-library-showcase__video" label={`Video ${exercise.name}, góc quay ${videoIndex + 1}`} poster={video.posterUrl ?? fallbackPoster} src={video.videoUrl} /> : <><span className="workout-thumbnail__kicker">{thumbnail.kicker}</span><strong className="workout-thumbnail__hero">{thumbnail.hero}</strong><span className="workout-thumbnail__sub">{thumbnail.sub}</span><span aria-hidden="true" className="workout-thumbnail__person" /><span aria-hidden="true" className="workout-thumbnail__play" /></>}
              </div>
            );
          })}
        </div>
      </div>
      {exercise.steps.length > 0 ? <ol aria-label={`Hướng dẫn ${exercise.name}`} className="exercise-library-exercise-card__steps">{exercise.steps.map((step, index) => <li key={`${exercise.id}-step-${index}`}><span>{index + 1}</span><p>{step}</p></li>)}</ol> : <p className="exercise-library-exercise-card__steps-empty">Chưa có hướng dẫn cho bài tập này.</p>}
    </article>
  );
}

export default function ExerciseLibrary({ muscle, exercises, gender, page = 1, pageSize = PUBLIC_EXERCISES_PAGE_SIZE, routePath = `/exercises/${muscle}`, targetLabel, total = exercises.length }: { muscle: string; exercises: PublicExercise[]; gender?: ExerciseGender; page?: number; pageSize?: number; routePath?: string; targetLabel?: string; total?: number }) {
  const router = useRouter();
  const muscleName = targetLabel ? getMuscleLabel(targetLabel) : formatMuscleName(muscle);
  const currentRoutePath = getPageHref(routePath, page);
  const isEmptyPage = exercises.length === 0 && (page > 1 || total > 0);

  return (
    <main aria-label={`Bài tập ${muscleName}`} className="exercise-library-page health-mood-surface">
      <header className="exercise-library-header">
        <button aria-label="Quay về trang chủ" className="exercise-library-back-button" onClick={() => router.push("/")} title="Quay về trang chủ" type="button">
          <svg aria-hidden="true" fill="none" height="28" viewBox="0 0 24 24" width="28"><path d="m15 18-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>
        </button>
        <h1 className="exercise-library-results__title" id="exercise-results-title">Bài tập {muscleName}{gender === "female" ? " cho nữ" : " cho nam"}</h1>
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
          <h2 id="exercise-empty-title">{isEmptyPage ? "Trang này không có bài tập" : "Chưa có bài tập phù hợp"}</h2>
          <p>{isEmptyPage ? "Hãy quay lại trang đầu để xem các bài tập hiện có." : `Chưa có bài tập ${muscleName} cho ${gender === "female" ? "nữ" : "nam"} với lựa chọn này.`}</p>
          <Link className="exercise-library-empty__action" href={isEmptyPage ? getPageHref(routePath, 1) : "/"}>
            {isEmptyPage ? "Xem trang đầu" : "Khám phá bài tập khác"}
          </Link>
        </section>
      )}
      {exercises.length > 0 && <ExercisePagination page={page} pageSize={pageSize} routePath={routePath} total={total} />}
    </main>
  );
}
