import Link from "next/link";
import { redirect } from "next/navigation";
import ResetPasswordForm from "@/components/admin/ResetPasswordForm";
import { isAdminUser } from "@/lib/admin-auth";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import LanguageToggle from "@/components/LanguageToggle";
import { getAppLanguage } from "@/lib/i18n/server";
import { getWorkspaceMessages } from "@/lib/i18n/workspace-messages";

export default async function ResetPasswordPage() {
  if (!isSupabaseConfigured()) redirect("/auth/login?recovery=unavailable");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!isAdminUser(data.user)) redirect("/auth/login?recovery=invalid");
  const text = getWorkspaceMessages(await getAppLanguage());

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-localized-heading"><span className="admin-eyebrow">{text.adminBrand}</span><LanguageToggle whenEnabledOnly /></div>
        <h1>{text.newPasswordTitle}</h1>
        <p className="admin-muted">{text.newPasswordDescription}</p>
        <ResetPasswordForm />
        <Link className="admin-text-link" href="/auth/login">← {text.backToLogin}</Link>
      </section>
    </main>
  );
}
