import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Coming Soon | Noi Gym",
};

export default function ComingSoonPage() {
  return (
    <div className="health-mood-surface coming-soon-page">
      <header className="coming-soon-page__header">
        <Link className="coming-soon-page__brand" href="/">Equix Health</Link>
      </header>

      <main className="coming-soon-page__main">
        <div className="coming-soon-page__content">
          <span className="coming-soon-page__eyebrow">Coming soon</span>
          <h1>In Development</h1>
          <p>This feature is in development.</p>
          <Link className="coming-soon-page__home" href="/">Back to Home</Link>
        </div>
      </main>
    </div>
  );
}
