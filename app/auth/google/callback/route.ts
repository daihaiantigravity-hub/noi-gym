import { NextResponse, type NextRequest } from "next/server";
import { GOOGLE_OAUTH_NEXT_COOKIE, getRequestOrigin, getSafeNextPath } from "@/lib/auth/redirect";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

function callbackErrorRedirect(request: Request, reason: string) {
  const target = new URL("/", getRequestOrigin(request));
  target.searchParams.set("auth", reason);
  const response = NextResponse.redirect(target);
  response.cookies.set(GOOGLE_OAUTH_NEXT_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: target.protocol === "https:",
    path: "/auth/google/callback",
    maxAge: 0,
  });
  return response;
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) return callbackErrorRedirect(request, "unavailable");

  const code = request.nextUrl.searchParams.get("code");
  const next = getSafeNextPath(
    request.cookies.get(GOOGLE_OAUTH_NEXT_COOKIE)?.value
      ?? request.nextUrl.searchParams.get("next"),
  );
  if (!code) return callbackErrorRedirect(request, "google-callback-invalid");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return callbackErrorRedirect(request, "google-callback-failed");

  const target = new URL(next, getRequestOrigin(request));
  const response = NextResponse.redirect(target);
  response.cookies.set(GOOGLE_OAUTH_NEXT_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: target.protocol === "https:",
    path: "/auth/google/callback",
    maxAge: 0,
  });
  return response;
}
