import Link from "next/link";
import LanguageToggle from "@/components/LanguageToggle";
import { getAppLanguage } from "@/lib/i18n/server";
import { getLegalContent, type LegalKind } from "@/lib/i18n/legal";

export async function legalMetadata(kind: LegalKind) {
  const content = getLegalContent(await getAppLanguage(), kind);
  return { title: `${content.title} | Noi Gym`, description: content.description };
}

export default async function LegalPage({ kind }: { kind: LegalKind }) {
  const content = getLegalContent(await getAppLanguage(), kind);
  return (
    <main className="legal-page">
      <article className="legal-card">
        <div className="admin-localized-heading">
          <Link className="legal-back-link" href="/">← {content.back}</Link>
          <LanguageToggle whenEnabledOnly />
        </div>
        <p className="legal-eyebrow">NOI GYM</p>
        <h1>{content.title}</h1>
        <p className="legal-updated">{content.updated}</p>
        {content.sections.map((section) => <section key={section.title}><h2>{section.title}</h2><p>{section.text}</p></section>)}
        <section><h2>{content.contact}</h2><p>Email: <a href="mailto:daihai.antigravity@gmail.com">daihai.antigravity@gmail.com</a></p></section>
        <footer className="legal-footer"><Link href={kind === "privacy" ? "/terms" : "/privacy"}>{content.otherTitle}</Link></footer>
      </article>
    </main>
  );
}
