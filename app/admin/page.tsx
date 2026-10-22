import Link from "next/link";
import { getExerciseStats } from "@/lib/exercises/repository";
import { getLocalExerciseList } from "@/lib/exercises/source";
import type { ExerciseStats } from "@/lib/exercises/types";
import { isDatabaseConfigured } from "@/lib/supabase/server";

function localStats(items: ReturnType<typeof getLocalExerciseList>): ExerciseStats {
  return {
    total: items.length,
    draft: items.filter((item) => item.status === "Draft").length,
    published: items.filter((item) => item.status === "Published").length,
    archived: items.filter((item) => item.status === "Archived").length,
  };
}

export default async function AdminPage() {
  const databaseConfigured = isDatabaseConfigured();
  const localItems = getLocalExerciseList({});
  const stats = databaseConfigured ? await getExerciseStats() : localStats(localItems);

  return (
    <main className="admin-page admin-dashboard-page">
      <header className="admin-page-header">
        <div>
          <span className="admin-eyebrow">ADMIN · OVERVIEW</span>
          <h1>Overview</h1>
          <p className="admin-muted">Control center for Noi Gym administration.</p>
        </div>
        <div className="admin-header-actions">
          <Link className="admin-button" href="/admin/exercises/import">Import JSON</Link>
          <Link className="admin-button admin-button--primary" href="/admin/exercises/new">+ Create exercise</Link>
        </div>
      </header>

      <section className="admin-stats" aria-label="Exercise library overview">
        <div className="admin-stat-card"><span>Total exercises</span><strong>{stats.total}</strong><small>{databaseConfigured ? "In database" : "From local JSON"}</small></div>
        <div className="admin-stat-card admin-stat-card--orange"><span>Draft</span><strong>{stats.draft}</strong><small>Needs completion</small></div>
        <div className="admin-stat-card admin-stat-card--green"><span>Published</span><strong>{stats.published}</strong><small>Visible publicly</small></div>
        <div className="admin-stat-card admin-stat-card--muted"><span>Archived</span><strong>{stats.archived}</strong><small>Hidden</small></div>
      </section>

      <section className="admin-dashboard-grid" aria-label="Quick actions">
        <div className="admin-panel admin-dashboard-card">
          <div className="admin-panel-heading">
            <div>
              <span className="admin-eyebrow">QUICK ACTIONS</span>
              <h2>Start managing content</h2>
            </div>
            <span className="admin-panel-number">↗</span>
          </div>
          <div className="admin-dashboard-actions">
            <Link className="admin-dashboard-action" href="/admin/exercises">
              <span className="admin-dashboard-action__icon">▤</span>
              <span><strong>Open exercise library</strong><small>View, filter, and edit existing content</small></span>
              <span className="admin-dashboard-action__arrow">→</span>
            </Link>
            <Link className="admin-dashboard-action" href="/admin/favorites">
              <span className="admin-dashboard-action__icon">♡</span>
              <span><strong>Featured exercises</strong><small>Review exercises promoted from the public library</small></span>
              <span className="admin-dashboard-action__arrow">→</span>
            </Link>
            <Link className="admin-dashboard-action" href="/admin/exercises/import">
              <span className="admin-dashboard-action__icon">↓</span>
              <span><strong>Import dataset</strong><small>Add JSON data as drafts</small></span>
              <span className="admin-dashboard-action__arrow">→</span>
            </Link>
            <Link className="admin-dashboard-action" href="/admin/exercises/new">
              <span className="admin-dashboard-action__icon">＋</span>
              <span><strong>Create a new exercise</strong><small>Enter content manually from scratch</small></span>
              <span className="admin-dashboard-action__arrow">→</span>
            </Link>
          </div>
        </div>

        <div className="admin-panel admin-dashboard-card admin-dashboard-card--status">
          <div className="admin-panel-heading">
            <div>
              <span className="admin-eyebrow">SYSTEM STATUS</span>
              <h2>System status</h2>
            </div>
            <span className="admin-dashboard-status-dot" aria-hidden="true" />
          </div>
          <div className="admin-dashboard-status-row"><span>Data source</span><strong>{databaseConfigured ? "Supabase" : "Local JSON"}</strong></div>
          <div className="admin-dashboard-status-row"><span>Mode</span><strong>{databaseConfigured ? "Production data" : "Preview"}</strong></div>
          <p className="admin-dashboard-note">Media, Users, and Settings will be added to the left menu.</p>
        </div>
      </section>
    </main>
  );
}
