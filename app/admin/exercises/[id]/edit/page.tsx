import Link from "next/link";
import { notFound } from "next/navigation";
import ExerciseForm from "@/components/admin/ExerciseForm";
import { getSourceExerciseOptions } from "@/lib/exercises/source";
import { getExercise } from "@/lib/exercises/repository";

export default async function EditExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exercise = await getExercise(id);
  if (!exercise) notFound();

  return (
    <main className="admin-page admin-editor-page">
      <header className="admin-page-header admin-page-header--editor">
        <div><Link className="admin-back-link" href="/admin/exercises">← Quay lại danh sách</Link><span className="admin-eyebrow">BUILD · EDIT EXERCISE</span><h1>Chỉnh sửa bài tập</h1><p className="admin-muted">Cập nhật nội dung và trạng thái xuất bản.</p></div>
      </header>
      <ExerciseForm initialValues={{ ...exercise, id: exercise.id }} mode="edit" sourceOptions={getSourceExerciseOptions()} />
    </main>
  );
}
