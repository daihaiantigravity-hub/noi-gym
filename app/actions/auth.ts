"use server";

import { redirect } from "next/navigation";
import { isAdminUser } from "@/lib/admin-auth";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type LoginActionState = {
  error?: string;
};

export async function signInAction(_previousState: LoginActionState, formData: FormData): Promise<LoginActionState> {
  if (!isSupabaseConfigured()) return { error: "Supabase chưa được cấu hình" };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Nhập email và mật khẩu để đăng nhập" };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) return { error: "Email hoặc mật khẩu không chính xác" };
  if (!isAdminUser(data.user)) {
    await supabase.auth.signOut();
    return { error: "Tài khoản này chưa được cấp quyền admin" };
  }

  redirect("/admin/exercises");
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect("/auth/login");
}
