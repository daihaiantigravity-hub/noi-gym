import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin-auth";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ user: null, isAdmin: false });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ user: null, isAdmin: false });

  const metadata = data.user.user_metadata ?? {};
  const name = typeof metadata.full_name === "string"
    ? metadata.full_name
    : typeof metadata.name === "string"
      ? metadata.name
      : data.user.email?.split("@")[0] ?? "Người dùng";
  const avatarUrl = typeof metadata.avatar_url === "string"
    ? metadata.avatar_url
    : typeof metadata.picture === "string"
      ? metadata.picture
      : null;

  return NextResponse.json({
    user: { id: data.user.id, email: data.user.email ?? "", name, avatarUrl },
    isAdmin: isAdminUser(data.user),
  });
}

export async function DELETE() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  return NextResponse.json({ signedOut: true });
}
