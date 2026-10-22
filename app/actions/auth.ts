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

const passwordResetSuccess = "If the email belongs to an administrator account, password reset instructions have been sent.";

function getAuthError(error: { message?: string; status?: number } | null, fallback: string) {
  if (error?.status === 402 || error?.message?.includes("exceed_storage_size_quota")) {
    return "The Supabase project is paused because it exceeded its storage quota. Resolve the quota before signing in or resetting a password.";
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
  if (!isSupabaseConfigured()) return { error: "Supabase is not configured" };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password to sign in" };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) return { error: getAuthError(error, "Incorrect email or password") };
  if (!isAdminUser(data.user)) {
    await supabase.auth.signOut();
    return { error: "This account does not have administrator access" };
  }

  redirect("/admin/exercises");
}

export async function requestPasswordResetAction(
  _previousState: PasswordResetActionState,
  formData: FormData,
): Promise<PasswordResetActionState> {
  if (!isSupabaseConfigured()) return { error: "Supabase is not configured" };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email address" };
  if (!isAdminEmail(email)) return { success: passwordResetSuccess };

  const supabase = await createSupabaseServerClient();
  const redirectTo = new URL("/auth/callback", await getRequestOrigin()).toString();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return { error: getAuthError(error, "Unable to send the password reset email. Please try again.") };

  return { success: passwordResetSuccess };
}

export async function updatePasswordAction(
  _previousState: PasswordResetActionState,
  formData: FormData,
): Promise<PasswordResetActionState> {
  if (!isSupabaseConfigured()) return { error: "Supabase is not configured" };

  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("passwordConfirmation") ?? "");
  if (password.length < 12) return { error: "The new password must contain at least 12 characters" };
  if (password !== confirmation) return { error: "The passwords do not match" };

  const supabase = await createSupabaseServerClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !isAdminUser(data.user)) {
    return { error: getAuthError(userError, "The reset link is invalid or has expired. Request a new email.") };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: getAuthError(error, "Unable to update the password. Please try again.") };

  redirect("/admin/exercises");
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect("/auth/login");
}
