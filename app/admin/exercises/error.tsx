"use client";

export default function AdminExercisesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="admin-page">
      <section className="admin-error-state" role="alert">
        <span className="admin-eyebrow">EXERCISE LIBRARY</span>
        <h1>Unable to load data</h1>
        <p>Check the Supabase configuration or reload the dashboard.</p>
        <button className="admin-button admin-button--primary" onClick={() => reset()} type="button">Try again</button>
      </section>
    </main>
  );
}
