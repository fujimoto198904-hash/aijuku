import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  portfolioOnly,
  isPortfolioClosedPage,
  isPortfolioBlockedRequest,
  portfolioUnavailable,
} from '../lib/site-features';

assert.equal(portfolioOnly, true, 'portfolio must remain read-only');
assert(isPortfolioBlockedRequest('/aistock/%61pi/auth/google', 'GET'));
assert(isPortfolioBlockedRequest('//api//auth/google', 'GET'));
assert(isPortfolioClosedPage('/aistock/%6dessages'));
for (const prefix of ['', '/aistock', '/aijuku']) {
  for (const path of [
    '/join',
    '/login',
    '/messages',
    '/messages/thread',
    '/mypage/profile',
    '/account/recover',
    '/admin',
    '/aikanri',
    '/community/new',
  ]) {
    assert(isPortfolioClosedPage(prefix + path), path);
  }
  for (const path of [
    '/',
    '/about',
    '/discover',
    '/textbook/explore',
    '/textbook/lesson/Lv.05',
    '/community/example',
    '/u/aitock',
  ]) {
    assert(!isPortfolioClosedPage(prefix + path), path);
    assert(!isPortfolioBlockedRequest(prefix + path, 'GET'), path);
  }
  for (const path of [
    '/api/community',
    '/api/social',
    '/api/community/media',
    '/api/auth/register',
    '/api/auth/login',
    '/api/membership',
    '/api/learning',
    '/api/official-automation',
    '/api/applications',
    '/api/skills/evidence',
    '/api/admin/social',
    '/api/future-route',
  ]) {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE'])
      assert(
        isPortfolioBlockedRequest(prefix + path, method),
        `${method} ${path}`,
      );
  }
  for (const path of [
    '/api/auth/google',
    '/api/auth/google/callback',
    '/api/admin/google-calendar/callback',
    '/api/official-automation',
    '/api/social',
  ]) {
    assert(isPortfolioBlockedRequest(prefix + path, 'GET'), path);
  }
  assert(!isPortfolioBlockedRequest(prefix + '/api/community', 'GET'));
  assert(!isPortfolioBlockedRequest(prefix + '/api/auth/logout', 'POST'));
  assert(!isPortfolioBlockedRequest(prefix + '/api/billing/webhook', 'POST'));
}
const response = portfolioUnavailable();
assert.equal(response.status, 410);
assert.equal(response.headers.get('cache-control'), 'no-store');
assert.equal((await response.json()).code, 'PORTFOLIO_READ_ONLY');
for (const path of [
  'app/privacy/page.tsx',
  'app/terms/page.tsx',
  'components/site-footer.tsx',
]) {
  assert(
    !/mailto:|tel:|info@mon-ai\.jp|東梅坪町/.test(readFileSync(path, 'utf8')),
    path,
  );
}
assert.match(
  readFileSync('middleware.ts', 'utf8'),
  /isPortfolioBlockedRequest/,
);
console.log(
  'Portfolio: read-only routes, API gate, legacy paths and contact removal passed.',
);
