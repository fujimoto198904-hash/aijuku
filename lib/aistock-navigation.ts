export function isAistockNavActive(href: string, pathname: string) {
  const isWithin = (path: string) =>
    pathname === path || pathname.startsWith(path + '/');
  if (href === '/') {
    return (
      pathname === '/' ||
      isWithin('/posts') ||
      (isWithin('/community') && !isWithin('/community/new'))
    );
  }
  if (href === '/learn')
    return (
      isWithin('/learn') || isWithin('/textbook') || pathname === '/level-test'
    );
  return isWithin(href);
}
