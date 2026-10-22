import Link from "next/link";
import ImportForm from "@/components/admin/ImportForm";

export default function ImportExercisesPage() {
  return (
    <main className="admin-page admin-editor-page">
      <header className="admin-page-header admin-page-header--editor">
        <div><Link className="admin-back-link" href="/admin/exercises">← Back to list</Link><span className="admin-eyebrow">BUILD · IMPORT</span><h1>Import exercises</h1><p className="admin-muted">Add JSON data to the database as drafts for review before publishing.</p></div>
      </header>
      <section className="admin-panel admin-import-panel">
        <div className="admin-panel-heading"><div><span className="admin-eyebrow">JSON DATASET</span><h2>MuscleWiki exercise data</h2></div><span className="admin-panel-number">↓</span></div>
        <ImportForm />
      </section>
    </main>
  );
}
