"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RemoveFavoriteButton({ exerciseId, exerciseName }: { exerciseId: string; exerciseName: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function removeFavorite() {
    if (pending) return;
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/favorite-exercises", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(body?.error || "Không thể bỏ bài tập khỏi danh sách yêu thích.");
      }
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể cập nhật danh sách yêu thích.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="admin-favorite-remove">
      <button
        aria-label={`Bỏ lưu bài tập ${exerciseName}`}
        className="admin-row-action admin-row-action--danger"
        disabled={pending}
        onClick={removeFavorite}
        type="button"
      >
        {pending ? "Đang bỏ lưu…" : "Bỏ lưu"}
      </button>
      {error ? <span className="admin-favorite-remove__error" role="alert">{error}</span> : null}
    </div>
  );
}
