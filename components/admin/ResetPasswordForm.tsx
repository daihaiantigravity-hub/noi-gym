"use client";

import { useActionState } from "react";
import { updatePasswordAction, type PasswordResetActionState } from "@/app/actions/auth";

const initialState: PasswordResetActionState = {};

export default function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePasswordAction, initialState);

  return (
    <form action={formAction} className="admin-login-form">
      <label>
        Mật khẩu mới
        <input autoComplete="new-password" minLength={12} name="password" required type="password" />
      </label>
      <label>
        Nhập lại mật khẩu mới
        <input autoComplete="new-password" minLength={12} name="passwordConfirmation" required type="password" />
      </label>
      {state.error && <p className="admin-form-error" role="alert">{state.error}</p>}
      <button className="admin-button admin-button--primary admin-button--full" disabled={pending} type="submit">
        {pending ? "Đang cập nhật…" : "Đặt mật khẩu mới"}
      </button>
    </form>
  );
}
