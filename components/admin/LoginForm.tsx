"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction, type LoginActionState } from "@/app/actions/auth";

const initialState: LoginActionState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <form className="admin-login-form" action={formAction}>
      <label>
        Admin email
        <input autoComplete="email" name="email" required type="email" defaultValue="daihai.antigravity@gmail.com" />
      </label>
      <label>
        Password
        <input autoComplete="current-password" name="password" required type="password" />
      </label>
      {state.error ? <p className="admin-form-error" role="alert">{state.error}</p> : null}
      <button className="admin-button admin-button--primary admin-button--full" disabled={pending} type="submit">
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <Link className="admin-text-link admin-login-form__recovery" href="/auth/forgot-password">Forgot password?</Link>
    </form>
  );
}
