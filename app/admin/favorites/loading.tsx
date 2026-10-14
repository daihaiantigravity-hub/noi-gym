export default function AdminFavoritesLoading() {
  return (
    <main aria-busy="true" aria-label="Đang tải danh sách bài tập yêu thích" className="admin-page">
      <div className="admin-loading-header">
        <div className="admin-skeleton admin-skeleton--eyebrow" />
        <div className="admin-skeleton admin-skeleton--title" />
        <div className="admin-skeleton admin-skeleton--copy" />
      </div>
      <section aria-hidden="true" className="admin-list-panel admin-skeleton-list">
        <div className="admin-skeleton admin-skeleton--table" />
      </section>
    </main>
  );
}
