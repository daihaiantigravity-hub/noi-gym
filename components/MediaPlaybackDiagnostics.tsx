"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useAppLanguage } from "./LanguageProvider";
import styles from "./MediaPlaybackDiagnostics.module.css";

const noSubscription = () => () => {};
const isDebugEnabled = () => new URLSearchParams(window.location.search).get("media-debug") === "1";
const serverDebugEnabled = () => false;
const withoutBlur = ".health-card.exercise-library-exercise-card,.exercise-library-showcase__real-video::after{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}";

export type MediaDiagnosticSample = {
  time: number;
  ready: number;
  width: number;
  height: number;
  paused: boolean;
  error: number;
  poster: boolean;
  totalFrames: number | null;
  droppedFrames: number | null;
};

type Measurement = {
  elapsed: number;
  backgrounded: boolean;
  videosChanged: boolean;
  blurDisabled: boolean;
  frames: number;
  gaps50: number;
  gaps100: number;
  maxGap: number;
  start: MediaDiagnosticSample[];
  end: MediaDiagnosticSample[];
  userAgent: string;
  viewport: string;
  network: string;
};

const decimal = (value: number) => Number.isFinite(value) ? value.toFixed(1) : "?";
const cleanText = (value: string, limit: number) => value.replace(/[\r\n\t]/g, " ").slice(0, limit);

function frameDelta(start: number | null, end: number | null) {
  return start !== null && end !== null && end >= start ? end - start : null;
}

function videoCounts(videos: MediaDiagnosticSample[]) {
  return `n=${videos.length} ready=${videos.filter((video) => video.ready >= 2).length} paused=${videos.filter((video) => video.paused).length} errors=${videos.filter((video) => video.error > 0).length} posters=${videos.filter((video) => video.poster).length}`;
}

/** Only explicit numeric/status fields are serialized; sources and account data are never read. */
export function buildMediaDiagnosticsReport(measurement: Measurement) {
  const { start, end } = measurement;
  const invalid = measurement.backgrounded ? "INVALID: tab hidden" : measurement.videosChanged ? "INVALID: videos changed" : "VALID";
  const details = start.slice(0, 12).map((before, index) => {
    const after = end[index];
    if (!after) return `v${index + 1}: removed`;
    const total = frameDelta(before.totalFrames, after.totalFrames);
    const dropped = frameDelta(before.droppedFrames, after.droppedFrames);
    // currentTime can wrap backwards because these demonstrations loop.
    const progressed = (total !== null && total > 0) || Math.abs(after.time - before.time) > 0.05;
    const size = before.width > 0 && before.height > 0 ? `${before.width}x${before.height}` : "NA";
    return `v${index + 1} size=${size} t=${decimal(before.time)}>${decimal(after.time)} progress=${progressed ? "yes" : "unconfirmed"} ready=${before.ready}>${after.ready} paused=${+before.paused}>${+after.paused} err=${before.error}>${after.error} poster=${+before.poster}>${+after.poster} frames=${total ?? "NA"} drop=${dropped ?? "NA"}`;
  });
  const report = [
    `Media debug v1 | ${decimal(measurement.elapsed / 1000)}s | ${invalid} | blur-disable-test=${measurement.blurDisabled ? "on" : "off"}`,
    `rAF=${measurement.frames} gaps>50ms=${measurement.gaps50} >100ms=${measurement.gaps100} max=${decimal(measurement.maxGap)}ms`,
    `Start ${videoCounts(start)}`,
    `End   ${videoCounts(end)}`,
    `Viewport ${cleanText(measurement.viewport, 80)} | Network ${cleanText(measurement.network, 80)}`,
    `UA ${cleanText(measurement.userAgent, 240)}`,
    "Video keys: size=source pixels; t=seconds; ready=0..4; paused/poster=0/1; frames/drop=8s delta; NA=unavailable",
    ...details,
    ...(start.length > 12 ? [`Details limited to 12/${start.length} videos.`] : []),
  ].join("\n");
  return report.length <= 2000 ? report : `${report.slice(0, 1970)}\n[report truncated]`;
}

function sampleVideo(video: HTMLVideoElement): MediaDiagnosticSample {
  let quality: VideoPlaybackQuality | null = null;
  try {
    quality = video.getVideoPlaybackQuality?.() ?? null;
  } catch {
    // Some mobile engines expose the method without supporting its counters.
  }
  return {
    time: video.currentTime,
    ready: video.readyState,
    width: video.videoWidth,
    height: video.videoHeight,
    paused: video.paused,
    error: video.error?.code ?? 0,
    poster: Boolean(video.parentElement?.querySelector(".lazy-exercise-video__poster")),
    totalFrames: quality && Number.isFinite(quality.totalVideoFrames) ? quality.totalVideoFrames : null,
    droppedFrames: quality && Number.isFinite(quality.droppedVideoFrames) ? quality.droppedVideoFrames : null,
  };
}

