import {
  canonicalPublicMemberUrl,
  canonicalSitesUrl,
} from "@/lib/site-runtime";

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const browserOrigin = new URL(origin).origin;
    const requestOrigin = new URL(request.url).origin;
    const publicOrigin = new URL(canonicalPublicMemberUrl).origin;
    const sitesOrigin = new URL(canonicalSitesUrl).origin;
    const allowedOrigin =
      browserOrigin === requestOrigin ||
      (browserOrigin === publicOrigin && requestOrigin === sitesOrigin);
    const fetchSite = request.headers.get("sec-fetch-site");
    return allowedOrigin && (!fetchSite || fetchSite === "same-origin");
  } catch {
    return false;
  }
}

export function cleanRequestText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function cleanHttpsUrl(value: unknown): string | null | undefined {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || value.length > 2_000) return undefined;
  try {
    const url = new URL(value.trim());
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      isLocalOrPrivateHostname(url.hostname)
    ) {
      return undefined;
    }
    return url.toString();
  } catch {
    return undefined;
  }
}

function isLocalOrPrivateHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    normalized === "localhost" ||
    normalized === "::1" ||
    normalized === "0.0.0.0" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.startsWith("127.") ||
    normalized.startsWith("10.") ||
    normalized.startsWith("192.168.") ||
    normalized.startsWith("169.254.")
  ) {
    return true;
  }

  const match = normalized.match(/^172\.(\d{1,3})\./);
  return Boolean(match && Number(match[1]) >= 16 && Number(match[1]) <= 31);
}
