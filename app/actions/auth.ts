"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { isAdminEmail, isAdminUser } from "@/lib/admin-auth";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { WorkspaceMessageKey } from "@/lib/i18n/workspace-messages";

export type LoginActionState = {
  error?: WorkspaceMessageKey;
};

export type PasswordResetActionState = {
  error?: WorkspaceMessageKey;
  success?: WorkspaceMessageKey;
};

const passwordResetSuccess = "authResetSent";

function getAuthError(error: { message?: string; status?: number } | null, fallback: WorkspaceMessageKey): WorkspaceMessageKey {
  if (error?.status === 402 || error?.message?.includes("exceed_storage_size_quota")) {
    return "authQuotaExceeded";
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
  if (!isSupabaseConfigured()) return { error: "authNotConfigured" };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "authCredentialsRequired" };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) return { error: getAuthError(error, "authInvalidCredentials") };
  if (!isAdminUser(data.user)) {
    await supabase.auth.signOut();
    return { error: "authAdminRequired" };
  }

  redirect("/admin/exercises");
}

export async function requestPasswordResetAction(
  _previousState: PasswordResetActionState,
  formData: FormData,
): Promise<PasswordResetActionState> {
  if (!isSupabaseConfigured()) return { error: "authNotConfigured" };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return { error: "authInvalidEmail" };
  if (!isAdminEmail(email)) return { success: passwordResetSuccess };

  const supabase = await createSupabaseServerClient();
  const redirectTo = new URL("/auth/callback", await getRequestOrigin()).toString();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return { error: getAuthError(error, "authResetFailed") };

  return { success: passwordResetSuccess };
}

export async function updatePasswordAction(
  _previousState: PasswordResetActionState,
  formData: FormData,
): Promise<PasswordResetActionState> {
  if (!isSupabaseConfigured()) return { error: "authNotConfigured" };

  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("passwordConfirmation") ?? "");
  if (password.length < 12) return { error: "authPasswordTooShort" };
  if (password !== confirmation) return { error: "authPasswordsMismatch" };

  const supabase = await createSupabaseServerClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !isAdminUser(data.user)) {
    return { error: getAuthError(userError, "authRecoveryInvalid") };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: getAuthError(error, "authPasswordUpdateFailed") };

  redirect("/admin/exercises");
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect("/auth/login");
}
