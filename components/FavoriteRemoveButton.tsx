"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { resetSavedExercises } from "@/lib/exercises/use-saved-exercise";

export default function FavoriteRemoveButton({ exerciseId, exerciseName }: { exerciseId: string; exerciseName: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (pending) return;
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/favorite-exercises", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(body?.error || "Không thể bỏ lưu bài tập.");
      }
      resetSavedExercises();
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể cập nhật danh sách yêu thích.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="favorite-card__remove-control">
      <button aria-label={`Bỏ lưu ${exerciseName}`} disabled={pending} onClick={remove} type="button">
        <svg aria-hidden="true" fill="currentColor" height="21" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24" width="21">
          <path d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1.55.83L12 17.2l-5.45 3.63A1 1 0 0 1 5 20V4a1 1 0 0 1 1-1Z" />
        </svg>
        <span>{pending ? "Đang bỏ lưu…" : "Bỏ lưu"}</span>
      </button>
      {error ? <small role="alert">{error}</small> : null}
    </div>
  );
}
