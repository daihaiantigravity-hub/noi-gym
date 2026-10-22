"use client";

import { useSavedExercise } from "@/lib/exercises/use-saved-exercise";

export default function ExerciseDetailSaveButton({ exerciseId, exerciseName }: { exerciseId: string; exerciseName: string }) {
  const { error, isLoading, isPending, isSaved, toggleSaved } = useSavedExercise(exerciseId);
  const label = `${isSaved ? "Remove saved exercise" : "Save exercise"} ${exerciseName}`;

  return (
    <div className="exercise-detail-topbar__save-control">
      <button
        aria-label={label}
        aria-pressed={isSaved}
        className="exercise-detail-topbar__icon exercise-detail-topbar__save"
        disabled={isLoading || isPending}
        onClick={toggleSaved}
        title={label}
        type="button"
      >
        <svg aria-hidden="true" fill={isSaved ? "currentColor" : "none"} height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width="24">
          <path d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1.55.83L12 17.2l-5.45 3.63A1 1 0 0 1 5 20V4a1 1 0 0 1 1-1Z" />
        </svg>
      </button>
      {error && <p className="exercise-detail-topbar__save-error" role="alert">{error}</p>}
    </div>
  );
}
