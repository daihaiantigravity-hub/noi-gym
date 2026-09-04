import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
}

function getAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
}

function getServiceRoleKey() {
  return (
    process.env.SUPABASE_SECRET_KEY?.trim() ??
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ??
    ""
  );
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseUrl() && getAnonKey());
}

export function isDatabaseConfigured() {
  return Boolean(getSupabaseUrl() && getServiceRoleKey());
}

export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase chưa được cấu hình");
  }

  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot always mutate the cookie store. Middleware can refresh it.
        }
      },
    },
  });
}

export function createSupabaseAdminClient() {
  if (!isDatabaseConfigured()) {
    throw new Error("Database chưa được cấu hình. Cần NEXT_PUBLIC_SUPABASE_URL và SUPABASE_SECRET_KEY");
  }

  const serviceKey = getServiceRoleKey();

  return createClient(getSupabaseUrl(), serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    ...(serviceKey.startsWith("sb_secret_")
      ? {
          global: {
            fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
              const headers = new Headers(init?.headers);
              headers.delete("Authorization");

              return fetch(input, { ...init, headers });
            },
          },
        }
      : {}),
  });
}
