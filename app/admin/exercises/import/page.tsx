import Link from "next/link";
import ImportForm from "@/components/admin/ImportForm";

export default function ImportExercisesPage() {
  return (
    <main className="admin-page admin-editor-page">
      <header className="admin-page-header admin-page-header--editor">
        <div><Link className="admin-back-link" href="/admin/exercises">← Quay lại danh sách</Link><span className="admin-eyebrow">QUẢN LÝ · NHẬP DỮ LIỆU</span><h1>Nhập bài tập</h1><p className="admin-muted">Đưa dữ liệu JSON vào cơ sở dữ liệu ở trạng thái bản nháp để kiểm tra trước khi xuất bản.</p></div>
      </header>
      <section className="admin-panel admin-import-panel">
        <div className="admin-panel-heading"><div><span className="admin-eyebrow">BỘ DỮ LIỆU JSON</span><h2>Dữ liệu bài tập MuscleWiki</h2></div><span className="admin-panel-number">↓</span></div>
        <ImportForm />
      </section>
    </main>
  );
}
