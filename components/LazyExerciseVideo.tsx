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
  const [videoSourceToLoad, setVideoSourceToLoad] = useState<string | null>(null);
  const [readyVideoSource, setReadyVideoSource] = useState<string | null>(null);
  const [playingVideoSource, setPlayingVideoSource] = useState<string | null>(null);
  const shouldLoadVideo = videoSourceToLoad === src;
  const isVideoReady = readyVideoSource === src;
  const isVideoPlaying = playingVideoSource === src;

  useEffect(() => {
    // Let the lightweight poster request start first, but never let a slow or
    // missing poster prevent the current page's videos from loading.
    const timeoutId = window.setTimeout(() => setVideoSourceToLoad(src), poster ? 1500 : 0);
    return () => window.clearTimeout(timeoutId);
  }, [poster, src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoReady) return;
    void video.play().catch(() => undefined);
  }, [isVideoReady]);

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
        autoPlay
        className={className}
        data-lazy-video-state={shouldLoadVideo ? (isVideoReady ? (isVideoPlaying ? "playing" : "ready") : "loading") : "waiting"}
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
        onPlay={() => setPlayingVideoSource(src)}
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
