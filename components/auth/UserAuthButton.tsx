"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { resetSavedExercises } from "@/lib/exercises/use-saved-exercise";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
};

type SessionResponse = {
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
    <svg aria-hidden="true" fill="none" height="23" viewBox="0 0 24 24" width="23">
      <path d="M14 8.5 17.5 12 14 15.5M17 12H8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M11 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H11" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

export default function UserAuthButton() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState<SessionResponse>({ user: null, isAdmin: false });
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/auth/session", { cache: "no-store", credentials: "same-origin", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Không thể kiểm tra trạng thái đăng nhập.");
        return response.json() as Promise<SessionResponse>;
      })
      .then(setSession)
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setError(requestError instanceof Error ? requestError.message : "Không thể kiểm tra trạng thái đăng nhập.");
      })
      .finally(() => setLoading(false));

    const authReason = new URL(window.location.href).searchParams.get("auth");
    const authErrorTimer = authReason
      ? window.setTimeout(() => setError("Không thể đăng nhập bằng Google. Vui lòng thử lại."), 0)
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
      if (!response.ok) throw new Error("Không thể đăng xuất. Vui lòng thử lại.");
      resetSavedExercises();
      setSession({ user: null, isAdmin: false });
      setMenuOpen(false);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể đăng xuất. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  if (!session.user) {
    return (
      <div className="health-user-auth" ref={rootRef}>
        <button
          aria-busy={loading}
          aria-label="Đăng nhập bằng Google"
          className="health-avatar health-avatar--login"
          disabled={loading}
          onClick={signIn}
          title="Đăng nhập bằng Google"
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
        aria-label={`Mở menu tài khoản ${session.user.name}`}
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
        <div aria-label="Tài khoản" className="health-user-menu" role="menu">
          <div className="health-user-menu__identity">
            <strong>{session.user.name}</strong>
            <span>{session.user.email}</span>
          </div>
          <Link className="health-user-menu__item" href="/favorites" onClick={() => setMenuOpen(false)} role="menuitem">Bài tập đã lưu</Link>
          {session.isAdmin ? <Link className="health-user-menu__item" href="/admin/exercises" onClick={() => setMenuOpen(false)} role="menuitem">Quản trị</Link> : null}
          <button className="health-user-menu__item health-user-menu__item--button" disabled={loading} onClick={signOut} role="menuitem" type="button">Đăng xuất</button>
        </div>
      ) : null}
      {error ? <span className="health-user-auth__error" role="alert">{error}</span> : null}
    </div>
  );
}
