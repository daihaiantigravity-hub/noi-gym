"use client";

import { deleteExerciseAction } from "@/app/actions/exercises";

export default function DeleteExerciseButton({ id }: { id: string }) {
  return (
    <form action={deleteExerciseAction} onSubmit={(event) => { if (!window.confirm("Delete this exercise?")) event.preventDefault(); }}>
      <input name="id" type="hidden" value={id} />
      <button aria-label="Delete exercise" className="admin-row-action admin-row-action--danger" type="submit">Delete</button>
    </form>
  );
}
