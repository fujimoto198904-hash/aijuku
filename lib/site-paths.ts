export const publicSiteBasePath = '/aistock';

export const siteBasePath = process.env.NEXT_PUBLIC_SITE_BASE_PATH ?? '';

export const canonicalPublicUrl = `https://mon-ai.jp${publicSiteBasePath}`;

// The parent Vercel rewrite exposes the existing Sites runtime at /aistock.
// Keep public links on the branded domain unless explicitly overridden.
const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '');
export const canonicalSiteUrl = configuredSiteUrl || canonicalPublicUrl;

const ABSOLUTE_URL_PATTERN = /^[a-z][a-z\d+.-]*:/i;

export function withSiteBasePath(pathname: string): string {
  if (ABSOLUTE_URL_PATTERN.test(pathname) || pathname.startsWith('//')) {
    return pathname;
  }
  if (pathname.startsWith('/#')) {
    return siteBasePath ? `${siteBasePath}${pathname.slice(1)}` : pathname;
  }
  if (!pathname || pathname === '/') return siteBasePath || '/';
  if (pathname.startsWith('#') || pathname.startsWith('?')) {
    return `${siteBasePath || '/'}${pathname}`;
  }
  if (!siteBasePath) {
    return pathname.startsWith('/') ? pathname : `/${pathname}`;
  }
  if (
    pathname === siteBasePath ||
    pathname.startsWith(`${siteBasePath}/`) ||
    pathname.startsWith(`${siteBasePath}?`) ||
    pathname.startsWith(`${siteBasePath}#`)
  ) {
    return pathname;
  }

  return `${siteBasePath}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

export function canonicalPublicPath(pathname = '/'): string {
  if (!pathname || pathname === '/') return canonicalSiteUrl;
  return `${canonicalSiteUrl}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

export function withoutSiteBasePath(pathname: string): string {
  if (!siteBasePath) return pathname;
  if (pathname === siteBasePath) return '/';
  if (pathname.startsWith(`${siteBasePath}/`)) {
    return pathname.slice(siteBasePath.length) || '/';
  }
  return pathname;
}
