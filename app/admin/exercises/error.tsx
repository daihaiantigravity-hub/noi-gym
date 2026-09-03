"use client";

export default function AdminExercisesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="admin-page">
      <section className="admin-error-state" role="alert">
        <span className="admin-eyebrow">EXERCISE LIBRARY</span>
        <h1>Không tải được dữ liệu</h1>
        <p>Kiểm tra cấu hình Supabase hoặc thử tải lại dashboard.</p>
        <button className="admin-button admin-button--primary" onClick={() => reset()} type="button">Thử lại</button>
      </section>
    </main>
  );
}
