"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { resetSavedExercises } from "@/lib/exercises/use-saved-exercise";
import { useAppLanguage } from "@/components/LanguageProvider";
import { getMessages, translate } from "@/lib/i18n/messages";

export default function FavoriteRemoveButton({ exerciseId, exerciseName }: { exerciseId: string; exerciseName: string }) {
  const { language } = useAppLanguage();
  const messages = getMessages(language);
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
        throw new Error(body?.error || "Unable to remove the saved exercise.");
      }
      resetSavedExercises();
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update your saved exercises.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="favorite-card__remove-control">
      <button aria-label={translate(language, "removeNamedFavorite", { name: exerciseName })} disabled={pending} onClick={remove} type="button">
        <svg aria-hidden="true" fill="currentColor" height="21" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24" width="21">
          <path d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1.55.83L12 17.2l-5.45 3.63A1 1 0 0 1 5 20V4a1 1 0 0 1 1-1Z" />
        </svg>
        <span>{pending ? messages.removing : messages.remove}</span>
      </button>
      {error ? <small role="alert">{language === "vi" ? messages.favoriteUpdateFailed : error}</small> : null}
    </div>
  );
}
