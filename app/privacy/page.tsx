import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Noi Gym",
  description: "How Noi Gym uses Google sign-in data and saved exercise information.",
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <article className="legal-card">
        <Link className="legal-back-link" href="/">
          ← Back to Noi Gym
        </Link>
        <p className="legal-eyebrow">NOI GYM</p>
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Updated October 22, 2026</p>

        <section>
          <h2>Data we use</h2>
          <p>
            When you sign in with Google, Noi Gym receives your account identifier, name, email address, and
            public profile image to create your session and display your profile.
          </p>
        </section>

        <section>
          <h2>Saved exercises</h2>
          <p>
            Your favorite exercises are linked to your account. Noi Gym uses aggregate save counts to prioritize
            exercises that interest the community. Individual identities and email addresses are not published in
            these aggregate statistics.
          </p>
        </section>

        <section>
          <h2>Data storage and protection</h2>
          <p>
            Google provides authentication, while Supabase stores sign-in sessions and favorite exercise data.
            Noi Gym requests only basic Google permissions for account identity, email, and public profile data.
          </p>
        </section>

        <section>
          <h2>Your choices</h2>
          <p>
            You can remove saved exercises and sign out at any time. For support related to account data, contact
            us at the email address below.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Email: <a href="mailto:daihai.antigravity@gmail.com">daihai.antigravity@gmail.com</a>
          </p>
        </section>

        <footer className="legal-footer">
          <Link href="/terms">Terms of Use</Link>
        </footer>
      </article>
    </main>
  );
}
