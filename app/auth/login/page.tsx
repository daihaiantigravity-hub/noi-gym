import Link from "next/link";
import LoginForm from "@/components/admin/LoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const configured = isSupabaseConfigured();
  const query = await searchParams;
  const recovery = Array.isArray(query.recovery) ? query.recovery[0] : query.recovery;
  const recoveryError = recovery === "unavailable"
    ? "Supabase is not ready for password recovery."
    : recovery === "invalid"
      ? "The reset link is invalid or has expired."
      : null;

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <span className="admin-eyebrow">NOI GYM · ADMIN</span>
        <h1>Dashboard sign in</h1>
        <p className="admin-muted">Manage the exercise library and content displayed on Noi Gym.</p>
        {recoveryError && <p className="admin-form-error" role="alert">{recoveryError}</p>}
        {configured ? (
          <LoginForm />
        ) : (
          <div className="admin-empty-state">
            <strong>Supabase is not configured</strong>
            <p>Add the Supabase environment variables and ADMIN_EMAILS to enable administrator sign-in.</p>
          </div>
        )}
        <Link className="admin-text-link" href="/">← Back to the public site</Link>
      </section>
    </main>
  );
}
