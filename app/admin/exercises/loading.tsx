export default function AdminExercisesLoading() {
  return (
    <main className="admin-page" aria-busy="true" aria-label="Đang tải danh sách bài tập">
      <div className="admin-loading-header">
        <div className="admin-skeleton admin-skeleton--eyebrow" />
        <div className="admin-skeleton admin-skeleton--title" />
        <div className="admin-skeleton admin-skeleton--copy" />
      </div>

      <section className="admin-stats" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => <div className="admin-stat-card admin-skeleton-card" key={index} />)}
      </section>

      <section className="admin-list-panel admin-skeleton-list" aria-hidden="true">
        <div className="admin-skeleton admin-skeleton--filter" />
        <div className="admin-skeleton admin-skeleton--table" />
      </section>
    </main>
  );
}
