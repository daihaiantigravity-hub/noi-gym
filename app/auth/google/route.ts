import { NextResponse, type NextRequest } from "next/server";
import { GOOGLE_OAUTH_NEXT_COOKIE, getRequestOrigin, getSafeNextPath } from "@/lib/auth/redirect";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

function authErrorRedirect(request: Request, reason: string) {
  const target = new URL("/", getRequestOrigin(request));
  target.searchParams.set("auth", reason);
  return NextResponse.redirect(target);
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) return authErrorRedirect(request, "unavailable");

  const next = getSafeNextPath(request.nextUrl.searchParams.get("next"));
  const callbackUrl = new URL("/auth/google/callback", getRequestOrigin(request));

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
      scopes: "openid email profile",
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) return authErrorRedirect(request, "google-start-failed");

  const response = NextResponse.redirect(data.url);
  response.cookies.set(GOOGLE_OAUTH_NEXT_COOKIE, next, {
    httpOnly: true,
    sameSite: "lax",
    secure: callbackUrl.protocol === "https:",
    path: "/auth/google/callback",
    maxAge: 10 * 60,
  });
  return response;
}
