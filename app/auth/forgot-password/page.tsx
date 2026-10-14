import Link from "next/link";
import ForgotPasswordForm from "@/components/admin/ForgotPasswordForm";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default function ForgotPasswordPage() {
  const configured = isSupabaseConfigured();

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <span className="admin-eyebrow">NOI GYM · ADMIN</span>
        <h1>Khôi phục mật khẩu</h1>
        <p className="admin-muted">Nhập email quản trị để nhận liên kết đặt mật khẩu mới.</p>
        {configured ? <ForgotPasswordForm /> : <p className="admin-form-error" role="alert">Supabase chưa được cấu hình.</p>}
        <Link className="admin-text-link" href="/auth/login">← Quay lại đăng nhập</Link>
      </section>
    </main>
  );
}
