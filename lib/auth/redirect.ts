export const GOOGLE_OAUTH_NEXT_COOKIE = "noi_gym_google_oauth_next";

export function getSafeNextPath(value: string | null | undefined, fallback = "/") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}

export function getRequestOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();

  if (!forwardedHost) return requestUrl.origin;

  const protocol = forwardedProtocol
    || (forwardedHost.startsWith("localhost") || forwardedHost.startsWith("127.0.0.1") ? "http" : "https");
  return `${protocol}://${forwardedHost}`;
}
