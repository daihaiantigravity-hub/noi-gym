"use client";

import { useEffect, useRef, useState, type ForwardedRef } from "react";

function assignRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

export default function LazyExerciseVideo({
  src,
  poster,
  label,
  className,
  forwardedRef,
}: {
  src: string;
  poster?: string;
  label: string;
  className: string;
  forwardedRef?: ForwardedRef<HTMLVideoElement>;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasEnteredViewport, setHasEnteredViewport] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (typeof IntersectionObserver === "undefined") {
      const timeoutId = window.setTimeout(() => {
        setHasEnteredViewport(true);
        setIsInViewport(true);
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.25;
        setIsInViewport(visible);
        if (visible) setHasEnteredViewport(true);
      },
      { threshold: [0, 0.25], rootMargin: "0px" },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isInViewport && hasEnteredViewport) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [hasEnteredViewport, isInViewport]);

  return (
    <video
      aria-label={label}
      autoPlay={isInViewport}
      className={className}
      data-lazy-video-state={hasEnteredViewport ? (isInViewport ? "playing" : "paused") : "waiting"}
      loop
      muted
      playsInline
      poster={poster || undefined}
      preload={hasEnteredViewport ? "metadata" : "none"}
      ref={(element) => {
        videoRef.current = element;
        assignRef(forwardedRef ?? null, element);
      }}
      src={hasEnteredViewport ? src : undefined}
    />
  );
}
