"use client";

import { useActionState } from "react";
import { requestPasswordResetAction, type PasswordResetActionState } from "@/app/actions/auth";

const initialState: PasswordResetActionState = {};

export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initialState);

  return (
    <form action={formAction} className="admin-login-form">
      <label>
        Administrator email
        <input autoComplete="email" defaultValue="daihai.antigravity@gmail.com" name="email" required type="email" />
      </label>
      {state.error && <p className="admin-form-error" role="alert">{state.error}</p>}
      {state.success && <p className="admin-form-success" role="status">{state.success}</p>}
      <button className="admin-button admin-button--primary admin-button--full" disabled={pending} type="submit">
        {pending ? "Sending…" : "Send reset email"}
      </button>
    </form>
  );
}
