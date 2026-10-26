import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { measureExerciseRead } from "@/lib/exercises/performance";

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  let response = NextResponse.next({ request });

  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  await measureExerciseRead("auth.refresh", async () => {
    if (request.nextUrl.pathname.startsWith("/exercises/")) {
      // This route contains public data only. Refresh expired cookies without a
      // remote user lookup on every navigation. No identity/permission is read here.
      await supabase.auth.getSession();
    } else {
      await supabase.auth.getUser();
    }
  });
  return response;
}

export const config = {
  matcher: [
    "/",
    "/exercises/:path*",
    "/favorites/:path*",
    "/admin/:path*",
    "/auth/:path*",
    "/api/auth/:path*",
    "/api/favorite-exercises",
    "/api/admin/:path*",
  ],
};
