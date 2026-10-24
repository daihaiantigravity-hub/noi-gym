"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { resetSavedExercises } from "@/lib/exercises/use-saved-exercise";
import { useAppLanguage } from "@/components/LanguageProvider";
import { getMessages, translate, type MessageKey } from "@/lib/i18n/messages";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
};

export type SessionResponse = {
  user: SessionUser | null;
  isAdmin: boolean;
};

function getCurrentPath() {
  const url = new URL(window.location.href);
  url.searchParams.delete("auth");
  return `${url.pathname}${url.search}${url.hash}`;
}

function LoginIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="19" viewBox="0 0 24 24" width="19">
      <path d="M2.5 12h12m0 0-4.2-4.2m4.2 4.2-4.2 4.2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M8.5 5V4A2 2 0 0 1 10.5 2h8A2 2 0 0 1 20.5 4v16a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

export default function UserAuthButton({ initialSession }: { initialSession: SessionResponse }) {
  const { language } = useAppLanguage();
  const messages = getMessages(language);
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState<SessionResponse>(initialSession);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [errorKey, setError] = useState<MessageKey | null>(null);
  const error = errorKey ? messages[errorKey] : null;

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/auth/session", { cache: "no-store", credentials: "same-origin", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to check your sign-in status.");
        return response.json() as Promise<SessionResponse>;
      })
      .then(setSession)
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setError("authSessionFailed");
      })
      .finally(() => setLoading(false));

    const authReason = new URL(window.location.href).searchParams.get("auth");
    const authErrorTimer = authReason
      ? window.setTimeout(() => setError("googleSignInFailed"), 0)
      : undefined;

    return () => {
      controller.abort();
      if (authErrorTimer !== undefined) window.clearTimeout(authErrorTimer);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  function signIn() {
    if (loading) return;
    // OAuth must leave the current document so the provider redirect can set the server session.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/auth/google?next=${encodeURIComponent(getCurrentPath())}`;
  }

  async function signOut() {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/session", { method: "DELETE", credentials: "same-origin" });
      if (!response.ok) throw new Error("Unable to sign out. Please try again.");
      resetSavedExercises();
      setSession({ user: null, isAdmin: false });
      setMenuOpen(false);
      router.refresh();
    } catch {
      setError("signOutFailed");
    } finally {
      setLoading(false);
    }
  }

  if (!session.user) {
    return (
      <div className="health-user-auth" ref={rootRef}>
        <button
          aria-busy={loading}
          aria-label={messages.signIn}
          className="health-avatar health-avatar--login"
          disabled={loading}
          onClick={signIn}
          title={messages.signIn}
          type="button"
        >
          <LoginIcon />
        </button>
        {error ? <span className="health-user-auth__error" role="alert">{error}</span> : null}
      </div>
    );
  }

  const initial = session.user.name.trim().charAt(0).toLocaleUpperCase("vi") || "U";

  return (
    <div className="health-user-auth" ref={rootRef}>
      <button
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label={translate(language, "accountMenu", { name: session.user.name })}
        className="health-avatar health-avatar--profile"
        onClick={() => setMenuOpen((open) => !open)}
        type="button"
      >
        <span>
          {session.user.avatarUrl ? (
            // Google profile images use rotating remote URLs, so the small avatar is rendered directly.
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" referrerPolicy="no-referrer" src={session.user.avatarUrl} />
          ) : initial}
        </span>
      </button>

      {menuOpen ? (
        <div aria-label={messages.account} className="health-user-menu" role="menu">
          <div className="health-user-menu__identity">
            <strong>{session.user.name}</strong>
            <span>{session.user.email}</span>
          </div>
          <Link className="health-user-menu__item" href="/favorites" onClick={() => setMenuOpen(false)} role="menuitem">{messages.savedExercises}</Link>
          {session.isAdmin ? <Link className="health-user-menu__item" href="/admin/exercises" onClick={() => setMenuOpen(false)} role="menuitem">{messages.admin}</Link> : null}
          <button className="health-user-menu__item health-user-menu__item--button" disabled={loading} onClick={signOut} role="menuitem" type="button">{messages.signOut}</button>
        </div>
      ) : null}
      {error ? <span className="health-user-auth__error" role="alert">{error}</span> : null}
    </div>
  );
}
