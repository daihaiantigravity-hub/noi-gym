import Link from "next/link";
import LoginForm from "@/components/admin/LoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import LanguageToggle from "@/components/LanguageToggle";
import { getAppLanguage } from "@/lib/i18n/server";
import { getWorkspaceMessages } from "@/lib/i18n/workspace-messages";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const configured = isSupabaseConfigured();
  const text = getWorkspaceMessages(await getAppLanguage());
  const query = await searchParams;
  const recovery = Array.isArray(query.recovery) ? query.recovery[0] : query.recovery;
  const recoveryError = recovery === "unavailable"
    ? text.authRecoveryUnavailable
    : recovery === "invalid"
      ? text.authRecoveryInvalid
      : null;

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-localized-heading"><span className="admin-eyebrow">{text.adminBrand}</span><LanguageToggle whenEnabledOnly /></div>
        <h1>{text.loginTitle}</h1>
        <p className="admin-muted">{text.loginDescription}</p>
        {recoveryError && <p className="admin-form-error" role="alert">{recoveryError}</p>}
        {configured ? (
          <LoginForm />
        ) : (
          <div className="admin-empty-state">
            <strong>{text.authNotConfigured}</strong>
            <p>{text.authConfigureHelp}</p>
          </div>
        )}
        <Link className="admin-text-link" href="/">← {text.backToSite}</Link>
      </section>
    </main>
  );
}
