import Link from "next/link";
import RemoveFavoriteButton from "@/components/admin/RemoveFavoriteButton";
import { listAdminFavoriteExercises } from "@/lib/exercises/favorites";
import { isDatabaseConfigured, isSupabaseConfigured } from "@/lib/supabase/server";

function formatSavedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function AdminFavoritesPage() {
  const configured = isSupabaseConfigured() && isDatabaseConfigured();
  const favorites = configured ? await listAdminFavoriteExercises() : [];

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <span className="admin-eyebrow">BUILD · FEATURED EXERCISES</span>
          <h1>Featured exercises</h1>
          <p className="admin-muted">Exercises selected by administrators to appear before community popularity ranking.</p>
        </div>
        <div className="admin-header-actions">
          <Link className="admin-button" href="/">Find more exercises</Link>
          <Link className="admin-button admin-button--primary" href="/admin/exercises">Manage exercises</Link>
        </div>
      </header>

      <section className="admin-list-panel" aria-labelledby="admin-favorites-title">
        <div className="admin-list-heading">
          <div>
            <span className="admin-eyebrow">FEATURED</span>
            <h2 id="admin-favorites-title">{favorites.length.toLocaleString("en-US")} featured exercises</h2>
          </div>
          <span className="admin-list-page">Recently featured exercises appear first</span>
        </div>

        {favorites.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table admin-favorites-table">
              <thead>
                <tr>
                  <th>Exercise</th>
                  <th>Muscle groups</th>
                  <th>Equipment</th>
                  <th>Difficulty</th>
                  <th>Saved</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {favorites.map((exercise) => (
                  <tr key={exercise.id}>
                    <td>
                      <div className="admin-exercise-name">
                        <strong>{exercise.name}</strong>
                        <small>{exercise.mediaLabel} · {exercise.status}</small>
                      </div>
                    </td>
                    <td>
                      <div className="admin-tag-list">
                        {exercise.primaryMuscles.slice(0, 2).map((muscle) => <span className="admin-tag" key={muscle}>{muscle}</span>)}
                        {exercise.primaryMuscles.length > 2 ? <span className="admin-tag">+{exercise.primaryMuscles.length - 2}</span> : null}
                      </div>
                    </td>
                    <td>{exercise.category || "—"}</td>
                    <td>{exercise.difficulty || "—"}</td>
                    <td>{formatSavedAt(exercise.savedAt)}</td>
                    <td>
                      <div className="admin-row-actions admin-favorite-actions">
                        {exercise.status === "Published" ? <Link className="admin-row-action" href={exercise.publicHref}>View</Link> : null}
                        <Link className="admin-row-action" href={`/admin/exercises/${exercise.id}/edit`}>Edit</Link>
                        <RemoveFavoriteButton exerciseId={exercise.id} exerciseName={exercise.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty-state">
            <span aria-hidden="true" className="admin-favorites-empty-icon">
              <svg fill="none" height="32" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24" width="32">
                <path d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1.55.83L12 17.2l-5.45 3.63A1 1 0 0 1 5 20V4a1 1 0 0 1 1-1Z" />
              </svg>
            </span>
            <strong>No featured exercises yet</strong>
            <p>Use an administrator account to save an exercise from the public library and add it to the featured group.</p>
            <Link className="admin-button admin-button--small" href="/">Find exercises</Link>
          </div>
        )}
      </section>
    </main>
  );
}
