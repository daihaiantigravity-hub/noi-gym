"use client";

export default function AdminFavoritesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="admin-page">
      <section className="admin-error-state" role="alert">
        <span className="admin-eyebrow">FAVORITES</span>
        <h1>Unable to load featured exercises</h1>
        <p>Check the Supabase connection or reload the page.</p>
        <button className="admin-button admin-button--primary" onClick={() => reset()} type="button">Try again</button>
      </section>
    </main>
  );
}
