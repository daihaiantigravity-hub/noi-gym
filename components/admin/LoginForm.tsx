"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction, type LoginActionState } from "@/app/actions/auth";
import { useAppLanguage } from "@/components/LanguageProvider";
import { getWorkspaceMessages } from "@/lib/i18n/workspace-messages";

const initialState: LoginActionState = {};

export default function LoginForm() {
  const { language } = useAppLanguage();
  const text = getWorkspaceMessages(language);
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <form className="admin-login-form" action={formAction}>
      <label>
        {text.adminEmail}
        <input autoComplete="email" name="email" required type="email" defaultValue="daihai.antigravity@gmail.com" />
      </label>
      <label>
        {text.password}
        <input autoComplete="current-password" name="password" required type="password" />
      </label>
      {state.error ? <p className="admin-form-error" role="alert">{text[state.error]}</p> : null}
      <button className="admin-button admin-button--primary admin-button--full" disabled={pending} type="submit">
        {pending ? text.signingIn : text.signIn}
      </button>
      <Link className="admin-text-link admin-login-form__recovery" href="/auth/forgot-password">{text.forgotPassword}</Link>
    </form>
  );
}
