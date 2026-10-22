"use client";

import { useActionState } from "react";
import { updatePasswordAction, type PasswordResetActionState } from "@/app/actions/auth";

const initialState: PasswordResetActionState = {};

export default function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePasswordAction, initialState);

  return (
    <form action={formAction} className="admin-login-form">
      <label>
        New password
        <input autoComplete="new-password" minLength={12} name="password" required type="password" />
      </label>
      <label>
        Confirm new password
        <input autoComplete="new-password" minLength={12} name="passwordConfirmation" required type="password" />
      </label>
      {state.error && <p className="admin-form-error" role="alert">{state.error}</p>}
      <button className="admin-button admin-button--primary admin-button--full" disabled={pending} type="submit">
        {pending ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}
