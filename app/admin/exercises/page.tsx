import Link from "next/link";
import DeleteExerciseButton from "@/components/admin/DeleteExerciseButton";
import AdminExerciseFilters from "@/components/admin/AdminExerciseFilters";
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
    published: items.filter((item) => item.status === "Published").length,
    archived: items.filter((item) => item.status === "Archived").length,
  };
}

function formatDate(value: string) {
  if (!value) return "JSON data";
  return new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

export default async function AdminExercisesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = firstParam(params.q) ?? "";
  const category = firstParam(params.category) ?? "";
  const status = firstParam(params.status) ?? "";
  const muscle = firstParam(params.muscle) ?? "";
  const source = firstParam(params.source) ?? "";
  const gender = firstParam(params.gender) ?? "";
  const page = Math.max(Number(firstParam(params.page) ?? 1) || 1, 1);
  const requestedPageSize = Number(firstParam(params.pageSize) ?? 50);
  const pageSize = [20, 50, 100].includes(requestedPageSize) ? requestedPageSize : 50;
  const databaseConfigured = isDatabaseConfigured();

  const filters: ExerciseListFilters = { page, pageSize, query, category, status: status as ExerciseListFilters["status"], muscle, source: source as ExerciseListFilters["source"], gender: gender as ExerciseListFilters["gender"] };
  const localItems = getLocalExerciseList({ query, category, status, gender: gender as ExerciseListFilters["gender"] });
  const [result, stats] = databaseConfigured ? await Promise.all([listExercises(filters), getExerciseStats()]) : [null, localStats(getLocalExerciseList({}))];
  const items = result?.items ?? localItems.slice((page - 1) * pageSize, page * pageSize);
  const total = result?.total ?? localItems.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const rangeStart = total ? (page - 1) * pageSize + 1 : 0;
  const rangeEnd = Math.min(page * pageSize, total);
  function listHref(nextPage: number, nextPageSize = pageSize) {
    const next = new URLSearchParams({ q: query, category, muscle, status, gender, page: String(nextPage), pageSize: String(nextPageSize) });
    if (source) next.set("source", source);
    return `?${next}`;
  }

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <span className="admin-eyebrow">BUILD · EXERCISE LIBRARY</span>
          <h1>Exercise management</h1>
          <p className="admin-muted">Create, standardize, and publish content for the Noi Gym library.</p>
        </div>
        <div className="admin-header-actions">
          <Link className="admin-button" href="/admin/exercises/import">Import JSON</Link>
          <Link className="admin-button admin-button--primary" href="/admin/exercises/new">+ Create exercise</Link>
        </div>
      </header>

      <section className="admin-stats" aria-label="Exercise statistics">
        <div className="admin-stat-card"><span>Total exercises</span><strong>{stats.total}</strong><small>{databaseConfigured ? "In database" : "From local JSON"}</small></div>
        <div className="admin-stat-card admin-stat-card--orange"><span>Draft</span><strong>{stats.draft}</strong><small>Needs completion</small></div>
        <div className="admin-stat-card admin-stat-card--green"><span>Published</span><strong>{stats.published}</strong><small>Visible publicly</small></div>
        <div className="admin-stat-card admin-stat-card--muted"><span>Archived</span><strong>{stats.archived}</strong><small>Hidden</small></div>
      </section>

      <section className="admin-list-panel">
        <AdminExerciseFilters category={category} gender={gender} key={`${category}:${muscle}:${status}:${gender}:${source}:${pageSize}`} muscle={muscle} pageSize={pageSize} query={query} source={source} status={status} />

        <div className="admin-list-heading"><div><span className="admin-eyebrow">EXERCISES</span><h2>{total.toLocaleString("en-US")} exercises</h2></div><div className="admin-list-page-controls"><span className="admin-list-page">Showing {rangeStart.toLocaleString("en-US")}–{rangeEnd.toLocaleString("en-US")} · Page {page}/{totalPages}</span><div className="admin-page-size">Per page: {[20, 50, 100].map((size) => <Link aria-current={pageSize === size ? "page" : undefined} href={listHref(1, size)} key={size}>{size}</Link>)}</div></div></div>

        {items.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Exercise</th><th>Muscle groups</th><th>Equipment</th><th>Difficulty</th><th>Status</th><th>Updated</th><th /></tr></thead>
              <tbody>
                {items.map((exercise) => (
                  <tr key={exercise.id}>
                    <td><div className="admin-exercise-name"><strong>{exercise.name}</strong><small>{exercise.source === "musclewiki" ? `MuscleWiki #${exercise.sourceId}` : "Custom"} · {exercise.stepsCount} steps · {exercise.mediaCount} media{exercise.femaleMediaCount > 0 ? ` · ${exercise.femaleMediaCount} female videos` : ""}</small></div></td>
                    <td><div className="admin-tag-list">{exercise.primaryMuscles.slice(0, 2).map((item) => <span className="admin-tag" key={item}>{item}</span>)}{exercise.primaryMuscles.length > 2 ? <span className="admin-tag">+{exercise.primaryMuscles.length - 2}</span> : null}</div></td>
                    <td>{exercise.category || "—"}</td>
                    <td>{exercise.difficulty || "—"}</td>
                    <td><span className={`admin-status admin-status--${exercise.status.toLowerCase()}`}>{exercise.status}</span></td>
                    <td>{formatDate(exercise.updatedAt)}</td>
                    <td><div className="admin-row-actions">{databaseConfigured && exercise.id ? <><Link className="admin-row-action" href={`/admin/exercises/${exercise.id}/edit`}>Edit</Link><DeleteExerciseButton id={exercise.id} /></> : <Link className="admin-row-action admin-row-action--accent" href={`/admin/exercises/new?sourceId=${exercise.sourceId}`}>Use template</Link>}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="admin-empty-state"><strong>No exercises found</strong><p>Try changing the filters or create a new exercise.</p></div>}

        <nav className="admin-pagination" aria-label="Pagination">
          {page > 1 ? <Link className="admin-button admin-button--small" href={listHref(page - 1)}>← Previous</Link> : <span />}
          {page < totalPages ? <Link className="admin-button admin-button--small" href={listHref(page + 1)}>Next →</Link> : <span />}
        </nav>
      </section>
    </main>
  );
}
