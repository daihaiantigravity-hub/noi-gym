import { NextResponse } from "next/server";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const loginUrl = new URL("/auth/login", requestUrl.origin);
  if (!isSupabaseConfigured()) {
    loginUrl.searchParams.set("recovery", "unavailable");
    return NextResponse.redirect(loginUrl);
  }

  const code = requestUrl.searchParams.get("code");
  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/auth/reset-password", requestUrl.origin));
  }

  loginUrl.searchParams.set("recovery", "invalid");
  return NextResponse.redirect(loginUrl);
}
