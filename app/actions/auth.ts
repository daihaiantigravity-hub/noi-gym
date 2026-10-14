"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { isAdminEmail, isAdminUser } from "@/lib/admin-auth";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type LoginActionState = {
  error?: string;
};

export type PasswordResetActionState = {
  error?: string;
  success?: string;
};

const passwordResetSuccess = "Nếu email thuộc tài khoản quản trị, hướng dẫn đặt lại mật khẩu đã được gửi.";

function getAuthError(error: { message?: string; status?: number } | null, fallback: string) {
  if (error?.status === 402 || error?.message?.includes("exceed_storage_size_quota")) {
    return "Dự án Supabase đang bị tạm khóa do vượt giới hạn dung lượng. Hãy xử lý quota trước khi sử dụng đăng nhập hoặc khôi phục mật khẩu.";
  }
  return fallback;
}

async function getRequestOrigin() {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredOrigin) return new URL(configuredOrigin).origin;

  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || requestHeaders.get("host");
  const requestOrigin = requestHeaders.get("origin");
  if (requestOrigin && host) {
    try {
      const parsedOrigin = new URL(requestOrigin);
      if (parsedOrigin.host === host) return parsedOrigin.origin;
    } catch {
      // Fall through to the trusted deployment host below.
    }
  }

  if (host) {
    const forwardedProtocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const protocol = forwardedProtocol || (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
    return `${protocol}://${host}`;
  }

  return "http://localhost:3001";
}

export async function signInAction(_previousState: LoginActionState, formData: FormData): Promise<LoginActionState> {
  if (!isSupabaseConfigured()) return { error: "Supabase chưa được cấu hình" };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Nhập email và mật khẩu để đăng nhập" };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) return { error: getAuthError(error, "Email hoặc mật khẩu không chính xác") };
  if (!isAdminUser(data.user)) {
    await supabase.auth.signOut();
    return { error: "Tài khoản này chưa được cấp quyền admin" };
  }

  redirect("/admin/exercises");
}

export async function requestPasswordResetAction(
  _previousState: PasswordResetActionState,
  formData: FormData,
): Promise<PasswordResetActionState> {
  if (!isSupabaseConfigured()) return { error: "Supabase chưa được cấu hình" };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return { error: "Nhập địa chỉ email hợp lệ" };
  if (!isAdminEmail(email)) return { success: passwordResetSuccess };

  const supabase = await createSupabaseServerClient();
  const redirectTo = new URL("/auth/callback", await getRequestOrigin()).toString();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return { error: getAuthError(error, "Không thể gửi email khôi phục mật khẩu. Vui lòng thử lại.") };

  return { success: passwordResetSuccess };
}

export async function updatePasswordAction(
  _previousState: PasswordResetActionState,
  formData: FormData,
): Promise<PasswordResetActionState> {
  if (!isSupabaseConfigured()) return { error: "Supabase chưa được cấu hình" };

  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("passwordConfirmation") ?? "");
  if (password.length < 12) return { error: "Mật khẩu mới phải có ít nhất 12 ký tự" };
  if (password !== confirmation) return { error: "Hai mật khẩu chưa khớp" };

  const supabase = await createSupabaseServerClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !isAdminUser(data.user)) {
    return { error: getAuthError(userError, "Liên kết khôi phục không hợp lệ hoặc đã hết hạn. Hãy yêu cầu email mới.") };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: getAuthError(error, "Không thể cập nhật mật khẩu. Vui lòng thử lại.") };

  redirect("/admin/exercises");
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect("/auth/login");
}
