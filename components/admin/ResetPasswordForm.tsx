"use client";

import { useActionState } from "react";
import { updatePasswordAction, type PasswordResetActionState } from "@/app/actions/auth";
import { useAppLanguage } from "@/components/LanguageProvider";
import { getWorkspaceMessages } from "@/lib/i18n/workspace-messages";

const initialState: PasswordResetActionState = {};

export default function ResetPasswordForm() {
  const { language } = useAppLanguage();
  const text = getWorkspaceMessages(language);
  const [state, formAction, pending] = useActionState(updatePasswordAction, initialState);

  return (
    <form action={formAction} className="admin-login-form">
      <label>
        {text.newPassword}
        <input autoComplete="new-password" minLength={12} name="password" required type="password" />
      </label>
      <label>
        {text.confirmPassword}
        <input autoComplete="new-password" minLength={12} name="passwordConfirmation" required type="password" />
      </label>
      {state.error && <p className="admin-form-error" role="alert">{text[state.error]}</p>}
      <button className="admin-button admin-button--primary admin-button--full" disabled={pending} type="submit">
        {pending ? text.updating : text.setPassword}
      </button>
    </form>
  );
}
