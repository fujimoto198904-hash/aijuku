export type DiscoveryView = 'posts' | 'textbook' | 'people';

export function discoveryPath(view: DiscoveryView, q = '', page = 1) {
  return (
    '/discover?' +
    new URLSearchParams({
      view,
      q,
      ...(page > 1 ? { page: String(page) } : {}),
    })
  );
}

/** URLを直接開いた場合も、最終ページの範囲に収める。 */
export function discoveryPage<T>(items: readonly T[], requestedPage: number) {
  const size = 12;
  const pages = Math.max(1, Math.ceil(items.length / size));
  const page = Math.max(1, Math.min(pages, Math.floor(requestedPage) || 1));
  const offset = (page - 1) * size;
  return {
    items: items.slice(offset, offset + size),
    page,
    pages,
    total: items.length,
    from: items.length ? offset + 1 : 0,
    to: Math.min(offset + size, items.length),
  };
}
