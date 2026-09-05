import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import nextConfig from '../next.config';
import { isAistockNavActive } from '../lib/aistock-navigation';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PostStock } from '../components/post-stock';
import { mixLearningFeed } from '../lib/social-feed';
import { UsernameRegistrationForm } from '../components/username-registration-form';
import { AuthPasswordInput } from '../components/auth-password-input';
import { MemberLoginForm } from '../components/member-login-form';
import { RecoveryCodeCard } from '../components/recovery-code-card';

const accountBadgeSource = readFileSync(
  new URL('../components/social-avatar.tsx', import.meta.url),
  'utf8',
);
assert.match(
  accountBadgeSource,
  /className="as-account-badge is-ai">公式AI<\/span>/,
);
assert(!accountBadgeSource.includes('公式AI · 架空'));
const characterSource = readFileSync(
  new URL('../lib/official-characters.ts', import.meta.url),
  'utf8',
);
assert(
  characterSource.includes('人物像と投稿はMON-ai制作のフィクションです。'),
);

const signupMarkup = renderToStaticMarkup(
  createElement(UsernameRegistrationForm, { returnTo: '/messages?to=friend' }),
);
assert.equal(
  (signupMarkup.match(/<input\b/g) ?? []).length,
  3,
  'signup asks for username, password and consent only',
);
assert(signupMarkup.includes('autoComplete="username"'));
assert(signupMarkup.includes('autoComplete="new-password"'));
assert(signupMarkup.includes('minLength="8"'));
assert(!signupMarkup.includes('type="email"'));
assert(
  !signupMarkup.includes('復旧コード'),
  'optional recovery must not interrupt signup',
);
const recoveryMarkup = renderToStaticMarkup(
  createElement(RecoveryCodeCard, {
    username: 'fixture_only',
    code: 'fixture-not-a-real-code',
    next: '/mypage#account',
  }),
);
assert(
  !recoveryMarkup.includes('type="checkbox"'),
  'returning from optional recovery must not require a saved-code checkbox',
);
assert(!recoveryMarkup.includes('disabled=""'));
const pattern = signupMarkup.match(/pattern="([^"]+)"/)?.[1];
assert(pattern);
const usernamePattern = new RegExp('^(?:' + pattern + ')$', 'v');
assert(usernamePattern.test('sora_01') && usernamePattern.test('Sora-01'));
assert(
  !usernamePattern.test('ab') && !usernamePattern.test('sora@example.test'),
);
const currentPasswordMarkup = renderToStaticMarkup(
  createElement(AuthPasswordInput, { id: 'recovery-current', current: true }),
);
assert(
  !currentPasswordMarkup.includes('aria-describedby'),
  'do not reference a missing hint',
);
const loginMarkup = renderToStaticMarkup(
  createElement(MemberLoginForm, {
    returnTo: '/messages?to=friend',
    verificationPath: '/signin-with-chatgpt',
  }),
);
assert(loginMarkup.includes('/join?return_to=%2Fmessages%3Fto%3Dfriend'));
assert(
  loginMarkup.includes('/account/recover?return_to=%2Fmessages%3Fto%3Dfriend'),
);

for (const saved of [false, true]) {
  const markup = renderToStaticMarkup(
    createElement(PostStock, {
      postRef: 'official-email',
      canSave: true,
      initialSaved: saved,
      compact: true,
    }),
  );
  assert(markup.includes('aria-label="この投稿を保存"'));
  assert(markup.includes(`aria-pressed="${saved}"`));
  assert(
    !markup.includes('data-feedback="saved"'),
    'Initial render must not celebrate a new save',
  );
}
for (const n of [0, 1, 2, 5, 20]) {
  const members = Array.from({ length: n }, (_, i) => 'member-' + i),
    guides = ['guide-1', 'guide-2', 'guide-3'];
  const mixed = mixLearningFeed(members, guides);
  assert.equal(mixed.length, members.length + guides.length);
  assert.equal(
    new Set(mixed.map((i) => i.value)).size,
    mixed.length,
    'No duplicate guide cards',
  );
  assert.deepEqual(
    mixed.filter((i) => i.type === 'member').map((i) => i.value),
    members,
  );
}
const guestMarkup = renderToStaticMarkup(
  createElement(PostStock, { postRef: 'official-email', compact: true }),
);
assert(guestMarkup.includes('aria-label="ログインしてこの投稿を保存"'));
assert(
  !guestMarkup.includes('aria-pressed'),
  'Guest action is a login link, not a saved-state toggle',
);

const nav = ['/', '/discover', '/community/new', '/learn', '/mypage'];
const routes: [string, string | undefined][] = [
  ['/', '/'],
  ['/community', '/'],
  ['/community/post-123', '/'],
  ['/posts/official-email', '/'],
  ['/community/new', '/community/new'],
  ['/community/new/draft', '/community/new'],
  ['/discover', '/discover'],
  ['/learn', '/learn'],
  ['/textbook', '/learn'],
  ['/textbook/lesson/Lv.05', '/learn'],
  ['/textbook/columns', '/learn'],
  ['/level-test', '/learn'],
  ['/mypage', '/mypage'],
  ['/mypage/notebook', '/mypage'],
  ['/mypage/saved', '/mypage'],
  ['/aikanri', undefined],
  ['/join', undefined],
  ['/discover-other', undefined],
  ['/textbook-other', undefined],
];
for (const [path, expected] of routes) {
  assert.deepEqual(
    nav.filter((href) => isAistockNavActive(href, path)),
    expected ? [expected] : [],
    path,
  );
}

