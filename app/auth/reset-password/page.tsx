import Link from "next/link";
import { redirect } from "next/navigation";
import ResetPasswordForm from "@/components/admin/ResetPasswordForm";
import { isAdminUser } from "@/lib/admin-auth";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  if (!isSupabaseConfigured()) redirect("/auth/login?recovery=unavailable");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!isAdminUser(data.user)) redirect("/auth/login?recovery=invalid");

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <span className="admin-eyebrow">NOI GYM · ADMIN</span>
        <h1>Set a new password</h1>
        <p className="admin-muted">Use a password with at least 12 characters that is unique to this account.</p>
        <ResetPasswordForm />
        <Link className="admin-text-link" href="/auth/login">← Back to sign in</Link>
      </section>
    </main>
  );
}
