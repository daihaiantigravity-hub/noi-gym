import Link from "next/link";
import ForgotPasswordForm from "@/components/admin/ForgotPasswordForm";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default function ForgotPasswordPage() {
  const configured = isSupabaseConfigured();

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <span className="admin-eyebrow">NOI GYM · ADMIN</span>
        <h1>Reset password</h1>
        <p className="admin-muted">Enter the administrator email to receive a password reset link.</p>
        {configured ? <ForgotPasswordForm /> : <p className="admin-form-error" role="alert">Supabase is not configured.</p>}
        <Link className="admin-text-link" href="/auth/login">← Back to sign in</Link>
      </section>
    </main>
  );
}
