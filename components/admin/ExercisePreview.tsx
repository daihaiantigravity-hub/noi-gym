"use client";

import { useState } from "react";
import type { ExerciseFormValues } from "@/lib/exercises/types";

type PreviewMode = "list" | "detail";

function getPreviewMedia(values: ExerciseFormValues) {
  return values.media.filter((item) => item.videoUrl);
}

function PreviewMedia({ values, detail = false }: { values: ExerciseFormValues; detail?: boolean }) {
  const media = getPreviewMedia(values)[0];

  return (
    <div className={`admin-preview-media${detail ? " admin-preview-media--detail" : ""}`}>
      {media?.videoUrl ? <video aria-label="Exercise demo video" autoPlay className="admin-preview-media__video" loop muted playsInline poster={media.posterUrl || undefined} preload="metadata" src={media.videoUrl} /> : null}
      <div className="admin-preview-media__shade" />
      {!media?.videoUrl ? (
        <div className="admin-preview-media__placeholder">
          <span>NO VIDEO</span>
          <strong>{values.name.trim() || "NEW EXERCISE"}</strong>
        </div>
      ) : null}
      <span className="admin-preview-media__badge">{values.difficulty || "Uncategorized"}</span>
      {media?.videoUrl ? <span className="admin-preview-media__play" aria-label="Video is looping">↻</span> : null}
    </div>
  );
}

function ListPreview({ values }: { values: ExerciseFormValues }) {
  const title = values.name.trim() || "Exercise name";
  const muscles = values.primaryMuscles.filter(Boolean);
  const steps = values.steps.filter(Boolean);
  const mediaCount = getPreviewMedia(values).length;

  return (
    <div className="admin-preview-public-page">
      <span className="admin-preview-context">PUBLIC · EXERCISE LIST</span>
      <article className="admin-preview-list-card">
        <div className="admin-preview-list-card__heading"><h3>{title}</h3><span aria-hidden="true">›</span></div>
        <PreviewMedia values={values} />
        <p className="admin-preview-list-card__summary">{values.difficulty || "Uncategorized"} · {steps.length} steps</p>
        <div className="admin-preview-tags">
          {muscles.length > 0 ? muscles.slice(0, 3).map((muscle) => <span key={muscle}>{muscle}</span>) : <span>No muscle groups selected</span>}
          {values.category ? <span>{values.category}</span> : null}
        </div>
        {mediaCount > 1 ? <small className="admin-preview-media-count">{mediaCount} media items will appear in the carousel</small> : null}
      </article>
    </div>
  );
}

function DetailPreview({ values }: { values: ExerciseFormValues }) {
  const title = values.name.trim() || "Exercise name";
  const steps = values.steps.filter(Boolean);
  const description = values.description.trim() || "The exercise description will appear here.";

  return (
    <div className="admin-preview-public-page admin-preview-public-page--detail">
      <span className="admin-preview-context">PUBLIC · EXERCISE DETAIL</span>
      <PreviewMedia detail values={values} />
      <div className="admin-preview-detail-copy">
        <h3>{title}</h3>
        <p>{description}</p>
        <div className="admin-preview-detail-meta"><span>{values.category || "Equipment"}</span><span>{values.difficulty || "Difficulty"}</span><span>{values.mechanic || "Mechanic"}</span></div>
        <h4>Instructions</h4>
        {steps.length > 0 ? <ol>{steps.slice(0, 4).map((step, index) => <li key={`${step}-${index}`}><span>{index + 1}</span><p>{step}</p></li>)}</ol> : <p className="admin-preview-empty-copy">Exercise steps will appear here.</p>}
      </div>
    </div>
  );
}

export default function ExercisePreview({ values }: { values: ExerciseFormValues }) {
  const [mode, setMode] = useState<PreviewMode>("list");

  return (
    <aside className="admin-preview-column" aria-label="Exercise preview">
      <div className="admin-preview-heading"><div><span className="admin-eyebrow">LIVE PREVIEW</span><h2>Preview</h2></div><span className={`admin-preview-status admin-preview-status--${values.status.toLowerCase()}`}>{values.status}</span></div>
      <div className="admin-preview-tabs" role="tablist" aria-label="Preview mode">
        <button aria-selected={mode === "list"} className={mode === "list" ? "admin-preview-tab admin-preview-tab--active" : "admin-preview-tab"} onClick={() => setMode("list")} role="tab" type="button">List</button>
        <button aria-selected={mode === "detail"} className={mode === "detail" ? "admin-preview-tab admin-preview-tab--active" : "admin-preview-tab"} onClick={() => setMode("detail")} role="tab" type="button">Details</button>
      </div>
      <div className="admin-preview-viewport">{mode === "list" ? <ListPreview values={values} /> : <DetailPreview values={values} />}</div>
      <p className="admin-preview-note">The preview updates with the form data and simulates the public interface after the exercise is published.</p>
    </aside>
  );
}
