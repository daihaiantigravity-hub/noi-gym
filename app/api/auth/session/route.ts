import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin-auth";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ user: null, isAdmin: false });

  const supabase = await createSupabaseServerClient();
  // The proxy has already verified/refreshed the token for this request. Reading
  // the cookie-backed session here avoids a second remote Auth request for UI data.
  const { data, error } = await supabase.auth.getSession();
  const user = data.session?.user ?? null;
  if (error || !user) return NextResponse.json({ user: null, isAdmin: false });

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

  return NextResponse.json({
    user: { id: user.id, email: user.email ?? "", name, avatarUrl },
    isAdmin: isAdminUser(user),
  });
}

export async function DELETE() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  return NextResponse.json({ signedOut: true });
}
