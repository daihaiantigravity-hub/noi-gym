import Link from "next/link";
import DeleteExerciseButton from "@/components/admin/DeleteExerciseButton";
import { EXERCISE_CATEGORIES, EXERCISE_MUSCLES, EXERCISE_STATUSES } from "@/lib/exercises/constants";
import { getLocalExerciseList } from "@/lib/exercises/source";
import { listExercises, getExerciseStats } from "@/lib/exercises/repository";
import type { ExerciseListFilters, ExerciseStats } from "@/lib/exercises/types";
import { isDatabaseConfigured } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function localStats(items: ReturnType<typeof getLocalExerciseList>): ExerciseStats {
  return {
    total: items.length,
    draft: items.filter((item) => item.status === "Draft").length,
    published: 0,
    archived: 0,
  };
}

function formatDate(value: string) {
  if (!value) return "Dữ liệu JSON";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

export default async function AdminExercisesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = firstParam(params.q) ?? "";
  const category = firstParam(params.category) ?? "";
  const status = firstParam(params.status) ?? "";
  const muscle = firstParam(params.muscle) ?? "";
  const source = firstParam(params.source) ?? "";
  const page = Math.max(Number(firstParam(params.page) ?? 1) || 1, 1);
  const databaseConfigured = isDatabaseConfigured();

  const filters: ExerciseListFilters = { page, pageSize: 20, query, category, status: status as ExerciseListFilters["status"], muscle, source: source as ExerciseListFilters["source"] };
  const localItems = getLocalExerciseList({ query, category, status });
  const [result, stats] = databaseConfigured ? await Promise.all([listExercises(filters), getExerciseStats()]) : [null, localStats(localItems)];
  const items = result?.items ?? localItems.slice((page - 1) * 20, page * 20);
  const total = result?.total ?? localItems.length;
  const totalPages = Math.max(Math.ceil(total / 20), 1);

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <span className="admin-eyebrow">BUILD · EXERCISE LIBRARY</span>
          <h1>Quản lý bài tập</h1>
          <p className="admin-muted">Tạo, chuẩn hóa và xuất bản nội dung cho thư viện Noi Gym.</p>
        </div>
        <div className="admin-header-actions">
          <Link className="admin-button" href="/admin/exercises/import">Import JSON</Link>
          <Link className="admin-button admin-button--primary" href="/admin/exercises/new">+ Tạo bài tập</Link>
        </div>
      </header>

      <section className="admin-stats" aria-label="Exercise statistics">
        <div className="admin-stat-card"><span>Tổng bài tập</span><strong>{stats.total}</strong><small>{databaseConfigured ? "Trong database" : "Từ JSON local"}</small></div>
        <div className="admin-stat-card admin-stat-card--orange"><span>Draft</span><strong>{stats.draft}</strong><small>Cần hoàn thiện</small></div>
        <div className="admin-stat-card admin-stat-card--green"><span>Published</span><strong>{stats.published}</strong><small>Đang hiển thị public</small></div>
        <div className="admin-stat-card admin-stat-card--muted"><span>Archived</span><strong>{stats.archived}</strong><small>Đã ẩn</small></div>
      </section>

      <section className="admin-list-panel">
        <form className="admin-filter-bar" method="get">
          <label className="admin-search-field"><span aria-hidden="true">⌕</span><input defaultValue={query} name="q" placeholder="Tìm theo tên bài tập…" /></label>
          <select defaultValue={category} name="category"><option value="">Tất cả equipment</option>{EXERCISE_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <select defaultValue={muscle} name="muscle"><option value="">Tất cả nhóm cơ</option>{EXERCISE_MUSCLES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <select defaultValue={status} name="status"><option value="">Tất cả status</option>{EXERCISE_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <button className="admin-button admin-button--small" type="submit">Lọc</button>
        </form>

        <div className="admin-list-heading"><div><span className="admin-eyebrow">EXERCISES</span><h2>{total} bài tập</h2></div><span className="admin-list-page">Trang {page}/{totalPages}</span></div>

        {items.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Bài tập</th><th>Nhóm cơ</th><th>Equipment</th><th>Difficulty</th><th>Status</th><th>Cập nhật</th><th /></tr></thead>
              <tbody>
                {items.map((exercise) => (
                  <tr key={exercise.id}>
                    <td><div className="admin-exercise-name"><strong>{exercise.name}</strong><small>{exercise.source === "musclewiki" ? `MuscleWiki #${exercise.sourceId}` : "Custom"} · {exercise.stepsCount} steps · {exercise.mediaCount} media</small></div></td>
                    <td><div className="admin-tag-list">{exercise.primaryMuscles.slice(0, 2).map((item) => <span className="admin-tag" key={item}>{item}</span>)}{exercise.primaryMuscles.length > 2 ? <span className="admin-tag">+{exercise.primaryMuscles.length - 2}</span> : null}</div></td>
                    <td>{exercise.category || "—"}</td>
                    <td>{exercise.difficulty || "—"}</td>
                    <td><span className={`admin-status admin-status--${exercise.status.toLowerCase()}`}>{exercise.status}</span></td>
                    <td>{formatDate(exercise.updatedAt)}</td>
                    <td><div className="admin-row-actions">{databaseConfigured && exercise.id ? <><Link className="admin-row-action" href={`/admin/exercises/${exercise.id}/edit`}>Sửa</Link><DeleteExerciseButton id={exercise.id} /></> : <Link className="admin-row-action admin-row-action--accent" href={`/admin/exercises/new?sourceId=${exercise.sourceId}`}>Dùng mẫu</Link>}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="admin-empty-state"><strong>Không tìm thấy bài tập</strong><p>Thử thay đổi bộ lọc hoặc tạo một bài tập mới.</p></div>}

        <nav className="admin-pagination" aria-label="Phân trang">
          {page > 1 ? <Link className="admin-button admin-button--small" href={`?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}&muscle=${encodeURIComponent(muscle)}&status=${encodeURIComponent(status)}&page=${page - 1}`}>← Trước</Link> : <span />}
          {page < totalPages ? <Link className="admin-button admin-button--small" href={`?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}&muscle=${encodeURIComponent(muscle)}&status=${encodeURIComponent(status)}&page=${page + 1}`}>Sau →</Link> : <span />}
        </nav>
      </section>
    </main>
  );
}
