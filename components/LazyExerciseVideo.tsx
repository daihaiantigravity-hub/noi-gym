"use client";

import { useCallback, useEffect, useRef, useState, type ForwardedRef } from "react";

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
  const [readyVideoSource, setReadyVideoSource] = useState<string | null>(null);
  const [playingVideoSource, setPlayingVideoSource] = useState<string | null>(null);
  const isVideoReady = readyVideoSource === src;
  const isVideoPlaying = playingVideoSource === src;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // A cached video can have its first frame before hydration attaches events.
    const markReady = () => setReadyVideoSource(src);
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) markReady();
    video.muted = true;
    void video.play().catch(() => undefined);
  }, [src]);

  const setVideoRef = useCallback((element: HTMLVideoElement | null) => {
    videoRef.current = element;
    assignRef(forwardedRef ?? null, element);
  }, [forwardedRef]);

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
          src={poster}
        />
      ) : null}
      <video
        aria-label={label}
        autoPlay
        className={className}
        data-lazy-video-state={isVideoReady ? (isVideoPlaying ? "playing" : "ready") : "loading"}
        loop
        muted
        onError={() => {
          setReadyVideoSource((currentSource) => currentSource === src ? null : currentSource);
          setPlayingVideoSource((currentSource) => currentSource === src ? null : currentSource);
        }}
        onLoadedData={(event) => {
          setReadyVideoSource(src);
          void event.currentTarget.play().catch(() => undefined);
        }}
        onPause={() => setPlayingVideoSource((currentSource) => currentSource === src ? null : currentSource)}
        onPlaying={() => setPlayingVideoSource(src)}
        playsInline
        poster={poster || undefined}
        preload="auto"
        ref={setVideoRef}
        src={src}
      />
    </>
  );
}
