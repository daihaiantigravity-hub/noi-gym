"use client";

import { useActionState } from "react";
import { requestPasswordResetAction, type PasswordResetActionState } from "@/app/actions/auth";
import { useAppLanguage } from "@/components/LanguageProvider";
import { getWorkspaceMessages } from "@/lib/i18n/workspace-messages";

const initialState: PasswordResetActionState = {};

export default function ForgotPasswordForm() {
  const { language } = useAppLanguage();
  const text = getWorkspaceMessages(language);
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initialState);

  return (
    <form action={formAction} className="admin-login-form">
      <label>
        {text.adminEmail}
        <input autoComplete="email" defaultValue="daihai.antigravity@gmail.com" name="email" required type="email" />
      </label>
      {state.error && <p className="admin-form-error" role="alert">{text[state.error]}</p>}
      {state.success && <p className="admin-form-success" role="status">{text[state.success]}</p>}
      <button className="admin-button admin-button--primary admin-button--full" disabled={pending} type="submit">
        {pending ? text.sending : text.sendReset}
      </button>
    </form>
  );
}
