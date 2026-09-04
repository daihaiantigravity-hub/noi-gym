"use client";

import { useRef, type PointerEvent, type WheelEvent } from "react";
import type { ExerciseMediaValue } from "@/lib/exercises/types";

const fakeDetailSlides = [
  { kicker: "HOME TRAINING 10 MINUTE MIRACLE", title: "BAE HA EUN", sub: "BURN FAT IN 10 MINUTES WITH FULL BODY", modifier: "" },
  { kicker: "10 MINUTE MIRACLE", title: "FULL BODY", sub: "WORKOUT AT HOME", modifier: "exercise-detail-hero--second" },
  { kicker: "MOVE EVERY DAY", title: "MUSCLE", sub: "TRAIN WITH CONTROL", modifier: "exercise-detail-hero--third" },
] as const;

export default function ExerciseDetailMedia({ mediaCount, title, media = [] }: { mediaCount: number; title: string; media?: ExerciseMediaValue[] }) {
  const realMedia = media.filter((item) => item.videoUrl);
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
    if (maxScrollLeft <= 0 || event.deltaY === 0) return;
    const nextScrollLeft = Math.max(0, Math.min(maxScrollLeft, track.scrollLeft + event.deltaY));
    if (nextScrollLeft === track.scrollLeft) return;
    event.preventDefault();
    track.scrollLeft = nextScrollLeft;
  }

  return (
    <div aria-label={`${title} demonstration videos`} className={`exercise-detail-hero-track${slideCount > 1 ? " exercise-detail-hero-track--stacked" : " exercise-detail-hero-track--single"}`} onPointerCancel={handlePointerEnd} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerEnd} onWheel={handleWheel} role="region" tabIndex={slideCount > 1 ? 0 : -1}>
      {Array.from({ length: slideCount }, (_, index) => {
        const slide = fakeDetailSlides[index % fakeDetailSlides.length];
        const selectedMedia = realMedia[index];
        return (
          <section aria-label={`${title} view ${index + 1}`} className={`exercise-detail-hero ${slide.modifier}${selectedMedia ? " exercise-detail-hero--real" : ""}`} key={`${title}-${index}`} role="img">
            {selectedMedia?.videoUrl ? <video aria-label={`${title} demonstration video ${index + 1}`} autoPlay className="exercise-detail-hero__video" loop muted playsInline preload="metadata" src={selectedMedia.videoUrl} /> : <><span className="exercise-detail-hero__kicker">{slide.kicker}</span><strong className="exercise-detail-hero__title">{slide.title}</strong><span className="exercise-detail-hero__sub">{slide.sub}</span><span aria-hidden="true" className="exercise-detail-hero__person" /></>}
          </section>
        );
      })}
    </div>
  );
}
