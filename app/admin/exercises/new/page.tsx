import Link from "next/link";
import ExerciseForm from "@/components/admin/ExerciseForm";
import { EMPTY_EXERCISE_FORM } from "@/lib/exercises/constants";
import { getSourceExerciseById, getSourceExerciseOptions } from "@/lib/exercises/source";

export default async function NewExercisePage({ searchParams }: { searchParams: Promise<{ sourceId?: string }> }) {
  const params = await searchParams;
  const sourceId = Number(params.sourceId);
  const sourceExercise = Number.isInteger(sourceId) && sourceId > 0 ? getSourceExerciseById(sourceId) : null;

  return (
    <main className="admin-page admin-editor-page">
      <header className="admin-page-header admin-page-header--editor">
        <div><Link className="admin-back-link" href="/admin/exercises">← Back to list</Link><span className="admin-eyebrow">BUILD · NEW EXERCISE</span><h1>Create exercise</h1><p className="admin-muted">Enter details manually or prefill them from MuscleWiki data.</p></div>
        <div className="admin-header-actions"><Link className="admin-button" href="/">Back to public site</Link></div>
      </header>
      <ExerciseForm initialValues={sourceExercise ?? EMPTY_EXERCISE_FORM} mode="create" sourceOptions={getSourceExerciseOptions()} />
    </main>
  );
}