function DebugPanel() {
  const { language } = useAppLanguage();
  const vi = language === "vi";
  const [measuring, setMeasuring] = useState(false);
  const [blurDisabled, setBlurDisabled] = useState(false);
  const [report, setReport] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyFallback, setCopyFallback] = useState(false);
  const cancelRef = useRef<(() => void) | null>(null);
  const reportRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => () => cancelRef.current?.(), []);

  function measure() {
    if (cancelRef.current) return;
    setMeasuring(true);
    setCopied(false);
    setCopyFallback(false);
    setReport("");
    const videos = Array.from(document.querySelectorAll<HTMLVideoElement>("video[data-lazy-video-state]"));
    const start = videos.map(sampleVideo);
    const started = performance.now();
    let previous = started;
    let frameId = 0;
    let timerId = 0;
    let frames = 0;
    let gaps50 = 0;
    let gaps100 = 0;
    let maxGap = 0;
    let backgrounded = document.visibilityState !== "visible";

    function cleanup() {
      cancelAnimationFrame(frameId);
      window.clearTimeout(timerId);
      document.removeEventListener("visibilitychange", onVisibility);
      cancelRef.current = null;
    }

    function finish() {
      if (!cancelRef.current) return;
      cleanup();
      const ended = performance.now();
      const finalGap = ended - previous;
      if (finalGap > 50) gaps50++;
      if (finalGap > 100) gaps100++;
      maxGap = Math.max(maxGap, finalGap);
      const currentVideos = Array.from(document.querySelectorAll<HTMLVideoElement>("video[data-lazy-video-state]"));
      const connection = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } }).connection;
      setReport(buildMediaDiagnosticsReport({
        elapsed: ended - started,
        backgrounded,
        videosChanged: currentVideos.length !== videos.length || videos.some((video, index) => currentVideos[index] !== video),
        blurDisabled,
        frames, gaps50, gaps100, maxGap, start,
        end: currentVideos.map(sampleVideo),
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight} dpr=${decimal(window.devicePixelRatio)} screen=${screen.width}x${screen.height}`,
        network: `${connection?.effectiveType ?? "unknown"} saveData=${connection?.saveData === undefined ? "unknown" : connection.saveData}`,
      }));
      setMeasuring(false);
    }

    function onVisibility() {
      if (document.visibilityState !== "visible") {
        backgrounded = true;
        finish();
      }
    }

    function onFrame(now: number) {
      const gap = now - previous;
      previous = now;
      frames++;
      if (gap > 50) gaps50++;
      if (gap > 100) gaps100++;
      maxGap = Math.max(maxGap, gap);
      frameId = requestAnimationFrame(onFrame);
    }

    cancelRef.current = cleanup;
    document.addEventListener("visibilitychange", onVisibility);
    frameId = requestAnimationFrame(onFrame);
    timerId = window.setTimeout(finish, 8000);
    if (backgrounded) finish();
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setCopyFallback(false);
    } catch {
      setCopyFallback(true);
      reportRef.current?.focus();
      reportRef.current?.select();
    }
  }

  return (
    <aside className={styles.panel} aria-label={vi ? "Kiểm tra video" : "Video diagnostics"}>
      {blurDisabled ? <style>{withoutBlur}</style> : null}
      <details open>
        <summary>{vi ? "Kiểm tra video" : "Video diagnostics"}</summary>
        {measuring ? <p role="status">{vi ? "Đang đo 8 giây. Hãy cuộn như bình thường, giữ nguyên tab." : "Measuring for 8 seconds. Scroll normally and keep this tab visible."}</p> : (
          <>
            <p>{vi ? "Đo rồi cuộn trong 8 giây. Dữ liệu chỉ nằm trên máy; sao chép để chia sẻ kết quả." : "Start, then scroll for 8 seconds. Results stay on this device; copy them to share."}</p>
            <label className={styles.option}>
              <input type="checkbox" checked={blurDisabled} onChange={(event) => setBlurDisabled(event.target.checked)} />
              {vi ? "Tạm tắt làm mờ để so sánh" : "Temporarily disable blur to compare"}
            </label>
            <div className={styles.actions}>
              <button type="button" onClick={measure}>{vi ? "Đo 8 giây" : "Measure 8 seconds"}</button>
              {report ? <button type="button" onClick={copyReport}>{copied ? (vi ? "Đã sao chép" : "Copied") : (vi ? "Sao chép" : "Copy")}</button> : null}
            </div>
            {report ? <>
              <textarea aria-label={vi ? "Kết quả kiểm tra" : "Diagnostic results"} className={styles.report} readOnly ref={reportRef} value={report} rows={4} />
              {copyFallback ? <p role="status">{vi ? "Chọn và sao chép nội dung trong ô kết quả." : "Select and copy the text in the results box."}</p> : null}
            </> : null}
          </>
        )}
      </details>
    </aside>
  );
}

export default function MediaPlaybackDiagnostics() {
  const enabled = useSyncExternalStore(noSubscription, isDebugEnabled, serverDebugEnabled);
  return enabled ? <DebugPanel /> : null;
}
