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
        <div><Link className="admin-back-link" href="/admin/exercises">← Quay lại danh sách</Link><span className="admin-eyebrow">BUILD · NEW EXERCISE</span><h1>Tạo bài tập</h1><p className="admin-muted">Điền thông tin thủ công hoặc prefill từ dữ liệu MuscleWiki.</p></div>
      </header>
      <ExerciseForm initialValues={sourceExercise ?? EMPTY_EXERCISE_FORM} mode="create" sourceOptions={getSourceExerciseOptions()} />
    </main>
  );
}
