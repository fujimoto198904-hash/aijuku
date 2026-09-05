import { normalizeLoginId } from '@/lib/password-security';
import { withoutSiteBasePath, publicSiteBasePath } from '@/lib/site-paths';

export function registrationUsername(value: unknown): string {
  const name = normalizeLoginId(value);
  return /^[a-z0-9][a-z0-9_-]{2,23}$/.test(name) ? name : '';
}

export function reservedRegistrationUsername(name: string, ownerLoginId = '') {
  const compact = name.replace(/[-_]/g, '');
  return (
    /^(admin|administrator|root|support|staff|official|aikanri|aitock|aistock|monai|demo)(\d*)$/.test(
      compact,
    ) || name === normalizeLoginId(ownerLoginId)
  );
}

// Used on both sides of signup; never forward external URLs or auth endpoints.
export function registrationReturnTo(value: unknown): string {
  if (
    typeof value !== 'string' ||
    value.length > 2048 ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    Array.from(value).some(
      (c) => c === '\\' || c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127,
    )
  )
    return '/mypage';
  try {
    const url = new URL(value, 'https://member.local');
    let normalizedPath = withoutSiteBasePath(url.pathname);
    for (const prefix of [publicSiteBasePath, '/aijuku']) {
      if (normalizedPath === prefix) normalizedPath = '/';
      else if (normalizedPath.startsWith(prefix + '/'))
        normalizedPath = normalizedPath.slice(prefix.length);
    }
    const path = decodeURIComponent(normalizedPath);
    if (
      url.origin !== 'https://member.local' ||
      path.startsWith('//') ||
      Array.from(path).some(
        (c) => c === '\\' || c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127,
      ) ||
      /^\/(api|login|join|signin-with-chatgpt|signout-with-chatgpt|callback)(\/|$)/.test(
        path,
      ) ||
      /^\/account\/(recover|password)(\/|$)/.test(path)
    )
      return '/mypage';
    return `${normalizedPath}${url.search}${url.hash}`;
  } catch {
    return '/mypage';
  }
}