const rules = await nextConfig.headers!();
for (const route of [
  '/',
  '/community',
  '/community/:path*',
  '/discover',
  '/posts/:path*',
  '/u/:path*',
]) {
  const headers = rules
    .filter((rule) => rule.source === route)
    .flatMap((rule) => rule.headers);
  const cache = headers.find((header) => header.key === 'Cache-Control');
  assert.match(cache?.value ?? '', /private/);
  assert.match(cache?.value ?? '', /no-store/);
  assert(
    !headers.some((header) => header.key === 'X-Robots-Tag'),
    `Public route must remain indexable: ${route}`,
  );
}
for (const route of ['/messages', '/messages/:path*']) {
  const headers = rules
    .filter((r) => r.source === route)
    .flatMap((r) => r.headers);
  assert(
    headers.some(
      (h) => h.key === 'Cache-Control' && h.value.includes('no-store'),
    ),
  );
  assert(
    headers.some(
      (h) => h.key === 'X-Robots-Tag' && h.value.includes('noindex'),
    ),
  );
}

const globals = readFileSync(
  new URL('../app/globals.css', import.meta.url),
  'utf8',
);
const css = readFileSync(
  new URL('../app/aistock.css', import.meta.url),
  'utf8',
);
const socialCss = readFileSync(
  new URL('../app/social.css', import.meta.url),
  'utf8',
);
const token = (name: string) => {
  const color = globals.match(new RegExp(`--as-${name}: (#[0-9a-f]{6});`))?.[1];
  assert(color, `Missing color token ${name}`);
  return color;
};
const luminance = (hex: string) => {
  const channels = hex
    .slice(1)
    .match(/../g)!
    .map((c) => parseInt(c, 16) / 255);
  const linear = channels.map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
};
const contrast = (a: string, b: string) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};
for (const [foreground, background] of [
  [token('muted'), token('surface')],
  [token('muted'), token('tint')],
  [token('muted'), token('canvas')],
  [token('muted'), token('controls')],
  [token('ink'), token('surface')],
  [token('ink'), token('controls')],
  [token('green'), token('controls')],
  [token('green'), token('surface')],
  ['#ffffff', token('green')],
  ['#48486a', '#eef0f9'],
]) {
  assert(
    contrast(foreground, background) >= 4.5,
    `Text contrast ${foreground}/${background}`,
  );
}
assert.equal(
  new Set([token('canvas'), token('controls'), token('surface')]).size,
  3,
  'Page canvas, compact controls and reading surfaces remain distinct',
);
assert.match(
  css,
  /\.as-feed-controls,\s*\.as-discover-controls\s*\{[^}]*background: var\(--as-controls\)/,
);
assert.match(
  css,
  /\.as-social-feed \.as-post\s*\{[^}]*background: var\(--as-surface\)/,
);
assert.match(css, /\.as-post-copy > p\s*\{\s*font-size: 1rem/);
assert.match(css, /\.as-feed-subtabs a\s*\{\s*font-size: 0\.8125rem/);
assert.match(css, /\.as-feed-tabs a\s*\{[^}]*min-height: 44px/);
assert.match(socialCss, /\.as-profile-tabs > button\s*\{[^}]*min-height: 44px/);
assert.match(css, /\.as-search input\s*\{[^}]*font-size: 16px/);
assert.match(css, /\.as-discover-keywords\s*\{[^}]*overflow-x: auto/);
const feedSource = readFileSync(
  new URL('../components/community-feed.tsx', import.meta.url),
  'utf8',
);
const discoverSource = readFileSync(
  new URL('../app/discover/page.tsx', import.meta.url),
  'utf8',
);
assert(feedSource.includes('className="as-feed-controls"'));
assert.match(
  feedSource,
  /className="as-feed-options" open=\{Boolean\(kind\)\}/,
);
assert(feedSource.includes('className="as-feed-learn"'));
const headerSource = readFileSync(
  new URL('../components/site-header.tsx', import.meta.url),
  'utf8',
);
assert(headerSource.includes('className="as-nav-label">{label}</span>'));
assert.match(css, /@media \(max-width: 739px\)/);
assert.match(css, /\.as-nav-label\s*\{[^}]*clip-path: inset\(50%\)/);
assert.match(css, /\.as-nav-item\s*\{[^}]*min-height: 48px/);
assert.match(
  css,
  /\.as-post-author > a:first-child\s*\{[^}]*min-width: 44px;\s*min-height: 44px/,
);
assert.match(css, /\.as-social-feed \.as-post-photo\s*\{\s*aspect-ratio: 4\/3/);
assert.match(
  css,
  /\.as-social-feed \.as-post > a\.as-post-photo img\s*\{\s*object-fit: contain/,
);
assert.match(
  css,
  /@media \(prefers-reduced-motion: no-preference\)\s*\{[\s\S]*@view-transition\s*\{\s*navigation: auto/,
);
assert(!css.includes('animation-delay: 120ms'));
assert(!globals.includes('transition: left'));
assert.match(
  globals,
  /@media \(hover: hover\) and \(pointer: fine\) and \(prefers-reduced-motion: no-preference\)\s*\{\s*\.soft-interactive:hover/,
);
assert(discoverSource.includes('className="as-discover-controls"'));
assert(discoverSource.includes('className="as-discover-keywords"'));
assert.match(css, /prefers-reduced-motion: reduce/);
assert.match(css, /transition: none !important/);
assert.match(css, /forced-colors: active/);
assert.match(
  css,
  /\.as-social-actions \.as-inline-error\s*\{\s*grid-column: 1 \/ -1/,
);
console.log(
  'AIstock UI checks passed: navigation, private saved-state cache policy, section surfaces, readable content, compact controls, text contrast, motion and focus fallbacks.',
);
