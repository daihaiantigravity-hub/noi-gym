import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin-auth";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

function sessionResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET() {
  if (!isSupabaseConfigured()) return sessionResponse({ user: null, isAdmin: false });

  try {
    const supabase = await createSupabaseServerClient();
    // The proxy has already verified/refreshed the token for this request. Reading
    // the cookie-backed session here avoids a second remote Auth request for UI data.
    const { data, error } = await supabase.auth.getSession();
    const user = data.session?.user ?? null;
    if (error) return sessionResponse({ error: "Unable to check your sign-in status." }, 503);
    if (!user) return sessionResponse({ user: null, isAdmin: false });

    const metadata = user.user_metadata ?? {};
    const name = typeof metadata.full_name === "string"
      ? metadata.full_name
      : typeof metadata.name === "string"
        ? metadata.name
        : user.email?.split("@")[0] ?? "User";
    const avatarUrl = typeof metadata.avatar_url === "string"
      ? metadata.avatar_url
      : typeof metadata.picture === "string"
        ? metadata.picture
        : null;

    return sessionResponse({
      user: { id: user.id, email: user.email ?? "", name, avatarUrl },
      isAdmin: isAdminUser(user),
    });
  } catch {
    return sessionResponse({ error: "Unable to check your sign-in status." }, 503);
  }
}

export async function DELETE() {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.signOut();
      if (error) return sessionResponse({ error: "Unable to sign out. Please try again." }, 503);
    }

    return sessionResponse({ signedOut: true });
  } catch {
    return sessionResponse({ error: "Unable to sign out. Please try again." }, 503);
  }
}
