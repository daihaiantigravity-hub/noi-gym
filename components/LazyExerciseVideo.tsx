"use client";

import { useCallback, useEffect, useRef, useState, type ForwardedRef } from "react";
import { getMessages } from "@/lib/i18n/messages";
import { useAppLanguage } from "./LanguageProvider";

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
  const { language } = useAppLanguage();
  const messages = getMessages(language);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playAttemptRef = useRef<{ video: HTMLVideoElement; source: string } | null>(null);
  const [readyVideoSource, setReadyVideoSource] = useState<string | null>(null);
  const [playingVideoSource, setPlayingVideoSource] = useState<string | null>(null);
  const [playbackFailure, setPlaybackFailure] = useState<{ source: string; kind: "blocked" | "error" } | null>(null);
  const isVideoReady = readyVideoSource === src;
  const isVideoPlaying = playingVideoSource === src;
  const failure = playbackFailure?.source === src ? playbackFailure.kind : null;

  const isCurrentVideo = useCallback((video: HTMLVideoElement) => (
    videoRef.current === video && video.getAttribute("src") === src
  ), [src]);

  const requestPlayback = useCallback((video: HTMLVideoElement, reload = false) => {
    if (!isCurrentVideo(video)) return;
    const pending = playAttemptRef.current;
    if (!reload && pending?.video === video && pending.source === src) return;
    const attempt = { video, source: src };
    playAttemptRef.current = attempt;
    const isCurrentAttempt = () => playAttemptRef.current === attempt && isCurrentVideo(video);
    const clearFailure = () => setPlaybackFailure((current) => current?.source === src ? null : current);
    const handleFailure = (error: unknown) => {
      if (!isCurrentAttempt()) return;
      const name = typeof error === "object" && error !== null && "name" in error ? error.name : "";
      // A source change or interrupted load is not a permanent playback failure.
      if (name === "AbortError") return;
      setPlaybackFailure({ source: src, kind: name === "NotAllowedError" ? "blocked" : "error" });
      setPlayingVideoSource((current) => current === src ? null : current);
    };
    clearFailure();
    video.muted = true;
    try {
      // Only an explicit Retry reloads a failed source. Play stays in the click's
      // user-activation stack, so blocked autoplay can be recovered without polling.
      if (reload) video.load();
      void video.play().then(() => {
        if (isCurrentAttempt()) clearFailure();
      }, handleFailure).finally(() => {
        if (playAttemptRef.current === attempt) playAttemptRef.current = null;
      });
    } catch (error) {
      handleFailure(error);
      if (playAttemptRef.current === attempt) playAttemptRef.current = null;
    }
  }, [isCurrentVideo, src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // A cached video can have its first frame before hydration attaches events.
    const markReady = () => setReadyVideoSource(src);
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) markReady();
    requestPlayback(video);
    return () => { playAttemptRef.current = null; };
  }, [requestPlayback, src]);

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
        data-lazy-video-state={failure ?? (isVideoReady ? (isVideoPlaying ? "playing" : "ready") : "loading")}
        loop
        muted
        onError={(event) => {
          if (!isCurrentVideo(event.currentTarget)) return;
          playAttemptRef.current = null;
          setReadyVideoSource((currentSource) => currentSource === src ? null : currentSource);
          setPlayingVideoSource((currentSource) => currentSource === src ? null : currentSource);
          setPlaybackFailure({ source: src, kind: "error" });
        }}
        onCanPlay={(event) => {
          if (isCurrentVideo(event.currentTarget) && event.currentTarget.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) setReadyVideoSource(src);
        }}
        onLoadedData={(event) => {
          if (!isCurrentVideo(event.currentTarget)) return;
          setReadyVideoSource(src);
          requestPlayback(event.currentTarget);
        }}
        onPause={() => setPlayingVideoSource((currentSource) => currentSource === src ? null : currentSource)}
        onPlaying={(event) => {
          if (!isCurrentVideo(event.currentTarget)) return;
          // Some mobile browsers suppress loadeddata in data-saving modes.
          // Playing itself is enough evidence to uncover the decoded video.
          setReadyVideoSource(src);
          setPlayingVideoSource(src);
          setPlaybackFailure((current) => current?.source === src ? null : current);
        }}
        playsInline
        poster={poster || undefined}
        preload="auto"
        ref={setVideoRef}
        src={src}
      />
      {failure && (
        <button
          aria-label={`${failure === "blocked" ? messages.playVideo : messages.retryVideo}: ${label}`}
          className="lazy-exercise-video__play-button"
          onClick={() => {
            const video = videoRef.current;
            if (video) requestPlayback(video, failure === "error");
          }}
          type="button"
        >
          <svg aria-hidden="true" fill="currentColor" height="18" viewBox="0 0 24 24" width="18"><path d="m8 5 11 7-11 7V5Z" /></svg>
          <span>{failure === "blocked" ? messages.playVideo : messages.retryVideo}</span>
        </button>
      )}
    </>
  );
}
