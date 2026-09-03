"use client";

import { deleteExerciseAction } from "@/app/actions/exercises";

export default function DeleteExerciseButton({ id }: { id: string }) {
  return (
    <form action={deleteExerciseAction} onSubmit={(event) => { if (!window.confirm("Xóa bài tập này?")) event.preventDefault(); }}>
      <input name="id" type="hidden" value={id} />
      <button aria-label="Xóa bài tập" className="admin-row-action admin-row-action--danger" type="submit">Xóa</button>
    </form>
  );
}
