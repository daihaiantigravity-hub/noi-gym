"use client";

import { useEffect, useRef, type RefObject } from "react";

const BACKDROP_WIDTH = 320;

export default function ExerciseDetailAmbientBackground({ videoRef }: { videoRef: RefObject<HTMLVideoElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement === null) return;
    const activeVideo = videoElement as HTMLVideoElement;
    const canvasElement = canvasRef.current;
    if (canvasElement === null) return;
    const backdropCanvas = canvasElement as HTMLCanvasElement;
    const contextElement = canvasElement.getContext("2d");
    if (contextElement === null) return;
    const backdropContext = contextElement as CanvasRenderingContext2D;

    let frameId = 0;
    let canvasHeight = 0;

    function drawFrame() {
      if (activeVideo.paused || activeVideo.ended) {
        frameId = 0;
        return;
      }

      if (activeVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && activeVideo.videoWidth > 0 && activeVideo.videoHeight > 0) {
        const nextHeight = Math.max(1, Math.round(BACKDROP_WIDTH * (activeVideo.videoHeight / activeVideo.videoWidth)));
        if (backdropCanvas.width !== BACKDROP_WIDTH || canvasHeight !== nextHeight) {
          backdropCanvas.width = BACKDROP_WIDTH;
          backdropCanvas.height = nextHeight;
          canvasHeight = nextHeight;
        }
        backdropContext.drawImage(activeVideo, 0, 0, BACKDROP_WIDTH, nextHeight);
      }
      frameId = window.requestAnimationFrame(drawFrame);
    }

    function startDrawing() {
      if (!frameId) frameId = window.requestAnimationFrame(drawFrame);
    }

    function stopDrawing() {
      if (!frameId) return;
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    }

    activeVideo.addEventListener("play", startDrawing);
    activeVideo.addEventListener("pause", stopDrawing);
    activeVideo.addEventListener("ended", stopDrawing);

    return () => {
      stopDrawing();
      activeVideo.removeEventListener("play", startDrawing);
      activeVideo.removeEventListener("pause", stopDrawing);
      activeVideo.removeEventListener("ended", stopDrawing);
    };
  }, [canvasRef, videoRef]);

  return (
    <div aria-hidden="true" className="exercise-detail-ambient">
      <canvas className="exercise-detail-ambient__canvas" ref={canvasRef} />
    </div>
  );
}
