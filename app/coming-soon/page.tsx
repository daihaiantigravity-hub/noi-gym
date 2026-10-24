import type { Metadata } from "next";
import Link from "next/link";
import { getAppLanguage } from "@/lib/i18n/server";
import { getMessages } from "@/lib/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  return { title: `${getMessages(await getAppLanguage()).comingSoon} | Noi Gym` };
}

export default async function ComingSoonPage() {
  const messages = getMessages(await getAppLanguage());
  return (
    <div className="health-mood-surface coming-soon-page">
      <header className="coming-soon-page__header">
        <Link className="coming-soon-page__brand" href="/">Equix Health</Link>
      </header>

      <main className="coming-soon-page__main">
        <div className="coming-soon-page__content">
          <span className="coming-soon-page__eyebrow">{messages.comingSoon}</span>
          <h1>{messages.inDevelopment}</h1>
          <p>{messages.featureInDevelopment}</p>
          <Link className="coming-soon-page__home" href="/">{messages.backHome}</Link>
        </div>
      </main>
    </div>
  );
}
