import Link from "next/link";
import { getExerciseStats } from "@/lib/exercises/repository";
import { getLocalExerciseList } from "@/lib/exercises/source";
import type { ExerciseStats } from "@/lib/exercises/types";
import { isDatabaseConfigured } from "@/lib/supabase/server";

function localStats(items: ReturnType<typeof getLocalExerciseList>): ExerciseStats {
  return {
    total: items.length,
    draft: items.filter((item) => item.status === "Draft").length,
    published: 0,
    archived: 0,
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
          <h1>Tổng quan</h1>
          <p className="admin-muted">Điểm điều khiển cho các tính năng quản trị của Noi Gym.</p>
        </div>
        <div className="admin-header-actions">
          <Link className="admin-button" href="/admin/exercises/import">Import JSON</Link>
          <Link className="admin-button admin-button--primary" href="/admin/exercises/new">+ Tạo bài tập</Link>
        </div>
      </header>

      <section className="admin-stats" aria-label="Tổng quan thư viện bài tập">
        <div className="admin-stat-card"><span>Tổng bài tập</span><strong>{stats.total}</strong><small>{databaseConfigured ? "Trong database" : "Từ JSON local"}</small></div>
        <div className="admin-stat-card admin-stat-card--orange"><span>Draft</span><strong>{stats.draft}</strong><small>Cần hoàn thiện</small></div>
        <div className="admin-stat-card admin-stat-card--green"><span>Published</span><strong>{stats.published}</strong><small>Đang hiển thị public</small></div>
        <div className="admin-stat-card admin-stat-card--muted"><span>Archived</span><strong>{stats.archived}</strong><small>Đã ẩn</small></div>
      </section>

      <section className="admin-dashboard-grid" aria-label="Tác vụ nhanh">
        <div className="admin-panel admin-dashboard-card">
          <div className="admin-panel-heading">
            <div>
              <span className="admin-eyebrow">QUICK ACTIONS</span>
              <h2>Bắt đầu quản lý nội dung</h2>
            </div>
            <span className="admin-panel-number">↗</span>
          </div>
          <div className="admin-dashboard-actions">
            <Link className="admin-dashboard-action" href="/admin/exercises">
              <span className="admin-dashboard-action__icon">▤</span>
              <span><strong>Mở thư viện bài tập</strong><small>Xem, lọc và chỉnh sửa nội dung hiện có</small></span>
              <span className="admin-dashboard-action__arrow">→</span>
            </Link>
            <Link className="admin-dashboard-action" href="/admin/exercises/import">
              <span className="admin-dashboard-action__icon">↓</span>
              <span><strong>Import dataset</strong><small>Đưa dữ liệu JSON vào trạng thái Draft</small></span>
              <span className="admin-dashboard-action__arrow">→</span>
            </Link>
            <Link className="admin-dashboard-action" href="/admin/exercises/new">
              <span className="admin-dashboard-action__icon">＋</span>
              <span><strong>Tạo bài tập mới</strong><small>Nhập nội dung thủ công từ đầu</small></span>
              <span className="admin-dashboard-action__arrow">→</span>
            </Link>
          </div>
        </div>

        <div className="admin-panel admin-dashboard-card admin-dashboard-card--status">
          <div className="admin-panel-heading">
            <div>
              <span className="admin-eyebrow">SYSTEM STATUS</span>
              <h2>Trạng thái hệ thống</h2>
            </div>
            <span className="admin-dashboard-status-dot" aria-hidden="true" />
          </div>
          <div className="admin-dashboard-status-row"><span>Nguồn dữ liệu</span><strong>{databaseConfigured ? "Supabase" : "JSON local"}</strong></div>
          <div className="admin-dashboard-status-row"><span>Chế độ</span><strong>{databaseConfigured ? "Production data" : "Preview"}</strong></div>
          <p className="admin-dashboard-note">Các mục Media, Người dùng và Cài đặt sẽ được bổ sung tại menu bên trái.</p>
        </div>
      </section>
    </main>
  );
}
