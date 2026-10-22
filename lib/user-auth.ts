import "server-only";

import { createSupabaseServerClient, isSupabaseConfigured } from "./supabase/server";

export class AuthenticationRequiredError extends Error {
  constructor(message = "You need to sign in to perform this action") {
    super(message);
    this.name = "AuthenticationRequiredError";
  }
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
}

export async function requireUser() {
  if (!isSupabaseConfigured()) throw new AuthenticationRequiredError("Sign-in is not configured");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new AuthenticationRequiredError();

  return { user: data.user, supabase };
}
