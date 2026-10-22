"use client";

import { useRef, type PointerEvent, type WheelEvent } from "react";
import type { ExerciseMediaValue } from "@/lib/exercises/types";
import LazyExerciseVideo from "./LazyExerciseVideo";

const fakeDetailSlides = [
  { kicker: "10 PHÚT TẬP TẠI NHÀ", sub: "BÀI TẬP TOÀN THÂN TRONG 10 PHÚT", modifier: "" },
  { kicker: "10 PHÚT TẬP LUYỆN", sub: "BÀI TẬP TẠI NHÀ", modifier: "exercise-detail-hero--second" },
  { kicker: "VẬN ĐỘNG MỖI NGÀY", sub: "KIỂM SOÁT TỪNG CHUYỂN ĐỘNG", modifier: "exercise-detail-hero--third" },
] as const;

export default function ExerciseDetailMedia({ mediaCount, title, media = [] }: { mediaCount: number; title: string; media?: ExerciseMediaValue[] }) {
  const realMedia = media.filter((item) => item.videoUrl);
  const fallbackPoster = media.find((item) => item.posterUrl)?.posterUrl;
  const slideCount = Math.max(realMedia.length || mediaCount, 1);
  const dragState = useRef<{ pointerId: number; startX: number; startScrollLeft: number } | null>(null);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0 || event.currentTarget.scrollWidth <= event.currentTarget.clientWidth) return;
    dragState.current = { pointerId: event.pointerId, startX: event.clientX, startScrollLeft: event.currentTarget.scrollLeft };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.classList.add("exercise-detail-hero-track--dragging");
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
    event.currentTarget.classList.remove("exercise-detail-hero-track--dragging");
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
    <>
      <div aria-label={`Video minh họa ${title}`} className={`exercise-detail-hero-track${slideCount > 1 ? " exercise-detail-hero-track--stacked" : " exercise-detail-hero-track--single"}`} onPointerCancel={handlePointerEnd} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerEnd} onWheel={handleWheel} role="region" tabIndex={slideCount > 1 ? 0 : -1}>
        {Array.from({ length: slideCount }, (_, index) => {
          const slide = fakeDetailSlides[index % fakeDetailSlides.length];
          const selectedMedia = realMedia[index];
          return (
            <section aria-label={`${title}, góc quay ${index + 1}`} className={`exercise-detail-hero ${slide.modifier}${selectedMedia ? " exercise-detail-hero--real" : ""}`} key={`${title}-${index}`} role="img">
              {selectedMedia?.videoUrl ? <LazyExerciseVideo className="exercise-detail-hero__video" label={`Video ${title}, góc quay ${index + 1}`} poster={selectedMedia.posterUrl ?? fallbackPoster} src={selectedMedia.videoUrl} /> : <><span className="exercise-detail-hero__kicker">{slide.kicker}</span><span className="exercise-detail-hero__sub">{slide.sub}</span><span aria-hidden="true" className="exercise-detail-hero__person" /></>}
              {selectedMedia?.videoUrl && (
                <div aria-hidden="true" className="exercise-detail-hero__watermark-cover" />
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
