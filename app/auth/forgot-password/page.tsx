import Link from "next/link";
import ForgotPasswordForm from "@/components/admin/ForgotPasswordForm";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import LanguageToggle from "@/components/LanguageToggle";
import { getAppLanguage } from "@/lib/i18n/server";
import { getWorkspaceMessages } from "@/lib/i18n/workspace-messages";

export default async function ForgotPasswordPage() {
  const configured = isSupabaseConfigured();
  const text = getWorkspaceMessages(await getAppLanguage());

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-localized-heading"><span className="admin-eyebrow">{text.adminBrand}</span><LanguageToggle whenEnabledOnly /></div>
        <h1>{text.resetTitle}</h1>
        <p className="admin-muted">{text.resetDescription}</p>
        {configured ? <ForgotPasswordForm /> : <p className="admin-form-error" role="alert">{text.authNotConfigured}</p>}
        <Link className="admin-text-link" href="/auth/login">← {text.backToLogin}</Link>
      </section>
    </main>
  );
}
