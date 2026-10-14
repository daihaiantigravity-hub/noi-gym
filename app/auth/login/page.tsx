import Link from "next/link";
import LoginForm from "@/components/admin/LoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const configured = isSupabaseConfigured();
  const query = await searchParams;
  const recovery = Array.isArray(query.recovery) ? query.recovery[0] : query.recovery;
  const recoveryError = recovery === "unavailable"
    ? "Supabase chưa sẵn sàng để khôi phục mật khẩu."
    : recovery === "invalid"
      ? "Liên kết khôi phục không hợp lệ hoặc đã hết hạn."
      : null;

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <span className="admin-eyebrow">NOI GYM · ADMIN</span>
        <h1>Đăng nhập dashboard</h1>
        <p className="admin-muted">Quản lý thư viện bài tập và nội dung hiển thị trên Noi Gym.</p>
        {recoveryError && <p className="admin-form-error" role="alert">{recoveryError}</p>}
        {configured ? (
          <LoginForm />
        ) : (
          <div className="admin-empty-state">
            <strong>Chưa cấu hình Supabase</strong>
            <p>Thêm các biến môi trường Supabase và ADMIN_EMAILS để bật đăng nhập admin.</p>
          </div>
        )}
        <Link className="admin-text-link" href="/">← Về trang public</Link>
      </section>
    </main>
  );
}
