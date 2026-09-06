import { withSiteBasePath, withoutSiteBasePath } from './site-paths';

export const postCardAnchor = (postRef: string) => 'post-' + postRef;

export function missingPostReturnPath(
  hash: string,
  visibleRefs: readonly string[],
) {
  let id: string;
  try {
    id = decodeURIComponent(hash).replace(/^#post-/, '');
  } catch {
    return null;
  }
  if (
    !hash.startsWith('#post-') ||
    !/^[a-zA-Z0-9_-]{1,100}$/.test(id) ||
    visibleRefs.includes(id)
  )
    return null;
  return (id.startsWith('official-') ? '/posts/' : '/community/') + id;
}

/** Keep the current search/page when sign-in interrupts an explicit action. */
export function postActionLoginPath(
  location: { pathname: string; search: string; hash: string },
  anchor?: string,
) {
  const path = withoutSiteBasePath(location.pathname);
  const returnTo =
    (path.startsWith('/') && !path.startsWith('//') ? path : '/') +
    location.search +
    (anchor ? '#' + encodeURIComponent(anchor) : location.hash);
  return withSiteBasePath('/login?return_to=' + encodeURIComponent(returnTo));
}
