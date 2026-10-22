"use client";

export default function AdminFavoritesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="admin-page">
      <section className="admin-error-state" role="alert">
        <span className="admin-eyebrow">BÀI TẬP ƯU TIÊN</span>
        <h1>Không tải được danh sách yêu thích</h1>
        <p>Kiểm tra kết nối Supabase hoặc thử tải lại trang.</p>
        <button className="admin-button admin-button--primary" onClick={() => reset()} type="button">Thử lại</button>
      </section>
    </main>
  );
}
