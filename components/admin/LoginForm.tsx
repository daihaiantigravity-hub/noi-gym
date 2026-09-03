"use client";

import { useActionState } from "react";
import { signInAction, type LoginActionState } from "@/app/actions/auth";

const initialState: LoginActionState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <form className="admin-login-form" action={formAction}>
      <label>
        Email admin
        <input autoComplete="email" name="email" required type="email" />
      </label>
      <label>
        Mật khẩu
        <input autoComplete="current-password" name="password" required type="password" />
      </label>
      {state.error ? <p className="admin-form-error" role="alert">{state.error}</p> : null}
      <button className="admin-button admin-button--primary admin-button--full" disabled={pending} type="submit">
        {pending ? "Đang đăng nhập…" : "Đăng nhập"}
      </button>
    </form>
  );
}
