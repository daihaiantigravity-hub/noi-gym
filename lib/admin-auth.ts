import "server-only";

import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient, createSupabaseServerClient, isDatabaseConfigured, isSupabaseConfigured } from "./supabase/server";

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminUser(user: User | null | undefined) {
  if (!user) return false;

  const email = user.email?.toLowerCase();
  const hasRole = user.app_metadata?.role === "admin";
  return hasRole || Boolean(email && getAdminEmails().includes(email));
}

export async function getAdminUser() {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return isAdminUser(data.user) ? data.user : null;
}

export async function requireAdmin() {
  if (!isSupabaseConfigured() || !isDatabaseConfigured()) {
    throw new Error("Admin chưa sẵn sàng. Hãy cấu hình Supabase và database trước.");
  }

  const authClient = await createSupabaseServerClient();
  const { data } = await authClient.auth.getUser();

  if (!isAdminUser(data.user)) {
    throw new Error("Bạn không có quyền thực hiện thao tác này");
  }

  return {
    user: data.user,
    supabase: createSupabaseAdminClient(),
  };
}
