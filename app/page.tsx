import type { User } from "@supabase/supabase-js";
import HomePage from "@/components/HomePage";
import type { SessionResponse } from "@/components/auth/UserAuthButton";
import { isAdminUser } from "@/lib/admin-auth";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

function getSessionResponse(user: User | null): SessionResponse {
  if (!user) return { user: null, isAdmin: false };

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

  return {
    user: { id: user.id, email: user.email ?? "", name, avatarUrl },
    isAdmin: isAdminUser(user),
  };
}

async function getInitialAuthSession(): Promise<SessionResponse> {
  if (!isSupabaseConfigured()) return { user: null, isAdmin: false };

  const supabase = await createSupabaseServerClient();
  // This cookie-backed snapshot only seeds presentation. Protected operations
  // still verify the user with getUser() in their server-side authorization path.
  const { data } = await supabase.auth.getSession();
  return getSessionResponse(data.session?.user ?? null);
}

export default async function Home() {
  const initialAuthSession = await getInitialAuthSession();
  return <HomePage initialAuthSession={initialAuthSession} />;
}
