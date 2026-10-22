import Link from "next/link";

export const metadata = {
  title: "Terms of Use | Noi Gym",
  description: "Terms that apply when using the Noi Gym exercise library.",
};

export default function TermsPage() {
  return (
    <main className="legal-page">
      <article className="legal-card">
        <Link className="legal-back-link" href="/">
          ← Back to Noi Gym
        </Link>
        <p className="legal-eyebrow">NOI GYM</p>
        <h1>Terms of Use</h1>
        <p className="legal-updated">Updated October 22, 2026</p>

        <section>
          <h2>Purpose of Noi Gym</h2>
          <p>
            Noi Gym provides an exercise library for browsing, searching, and saving content that fits your needs.
            Content on this site does not replace medical advice or direct guidance from a qualified professional.
          </p>
        </section>

        <section>
          <h2>Safe use</h2>
          <p>
            You are responsible for choosing exercise intensity that suits your health and ability. Stop exercising
            and seek professional advice if you experience pain, dizziness, or other unusual symptoms.
          </p>
        </section>

        <section>
          <h2>Accounts and favorite exercises</h2>
          <p>
            You can sign in with Google to save exercises. You are responsible for protecting access to your Google
            account and for using the service without disrupting or harming others.
          </p>
        </section>

        <section>
          <h2>Service changes</h2>
          <p>
            Content, features, and these terms may be updated to improve the service or meet operational needs. The
            most recent update date is always shown at the top of this page.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Email: <a href="mailto:daihai.antigravity@gmail.com">daihai.antigravity@gmail.com</a>
          </p>
        </section>

        <footer className="legal-footer">
          <Link href="/privacy">Privacy Policy</Link>
        </footer>
      </article>
    </main>
  );
}
