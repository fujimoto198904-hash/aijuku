// 有料サービスを再開するときは docs/AISTOCK_MIGRATION.md の手順を確認する。
export const paidServicesEnabled: boolean = false;

// 2026-09-29: 運用を終了し、作品の閲覧だけを残す。データは削除しない。
export const portfolioOnly: boolean = true;
export const portfolioNotice =
  '制作実績として公開しています。更新・会員登録・投稿・お問い合わせは受け付けていません。';

export function portfolioPath(path: string): string {
  let pathname = path.startsWith('/')
    ? path.split(/[?#]/)[0]
    : new URL(path, 'https://mon-ai.jp').pathname;
  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    /* malformed routes remain unavailable */
  }
  return (
    pathname
      .replace(/\/{2,}/g, '/')
      .replace(/^\/(?:aistock|aijuku)(?=\/|$)/, '') || '/'
  );
}

export function isPortfolioClosedPage(path: string): boolean {
  return (
    /^\/(?:join|login|messages|mypage|account|admin|aikanri|book|booking|reserve|contact|inquiry)(?:\/|$)/.test(
      portfolioPath(path),
    ) || /^\/community\/new(?:\/|$)/.test(portfolioPath(path))
  );
}

export function isPortfolioBlockedRequest(
  path: string,
  method: string,
): boolean {
  if (!portfolioOnly) return false;
  const pathname = portfolioPath(path);
  // 既存セッションの終了と、過去の決済通知の署名検証は維持する。
  if (pathname === '/api/auth/logout' || pathname === '/api/billing/webhook')
    return false;
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) return true;
  // OAuth は GET でも登録・更新する。旧入口も含め、ここで止める。
  return /^\/api\/(?:auth|admin|official-automation|membership|social|learning|lesson-progress|skills)(?:\/|$)/.test(
    pathname,
  );
}

export function portfolioUnavailable(): Response {
  return Response.json(
    { error: portfolioNotice, code: 'PORTFOLIO_READ_ONLY' },
    {
      status: 410,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}

export function paidServiceUnavailable(): Response {
  return Response.json(
    {
      error: '現在、有料サービスの受付は行っていません。',
      code: 'PAID_SERVICES_DISABLED',
    },
    { status: 410, headers: { 'Cache-Control': 'no-store' } },
  );
}
