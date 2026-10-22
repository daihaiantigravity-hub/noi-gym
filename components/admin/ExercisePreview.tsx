"use client";

import { useState } from "react";
import type { ExerciseFormValues } from "@/lib/exercises/types";
import { getDifficultyLabel, getEquipmentLabel, getMechanicLabel, getMuscleLabel, getStatusLabel } from "@/lib/exercises/labels";

type PreviewMode = "list" | "detail";

function getPreviewMedia(values: ExerciseFormValues) {
  return values.media.filter((item) => item.videoUrl);
}

function PreviewMedia({ values, detail = false }: { values: ExerciseFormValues; detail?: boolean }) {
  const media = getPreviewMedia(values)[0];

  return (
    <div className={`admin-preview-media${detail ? " admin-preview-media--detail" : ""}`}>
      {media?.videoUrl ? <video aria-label="Video demo bài tập" autoPlay className="admin-preview-media__video" loop muted playsInline poster={media.posterUrl || undefined} preload="metadata" src={media.videoUrl} /> : null}
      <div className="admin-preview-media__shade" />
      {!media?.videoUrl ? (
        <div className="admin-preview-media__placeholder">
          <span>CHƯA CÓ VIDEO</span>
          <strong>{values.name.trim() || "BÀI TẬP MỚI"}</strong>
        </div>
      ) : null}
      <span className="admin-preview-media__badge">{values.difficulty || "Chưa phân loại"}</span>
      {media?.videoUrl ? <span className="admin-preview-media__play" aria-label="Video đang phát lặp">↻</span> : null}
    </div>
  );
}

function ListPreview({ values }: { values: ExerciseFormValues }) {
  const title = values.name.trim() || "Tên bài tập";
  const muscles = values.primaryMuscles.filter(Boolean);
  const steps = values.steps.filter(Boolean);
  const mediaCount = getPreviewMedia(values).length;

  return (
    <div className="admin-preview-public-page">
      <span className="admin-preview-context">CÔNG KHAI · DANH SÁCH BÀI TẬP</span>
      <article className="admin-preview-list-card">
        <div className="admin-preview-list-card__heading"><h3>{title}</h3><span aria-hidden="true">›</span></div>
        <PreviewMedia values={values} />
        <p className="admin-preview-list-card__summary">{values.difficulty ? getDifficultyLabel(values.difficulty) : "Chưa phân loại"} · {steps.length} bước</p>
        <div className="admin-preview-tags">
          {muscles.length > 0 ? muscles.slice(0, 3).map((muscle) => <span key={muscle}>{getMuscleLabel(muscle)}</span>) : <span>Chưa chọn nhóm cơ</span>}
          {values.category ? <span>{getEquipmentLabel(values.category)}</span> : null}
        </div>
        {mediaCount > 1 ? <small className="admin-preview-media-count">{mediaCount} media sẽ hiển thị trong băng chuyền</small> : null}
      </article>
    </div>
  );
}

function DetailPreview({ values }: { values: ExerciseFormValues }) {
  const title = values.name.trim() || "Tên bài tập";
  const steps = values.steps.filter(Boolean);
  const description = values.description.trim() || "Mô tả bài tập sẽ hiển thị ở đây.";

  return (
    <div className="admin-preview-public-page admin-preview-public-page--detail">
      <span className="admin-preview-context">CÔNG KHAI · CHI TIẾT BÀI TẬP</span>
      <PreviewMedia detail values={values} />
      <div className="admin-preview-detail-copy">
        <h3>{title}</h3>
        <p>{description}</p>
        <div className="admin-preview-detail-meta"><span>{values.category ? getEquipmentLabel(values.category) : "Dụng cụ"}</span><span>{values.difficulty ? getDifficultyLabel(values.difficulty) : "Độ khó"}</span><span>{values.mechanic ? getMechanicLabel(values.mechanic) : "Cơ chế"}</span></div>
        <h4>Hướng dẫn thực hiện</h4>
        {steps.length > 0 ? <ol>{steps.slice(0, 4).map((step, index) => <li key={`${step}-${index}`}><span>{index + 1}</span><p>{step}</p></li>)}</ol> : <p className="admin-preview-empty-copy">Các bước thực hiện sẽ hiển thị ở đây.</p>}
      </div>
    </div>
  );
}

export default function ExercisePreview({ values }: { values: ExerciseFormValues }) {
  const [mode, setMode] = useState<PreviewMode>("list");

  return (
    <aside className="admin-preview-column" aria-label="Xem trước bài tập">
      <div className="admin-preview-heading"><div><span className="admin-eyebrow">XEM TRƯỚC TRỰC TIẾP</span><h2>Xem trước</h2></div><span className={`admin-preview-status admin-preview-status--${values.status.toLowerCase()}`}>{getStatusLabel(values.status)}</span></div>
      <div className="admin-preview-tabs" role="tablist" aria-label="Kiểu xem trước">
        <button aria-selected={mode === "list"} className={mode === "list" ? "admin-preview-tab admin-preview-tab--active" : "admin-preview-tab"} onClick={() => setMode("list")} role="tab" type="button">Danh sách</button>
        <button aria-selected={mode === "detail"} className={mode === "detail" ? "admin-preview-tab admin-preview-tab--active" : "admin-preview-tab"} onClick={() => setMode("detail")} role="tab" type="button">Chi tiết</button>
      </div>
      <div className="admin-preview-viewport">{mode === "list" ? <ListPreview values={values} /> : <DetailPreview values={values} />}</div>
      <p className="admin-preview-note">Bản xem trước cập nhật theo dữ liệu trong biểu mẫu và mô phỏng giao diện công khai sau khi bài tập được xuất bản.</p>
    </aside>
  );
}
