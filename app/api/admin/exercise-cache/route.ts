import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { invalidateExerciseContent } from "@/lib/exercises/cache";

export const runtime = "nodejs";

function respond(body: { ok: boolean; error?: string }, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

function hasValidSecret(authorization: string) {
  const secret = process.env.EXERCISE_CACHE_REVALIDATE_SECRET?.trim() ?? "";
  const token = /^Bearer ([^\s]+)$/i.exec(authorization)?.[1] ?? "";
  if (secret.length < 32 || !token) return false;
  // Hash both values to equal-size buffers before the constant-time comparison.
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(secret), digest(token));
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  if (authorization !== null) {
    // A wrong supplied credential must never fall back to an ambient cookie.
    if (!hasValidSecret(authorization)) return respond({ ok: false, error: "Unauthorized" }, 401);
  } else {
    if (request.headers.get("origin") !== new URL(request.url).origin) {
      return respond({ ok: false, error: "Same-origin request required" }, 403);
    }
    try {
      await requireAdmin();
    } catch {
      return respond({ ok: false, error: "Administrator access required" }, 403);
    }
  }

  try {
    invalidateExerciseContent();
    revalidatePath("/exercises/[muscle]", "page");
    revalidatePath("/exercises/[muscle]/[exerciseId]", "page");
    revalidatePath("/favorites");
    revalidatePath("/admin/exercises");
    revalidatePath("/admin/translations");
    revalidatePath("/admin/translations/[id]", "page");
    return respond({ ok: true });
  } catch {
    return respond({ ok: false, error: "Cache refresh failed" }, 500);
  }
}

export function GET() {
  const response = respond({ ok: false, error: "Use POST" }, 405);
  response.headers.set("Allow", "POST");
  return response;
}
