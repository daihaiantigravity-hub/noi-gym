import Link from "next/link";
import { notFound } from "next/navigation";
import ExerciseForm from "@/components/admin/ExerciseForm";
import { getSourceExerciseOptions } from "@/lib/exercises/source";
import { getExercise } from "@/lib/exercises/repository";
import { getAppLanguage } from "@/lib/i18n/server";
import { getWorkspaceMessages } from "@/lib/i18n/workspace-messages";

export default async function EditExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exercise = await getExercise(id);
  if (!exercise) notFound();
  const text = getWorkspaceMessages(await getAppLanguage());
  const sourceOptions = getSourceExerciseOptions();
  if (exercise.source === "musclewiki" && exercise.sourceId && !sourceOptions.some((option) => option.id === exercise.sourceId)) {
    sourceOptions.push({
      id: exercise.sourceId,
      name: exercise.name,
      category: exercise.category,
      primaryMuscles: exercise.primaryMuscles,
      difficulty: exercise.difficulty,
    });
  }

  return (
    <main className="admin-page admin-editor-page">
      <header className="admin-page-header admin-page-header--editor">
        <div><Link className="admin-back-link" href="/admin/exercises">← Back to list</Link><span className="admin-eyebrow">BUILD · EDIT EXERCISE</span><h1>Edit exercise</h1><p className="admin-muted">Update the content and publication status.</p></div>
      </header>
      <div className="admin-header-actions translation-editor-link"><Link className="admin-button" href={`/admin/translations/${id}?locale=vi`}>{text.editTranslation}</Link></div>
      <ExerciseForm initialValues={{ ...exercise, id: exercise.id }} mode="edit" sourceOptions={sourceOptions} />
    </main>
  );
}
