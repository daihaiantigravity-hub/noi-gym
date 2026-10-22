"use client";

import { useActionState } from "react";
import { importExercisesAction, type ExerciseActionState } from "@/app/actions/exercises";

const initialState: ExerciseActionState = {};

export default function ImportForm() {
  const [state, formAction, pending] = useActionState(importExercisesAction, initialState);

  return (
    <form action={formAction} className="admin-import-form">
      <label className="admin-upload-box">
        <span className="admin-upload-icon">↑</span>
        <strong>Select a JSON file</strong>
        <small>Supports direct MuscleWiki files or playground wrappers, up to 5 MB.</small>
        <input accept="application/json,.json" name="file" required type="file" />
      </label>
      {state.error ? <p className="admin-form-error" role="alert">{state.error}</p> : null}
      {state.success ? <p className="admin-form-success" role="status">{state.success}</p> : null}
      <button className="admin-button admin-button--primary" disabled={pending} type="submit">{pending ? "Importing…" : "Import as Draft"}</button>
    </form>
  );
}
