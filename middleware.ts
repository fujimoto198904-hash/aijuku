import { NextResponse, type NextRequest } from 'next/server';
import {
  portfolioOnly,
  isPortfolioClosedPage,
  isPortfolioBlockedRequest,
  portfolioUnavailable,
} from './lib/site-features';
import { withSiteBasePath } from './lib/site-paths';

export function middleware(request: NextRequest) {
  if (!portfolioOnly) return NextResponse.next();
  if (isPortfolioBlockedRequest(request.nextUrl.pathname, request.method)) {
    return portfolioUnavailable();
  }
  if (isPortfolioClosedPage(request.nextUrl.pathname)) {
    return NextResponse.redirect(
      new URL(withSiteBasePath('/about'), request.url),
      {
        status: 307,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|assets|brand|downloads).*)'],
};
