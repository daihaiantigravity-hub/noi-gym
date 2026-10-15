"use client";

import { useEffect, useRef, useState, type ForwardedRef } from "react";

type PlaybackCandidate = {
  ratio: number;
  setActive: (active: boolean) => void;
};

const playbackCandidates = new Map<HTMLVideoElement, PlaybackCandidate>();

function reconcilePlayback() {
  let selectedVideo: HTMLVideoElement | null = null;
  let selectedRatio = 0;
  for (const [video, candidate] of playbackCandidates) {
    if (candidate.ratio > selectedRatio) {
      selectedVideo = video;
      selectedRatio = candidate.ratio;
    }
  }
  for (const [video, candidate] of playbackCandidates) candidate.setActive(video === selectedVideo);
}

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
  const [isVideoReady, setIsVideoReady] = useState(false);

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

    const loadObserver = new IntersectionObserver(
      ([entry]) => {
        setHasEnteredViewport(entry.isIntersecting);
        if (!entry.isIntersecting) {
          video.pause();
          video.removeAttribute("src");
          video.load();
          setIsVideoReady(false);
        }
      },
      { threshold: 0, rootMargin: "240px 0px" },
    );
    const playbackObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          playbackCandidates.set(video, { ratio: entry.intersectionRatio, setActive: setIsInViewport });
        } else {
          playbackCandidates.delete(video);
          setIsInViewport(false);
        }
        reconcilePlayback();
      },
      { threshold: [0, 0.6, 0.75, 1], rootMargin: "0px" },
    );

    loadObserver.observe(video);
    playbackObserver.observe(video);
    return () => {
      loadObserver.disconnect();
      playbackObserver.disconnect();
      playbackCandidates.delete(video);
      reconcilePlayback();
    };
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
    <>
      {poster && !isVideoReady ? (
        // Posters are already resized and encoded as compact WebP objects in R2.
        // Loading them directly keeps the fallback independent from the video request.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          aria-hidden="true"
          className="lazy-exercise-video__poster"
          decoding="async"
          draggable={false}
          loading={hasEnteredViewport ? "eager" : "lazy"}
          src={poster}
        />
      ) : null}
      <video
        aria-label={label}
        className={className}
        data-lazy-video-state={hasEnteredViewport ? (isVideoReady ? (isInViewport ? "playing" : "paused") : "loading") : "waiting"}
        loop
        muted
        onError={() => setIsVideoReady(false)}
        onLoadedData={() => setIsVideoReady(true)}
        playsInline
        poster={hasEnteredViewport ? poster || undefined : undefined}
        preload={hasEnteredViewport ? (isInViewport ? "auto" : "metadata") : "none"}
        ref={(element) => {
          videoRef.current = element;
          assignRef(forwardedRef ?? null, element);
        }}
        src={hasEnteredViewport ? src : undefined}
      />
    </>
  );
}
