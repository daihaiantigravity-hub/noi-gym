import path from "node:path";
import { pathToFileURL } from "node:url";
import nextEnv from "@next/env";

/** Never accepts an endpoint from imported data or follows an HTTP redirect. */
export async function refreshExerciseCache({ env = process.env, fetchImpl = fetch } = {}) {
  const site = env.NEXT_PUBLIC_SITE_URL?.trim();
  const secret = env.EXERCISE_CACHE_REVALIDATE_SECRET?.trim();
  if (!site || !secret) return { status: "manual_required", reason: "missing_configuration" };
  if (secret.length < 32 || /\s/.test(secret)) return { status: "failed", reason: "invalid_secret_configuration" };

  let endpoint;
  try {
    const url = new URL(site);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if ((url.protocol !== "https:" && !(url.protocol === "http:" && local))
      || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
      return { status: "failed", reason: "invalid_site_configuration" };
    }
    endpoint = new URL("/api/admin/exercise-cache", url.origin);
  } catch {
    return { status: "failed", reason: "invalid_site_configuration" };
  }

  try {
    const response = await fetchImpl(endpoint, {
      method: "POST", headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return { status: "failed", reason: "http_error", httpStatus: response.status };
    const body = await response.json();
    if (body?.ok !== true) return { status: "failed", reason: "unexpected_response" };
    return { status: "refreshed" };
  } catch {
    // Provider error messages or response bodies might contain credentials.
    return { status: "failed", reason: "request_failed" };
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  nextEnv.loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
  const result = await refreshExerciseCache();
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== "refreshed") process.exitCode = 2;
}
