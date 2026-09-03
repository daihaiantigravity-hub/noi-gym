"use client";

import { useActionState, useState } from "react";
import { saveExerciseAction, type ExerciseActionState } from "@/app/actions/exercises";
import ExercisePreview from "@/components/admin/ExercisePreview";
import { EXERCISE_CATEGORIES, EXERCISE_DIFFICULTIES, EXERCISE_FORCES, EXERCISE_GRIPS, EXERCISE_MECHANICS, EXERCISE_MUSCLES, EXERCISE_STATUSES } from "@/lib/exercises/constants";
import { slugify } from "@/lib/exercises/slug";
import type { ExerciseFormValues, ExerciseMediaValue, ExerciseSourceOption } from "@/lib/exercises/types";

const initialActionState: ExerciseActionState = {};

function mediaValue(): ExerciseMediaValue {
  return { gender: "male", angle: "front", videoUrl: "", posterUrl: "" };
}

export default function ExerciseForm({
  mode,
  initialValues,
  sourceOptions,
}: {
  mode: "create" | "edit";
  initialValues: ExerciseFormValues & { id?: string | null };
  sourceOptions: ExerciseSourceOption[];
}) {
  const [values, setValues] = useState(initialValues);
  const [slugEdited, setSlugEdited] = useState(mode === "edit");
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceError, setSourceError] = useState("");
  const [state, formAction, pending] = useActionState(saveExerciseAction, initialActionState);

  function updateField<K extends keyof typeof values>(field: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSourceChange(sourceIdValue: string) {
    const sourceId = Number(sourceIdValue);
    setSourceError("");

    if (!sourceIdValue) {
      setValues((current) => ({ ...current, source: "custom", sourceId: null, sourceSnapshot: null }));
      return;
    }

    setSourceLoading(true);
    try {
      const response = await fetch(`/api/admin/source-exercises?sourceId=${sourceId}`);
      const data = (await response.json()) as ExerciseFormValues & { error?: string };
      if (!response.ok) throw new Error(data.error || "Không thể tải bài tập nguồn");

      setValues((current) => ({ ...current, ...data, id: current.id, status: current.status === "Published" ? "Draft" : current.status }));
      setSlugEdited(false);
    } catch (error) {
      setSourceError(error instanceof Error ? error.message : "Không thể tải bài tập nguồn");
    } finally {
      setSourceLoading(false);
    }
  }

  function toggleMuscle(muscle: string) {
    setValues((current) => ({
      ...current,
      primaryMuscles: current.primaryMuscles.includes(muscle)
        ? current.primaryMuscles.filter((item) => item !== muscle)
        : [...current.primaryMuscles, muscle],
    }));
  }

  function updateStep(index: number, value: string) {
    setValues((current) => ({ ...current, steps: current.steps.map((step, stepIndex) => stepIndex === index ? value : step) }));
  }

  function removeStep(index: number) {
    setValues((current) => ({ ...current, steps: current.steps.length === 1 ? [""] : current.steps.filter((_, stepIndex) => stepIndex !== index) }));
  }

  function updateMedia(index: number, field: keyof ExerciseMediaValue, value: string) {
    setValues((current) => ({
      ...current,
      media: current.media.map((item, mediaIndex) => mediaIndex === index ? { ...item, [field]: value } : item),
    }));
  }

  return (
    <form action={formAction} className="admin-exercise-form">
      <input name="payload" type="hidden" value={JSON.stringify(values)} />

      <div className="admin-editor-workspace">
        <div className="admin-form-column admin-editor-form-column">
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div><span className="admin-eyebrow">01 · Thông tin chính</span><h2>Nội dung bài tập</h2></div>
              <span className="admin-panel-number">A</span>
            </div>

            <label className="admin-field admin-field--wide">
              <span>Tên bài tập <em>*</em></span>
              <input required value={values.name} onChange={(event) => { const name = event.target.value; setValues((current) => ({ ...current, name, slug: slugEdited ? current.slug : slugify(name) })); }} />
            </label>
            <label className="admin-field admin-field--wide">
              <span>Slug <em>*</em></span>
              <input required value={values.slug} onChange={(event) => { setSlugEdited(true); updateField("slug", event.target.value); }} />
              <small>Dùng cho URL và nhận diện duy nhất bài tập.</small>
            </label>
            <label className="admin-field admin-field--wide">
              <span>Mô tả</span>
              <textarea rows={4} value={values.description} onChange={(event) => updateField("description", event.target.value)} />
            </label>
            <div className="admin-field admin-field--wide">
              <span>Nhóm cơ chính <em>*</em></span>
              <div className="admin-chip-grid">
                {EXERCISE_MUSCLES.map((muscle) => (
                  <label className={`admin-chip${values.primaryMuscles.includes(muscle) ? " admin-chip--selected" : ""}`} key={muscle}>
                    <input checked={values.primaryMuscles.includes(muscle)} onChange={() => toggleMuscle(muscle)} type="checkbox" />
                    {muscle}
                  </label>
                ))}
              </div>
            </div>
            <div className="admin-two-fields">
              <label className="admin-field"><span>Equipment <em>*</em></span><select required={values.status === "Published"} value={values.category} onChange={(event) => updateField("category", event.target.value)}><option value="">Chọn equipment</option>{EXERCISE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
              <label className="admin-field"><span>Difficulty <em>*</em></span><select required={values.status === "Published"} value={values.difficulty} onChange={(event) => updateField("difficulty", event.target.value as typeof values.difficulty)}><option value="">Chọn độ khó</option>{EXERCISE_DIFFICULTIES.map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}</select></label>
            </div>
            <div className="admin-three-fields">
              <label className="admin-field"><span>Force</span><select value={values.force} onChange={(event) => updateField("force", event.target.value as typeof values.force)}><option value="">Chưa chọn</option>{EXERCISE_FORCES.map((force) => <option key={force} value={force}>{force}</option>)}</select></label>
              <label className="admin-field"><span>Grip</span><select value={values.grips} onChange={(event) => updateField("grips", event.target.value as typeof values.grips)}><option value="">Chưa chọn</option>{EXERCISE_GRIPS.map((grip) => <option key={grip} value={grip}>{grip}</option>)}</select></label>
              <label className="admin-field"><span>Mechanic</span><select value={values.mechanic} onChange={(event) => updateField("mechanic", event.target.value as typeof values.mechanic)}><option value="">Chưa chọn</option>{EXERCISE_MECHANICS.map((mechanic) => <option key={mechanic} value={mechanic}>{mechanic}</option>)}</select></label>
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-heading"><div><span className="admin-eyebrow">02 · Hướng dẫn</span><h2>Các bước thực hiện</h2></div><button className="admin-button admin-button--small" onClick={() => updateField("steps", [...values.steps, ""])} type="button">+ Thêm bước</button></div>
            <div className="admin-step-list">
              {values.steps.map((step, index) => <div className="admin-step-row" key={`step-${index}`}><span className="admin-step-number">{String(index + 1).padStart(2, "0")}</span><textarea aria-label={`Bước ${index + 1}`} value={step} onChange={(event) => updateStep(index, event.target.value)} /><button aria-label={`Xóa bước ${index + 1}`} className="admin-icon-button" onClick={() => removeStep(index)} type="button">×</button></div>)}
            </div>
          </section>

          <section className="admin-panel admin-panel--accent">
            <div className="admin-panel-heading"><div><span className="admin-eyebrow">03 · Dữ liệu nguồn</span><h2>Prefill từ JSON</h2></div><span className="admin-panel-number">B</span></div>
            <label className="admin-field admin-field--wide">
              <span>Bài tập MuscleWiki</span>
              <select disabled={sourceLoading} value={values.source === "musclewiki" ? String(values.sourceId ?? "") : ""} onChange={(event) => void handleSourceChange(event.target.value)}><option value="">Tạo bài tập custom</option>{sourceOptions.map((option) => <option key={option.id} value={option.id}>{option.id} · {option.name}</option>)}</select>
              <small>{sourceLoading ? "Đang tải dữ liệu…" : "Chọn một record để tự động điền form."}</small>
              {sourceError ? <small className="admin-form-error">{sourceError}</small> : null}
            </label>
            <div className="admin-source-meta"><span>Source</span><strong>{values.source === "musclewiki" ? `MuscleWiki #${values.sourceId}` : "Custom"}</strong></div>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-heading"><div><span className="admin-eyebrow">04 · Media</span><h2>Video và hình đại diện</h2></div><button className="admin-button admin-button--small" onClick={() => updateField("media", [...values.media, mediaValue()])} type="button">+ Thêm media</button></div>
            {values.media.length > 0 ? <div className="admin-media-list">{values.media.map((media, index) => <div className="admin-media-row" key={`media-${index}`}><div className="admin-two-fields"><label className="admin-field"><span>Gender</span><select value={media.gender} onChange={(event) => updateMedia(index, "gender", event.target.value)}><option value="male">Male</option><option value="female">Female</option></select></label><label className="admin-field"><span>Angle</span><select value={media.angle} onChange={(event) => updateMedia(index, "angle", event.target.value)}><option value="front">Front</option><option value="side">Side</option></select></label></div><label className="admin-field admin-field--wide"><span>Video URL</span><input value={media.videoUrl} onChange={(event) => updateMedia(index, "videoUrl", event.target.value)} placeholder="https://…" /></label><label className="admin-field admin-field--wide"><span>Poster URL</span><input value={media.posterUrl} onChange={(event) => updateMedia(index, "posterUrl", event.target.value)} placeholder="https://…" /></label><button className="admin-text-button admin-text-button--danger" onClick={() => updateField("media", values.media.filter((_, mediaIndex) => mediaIndex !== index))} type="button">Xóa media</button></div>)}</div> : <p className="admin-muted">Chưa có media. Có thể bổ sung sau khi tạo bài tập.</p>}
          </section>

          <section className="admin-panel">
            <div className="admin-panel-heading"><div><span className="admin-eyebrow">05 · Trạng thái</span><h2>Xuất bản</h2></div></div>
            <label className="admin-field admin-field--wide"><span>Trạng thái</span><select value={values.status} onChange={(event) => updateField("status", event.target.value as typeof values.status)}>{EXERCISE_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select><small>Draft cho phép lưu dữ liệu chưa hoàn chỉnh. Published sẽ xuất hiện ở public library.</small></label>
          </section>
        </div>

        <ExercisePreview values={values} />
      </div>

      {state.error ? <p className="admin-form-error admin-form-error--global" role="alert">{state.error}</p> : null}
      <div className="admin-form-actions"><a className="admin-button" href="/admin/exercises">Hủy</a><button className="admin-button admin-button--primary" disabled={pending} type="submit">{pending ? "Đang lưu…" : mode === "edit" ? "Lưu thay đổi" : "Tạo bài tập"}</button></div>
    </form>
  );
}
