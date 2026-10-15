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
  const [isInViewport, setIsInViewport] = useState(false);
  const [videoSourceToLoad, setVideoSourceToLoad] = useState<string | null>(null);
  const [readyVideoSource, setReadyVideoSource] = useState<string | null>(null);
  const shouldLoadVideo = videoSourceToLoad === src;
  const isVideoReady = readyVideoSource === src;

  useEffect(() => {
    // Let the lightweight poster request start first, but never let a slow or
    // missing poster prevent the current page's videos from loading.
    const timeoutId = window.setTimeout(() => setVideoSourceToLoad(src), poster ? 1500 : 0);
    return () => window.clearTimeout(timeoutId);
  }, [poster, src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (typeof IntersectionObserver === "undefined") {
      const timeoutId = window.setTimeout(() => setIsInViewport(true), 0);
      return () => window.clearTimeout(timeoutId);
    }

    const playbackObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
          playbackCandidates.set(video, { ratio: entry.intersectionRatio, setActive: setIsInViewport });
        } else {
          playbackCandidates.delete(video);
          setIsInViewport(false);
        }
        reconcilePlayback();
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: "0px" },
    );

    playbackObserver.observe(video);
    return () => {
      playbackObserver.disconnect();
      playbackCandidates.delete(video);
      reconcilePlayback();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isInViewport && isVideoReady) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [isInViewport, isVideoReady]);

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
          loading="eager"
          onError={() => setVideoSourceToLoad(src)}
          onLoad={() => setVideoSourceToLoad(src)}
          src={poster}
        />
      ) : null}
      <video
        aria-label={label}
        className={className}
        data-lazy-video-state={shouldLoadVideo ? (isVideoReady ? (isInViewport ? "playing" : "paused") : "loading") : "waiting"}
        loop
        muted
        onError={() => setReadyVideoSource((currentSource) => currentSource === src ? null : currentSource)}
        onLoadedData={() => setReadyVideoSource(src)}
        playsInline
        poster={poster || undefined}
        preload={shouldLoadVideo ? "auto" : "none"}
        ref={(element) => {
          videoRef.current = element;
          assignRef(forwardedRef ?? null, element);
        }}
        src={shouldLoadVideo ? src : undefined}
      />
    </>
  );
}
