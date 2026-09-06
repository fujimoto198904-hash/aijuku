import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import nextConfig from '../next.config';
import { isAistockNavActive } from '../lib/aistock-navigation';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PostStock, PostStockNotice } from '../components/post-stock';
import {
  mixLearningFeed,
  communityFeedPath,
  followingEmptyState,
} from '../lib/social-feed';
import { discoveryPage, discoveryPath } from '../lib/discovery';
import { UsernameRegistrationForm } from '../components/username-registration-form';
import { AuthPasswordInput } from '../components/auth-password-input';
import { MemberLoginForm } from '../components/member-login-form';
import { RecoveryCodeCard } from '../components/recovery-code-card';
import { MemberLearningProgress } from '../components/member-learning-progress';
import { SkillPassport } from '../components/skill-passport';
import { mypageTabForAnchor } from '../components/mypage-tabs';
import {
  textbookRecordPath,
  textbookWorkRecordPath,
  textbookQuestionPath,
} from '../lib/textbook-routes';

const lessonFixture = {
  id: 'Lv.05',
  title: 'メールの返信',
  outcome: '返信文',
  courseTitle: '基礎',
  trackLabel: '共通',
};
// Render the real composer without a browser. Only framework navigation/image
// adapters are stubbed; React stays shared with renderToStaticMarkup.
const composerBundle = await build({
  stdin: {
    contents: "export { CommunityForm } from './components/community-form';",
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
  plugins: [
    {
      name: 'composer-render-adapters',
      setup(plugin) {
        plugin.onResolve({ filter: /^[^./]/ }, ({ path }) => {
          if (path.startsWith('@/') || path.startsWith('next/')) return;
          return {
            path: import.meta.resolve(path),
            external: true,
          };
        });
        plugin.onResolve(
          { filter: /^next\/(navigation|image)$/ },
          ({ path }) => ({ path, namespace: 'composer-check' }),
        );
        plugin.onLoad(
          { filter: /.*/, namespace: 'composer-check' },
          ({ path }) => ({
            contents:
              path === 'next/navigation'
                ? 'export function useRouter(){return {refresh(){}}}'
                : 'export default function Image(){return null}',
            loader: 'js',
          }),
        );
      },
    },
  ],
});
const { CommunityForm } = (await import(
  'data:text/javascript;base64,' +
    Buffer.from(
      composerBundle.outputFiles[0].text +
        '\n//# sourceURL=aistock-composer-check.mjs',
    ).toString('base64')
)) as {
  CommunityForm: typeof import('../components/community-form').CommunityForm;
};
assert.equal(
  textbookQuestionPath(lessonFixture.id),
  '/community/new?kind=question&task=Lv.05',
);
const questionMarkup = renderToStaticMarkup(
  createElement(CommunityForm, {
    initialKind: 'question',
    taskId: lessonFixture.id,
    taskTitle: lessonFixture.title,
    publicProfile: { name: '学ぶひと', handle: 'learner' },
  }),
);
assert(
  questionMarkup.includes('質問を投稿する') &&
    questionMarkup.includes('試したこと・分からないところ'),
);
assert(
  questionMarkup.includes('Lv.05 メールの返信') &&
    questionMarkup.includes('target="_blank"'),
);
assert(
  !/<input[^>]*name="publicConsent"[^>]*checked/.test(questionMarkup),
  'public consent must be unchecked',
);
assert.match(
  questionMarkup,
  /<textarea[^>]*name="body"[^>]*><\/textarea>/,
  'question body must not claim actions the learner never did',
);
const noteShareMarkup = renderToStaticMarkup(
  createElement(CommunityForm, {
    initialKind: 'learning',
    initialBody: '自分で試したこと\n\n自分で直したところ',
    taskId: lessonFixture.id,
    taskTitle: lessonFixture.title,
  }),
);
assert(
  noteShareMarkup.includes('自分で試したこと\n\n自分で直したところ') &&
    !noteShareMarkup.includes('質問を投稿する'),
);
const replyMarkup = renderToStaticMarkup(
  createElement(CommunityForm, { postId: 'fixture-post' }),
);
assert(
  replyMarkup.includes('返信する') &&
    !replyMarkup.includes('何に困っていますか？'),
);
const composerSource = readFileSync(
  new URL('../components/community-form.tsx', import.meta.url),
  'utf8',
);
assert.match(composerSource, /checked=\{kind === selectedKind\}/);
assert.match(composerSource, /onChange=\{\(\) => setSelectedKind\(kind\)\}/);
assert.match(
  composerSource,
  /defaultValue=\{initialBody\}/,
  'changing kind must not overwrite a note or typed text',
);
const questionPageSource = readFileSync(
  new URL('../app/community/new/page.tsx', import.meta.url),
  'utf8',
);
assert.match(questionPageSource, /getLearningNote\(user.userId, noteId\)/);
assert.match(questionPageSource, /\[note.body, note.humanFix\]/);
assert.match(questionPageSource, /noteId && !note/);
assert.match(
  questionPageSource,
  /'\/join\?return_to=' \+ encodeURIComponent\(returnTo\)/,
);
assert.match(
  questionPageSource,
  /'\/mypage\/onboarding\?return_to=' \+ encodeURIComponent\(returnTo\)/,
);
const onboardingSource = readFileSync(
  new URL('../app/mypage/onboarding/page.tsx', import.meta.url),
  'utf8',
);
assert.match(
  onboardingSource,
  /registrationReturnTo\(params\?\.return_to \?\? '\/mypage'\)/,
);
assert.match(
  onboardingSource,
  /'\/mypage\/onboarding\?return_to=' \+ encodeURIComponent\(returnTo\)/,
);
const questionReaderSource = readFileSync(
  new URL('../components/textbook/lesson-reader.tsx', import.meta.url),
  'utf8',
);
assert.match(questionReaderSource, /href=\{textbookQuestionPath\(task.id\)\}/);
assert(
  !questionReaderSource.includes('質問の下書き') &&
    !questionReaderSource.includes('相談メモをコピー'),
);
assert.equal(
  textbookRecordPath(lessonFixture.id),
  '/mypage?task=Lv.05#learning',
);
assert.equal(
  textbookWorkRecordPath(lessonFixture.id),
  '/mypage?task=Lv.05#skill-record',
);
assert.equal(
  new URL(
    textbookRecordPath('日本語 & task'),
    'https://example.test',
  ).searchParams.get('task'),
  '日本語 & task',
);
assert.equal(mypageTabForAnchor('skill-record'), 'skills');
for (const tab of ['posts', 'saved', 'learning', 'skills', 'account'])
  assert.equal(mypageTabForAnchor(tab), tab);
assert.equal(mypageTabForAnchor('unknown'), null);
const learningMarkup = renderToStaticMarkup(
  createElement(MemberLearningProgress, {
    tasks: [lessonFixture],
    initialProgress: [],
    initialTaskId: lessonFixture.id,
  }),
);
assert(
  learningMarkup.includes('あとでやるに保存') &&
    learningMarkup.includes('完了にする'),
);
assert(
  learningMarkup.includes('自分用メモを書く') &&
    learningMarkup.includes('作品・資料を残す'),
);
assert(
  learningMarkup.includes('notebook?task=Lv.05') &&
    learningMarkup.includes('task=Lv.05#skill-record'),
);
const doneLearningMarkup = renderToStaticMarkup(
  createElement(MemberLearningProgress, {
    tasks: [lessonFixture],
    initialTaskId: lessonFixture.id,
    initialProgress: [
      {
        taskId: lessonFixture.id,
        bookmarked: false,
        completed: true,
        completedAt: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    ],
  }),
);
assert(
  doneLearningMarkup.includes('未完了へ戻す') &&
    !doneLearningMarkup.includes('あとでやるに保存'),
);
assert(
  !/href="[^"]*\?task=Lv\.05#learning"/.test(doneLearningMarkup),
  'same-page record selection must update local task state, not follow a stale hash',
);
const learningSource = readFileSync(
  new URL('../components/member-learning-progress.tsx', import.meta.url),
  'utf8',
);
assert.match(learningSource, /onClick=\{\(\) => selectTaskForRecord\(task\)\}/);
assert.match(
  learningSource,
  /function selectTaskForRecord\(task: MemberLearningTask\)\s*\{\s*setSelectedTaskId\(task.id\);\s*setQuery\(task.id\)/,
);
const demoLearningMarkup = renderToStaticMarkup(
  createElement(MemberLearningProgress, {
    tasks: [lessonFixture],
    initialProgress: [],
    initialTaskId: lessonFixture.id,
    readOnly: true,
  }),
);
assert(
  !demoLearningMarkup.includes('作品・資料を残す') &&
    !demoLearningMarkup.includes('自分用メモを書く'),
);
const workMarkup = renderToStaticMarkup(
  createElement(SkillPassport, {
    profile: {
      memberId: 'fixture',
      publicSlug: 'fixture',
      headline: '',
      targetRole: '',
      bio: '',
      shareEnabled: false,
      createdAt: 1,
      updatedAt: 1,
    },
    evidence: [],
    tasks: [lessonFixture],
    initialTaskId: lessonFixture.id,
  }),
);
assert(
  workMarkup.includes('id="skill-record"') &&
    workMarkup.includes('value="Lv.05 メールの返信"'),
);
assert(workMarkup.includes('aria-current="true"'));
assert(
  workMarkup.includes('value="private" selected=""'),
  'work defaults to private visibility',
);
for (const file of ['lesson-reader.tsx', 'task-explorer.tsx']) {
  const source = readFileSync(
    new URL('../components/textbook/' + file, import.meta.url),
    'utf8',
  );
  assert(
    source.includes('textbookRecordPath(task.id)') &&
      source.includes('マイページで記録する'),
  );
  assert(
    !source.includes('マイページで保存') && !source.includes('学習記録へ残す'),
  );
}

const searchFixture = Array.from({ length: 29 }, (_, i) => `task-${i}`);
const searchPages = [1, 2, 3].map((p) => discoveryPage(searchFixture, p));
assert.deepEqual(
  searchPages.flatMap((p) => p.items),
  searchFixture,
);
assert.deepEqual(
  searchPages.map((p) => [p.from, p.to]),
  [
    [1, 12],
    [13, 24],
    [25, 29],
  ],
);
assert.equal(discoveryPage(searchFixture, 1000).page, 3);
assert.equal(discoveryPage(searchFixture, -1).page, 1);
assert.equal(discoveryPage(searchFixture, NaN).page, 1);
assert.deepEqual(discoveryPage([], 1000), {
  items: [],
  page: 1,
  pages: 1,
  total: 0,
  from: 0,
  to: 0,
});
for (const view of ['posts', 'textbook', 'people'] as const) {
  const url = new URL(
    discoveryPath(view, '画像 & AI / 仕事', 2),
    'https://example.test',
  );
  assert.equal(url.searchParams.get('q'), '画像 & AI / 仕事');
  assert.equal(url.searchParams.get('view'), view);
  assert.equal(url.searchParams.get('page'), '2');
  assert(!discoveryPath(view, '画像', 1).includes('page='));
}
assert.equal(
  communityFeedPath('following', 'question', 2),
  '/community?view=following&kind=question&page=2',
);
assert.equal(
  communityFeedPath('textbook', 'question'),
  '/community?view=textbook',
);
const guestFollowing = followingEmptyState({
  signedIn: false,
  publicProfile: false,
  kind: 'question',
});
assert.equal(
  new URL(guestFollowing.href, 'https://example.test').searchParams.get(
    'return_to',
  ),
  '/community?view=following&kind=question',
);
assert.equal(
  followingEmptyState({ signedIn: true, publicProfile: false }).href,
  '/mypage#account',
);
assert.equal(
  followingEmptyState({ signedIn: true, publicProfile: true }).href,
  '/discover?view=people',
);
assert.equal(
  followingEmptyState({ signedIn: true, publicProfile: true, kind: 'question' })
    .href,
  '/community?view=following',
);
assert.equal(
  followingEmptyState({
    signedIn: true,
    publicProfile: true,
    page: 2,
    kind: 'question',
  }).href,
  '/community?view=following&kind=question',
);
const savedNotice = renderToStaticMarkup(
  createElement(PostStockNotice, { notice: '保存しました。', saved: true }),
);
assert(
  savedNotice.includes('class="as-stock-notice"') &&
    savedNotice.includes('aria-live="polite"'),
);
assert(
  savedNotice.includes('/mypage#saved') &&
    savedNotice.includes('保存済みを見る'),
);
assert(
  !renderToStaticMarkup(
    createElement(PostStockNotice, { notice: '', saved: true }),
  ).includes('<a'),
);
assert(
  !renderToStaticMarkup(
    createElement(PostStockNotice, {
      notice: '保存を解除しました。',
      saved: false,
    }),
  ).includes('<a'),
);

const accountBadgeSource = readFileSync(
  new URL('../components/social-avatar.tsx', import.meta.url),
  'utf8',
);
assert.match(
  accountBadgeSource,
  /className="as-account-badge is-ai">公式AI<\/span>/,
);
assert(!accountBadgeSource.includes('公式AI · 架空'));
// Official-AI badges identify the accounts without repetitive reading-page notices.
for (const source of [
  '../components/social-profile.tsx',
  '../app/community/[id]/page.tsx',
  '../app/u/[handle]/page.tsx',
]) {
  const content = readFileSync(new URL(source, import.meta.url), 'utf8');
  assert(!content.includes('officialAiDisclosure'));
  assert(!content.includes('架空の投稿例と教材のヒントを届ける'));
}
assert(
  readFileSync(
    new URL('../app/terms/page.tsx', import.meta.url),
    'utf8',
  ).includes('AIキャラクターの人物像や投稿はフィクション'),
);

const signupMarkup = renderToStaticMarkup(
  createElement(UsernameRegistrationForm, { returnTo: '/messages?to=friend' }),
);
assert.equal(
  (signupMarkup.match(/<input\b/g) ?? []).length,
  4,
  'signup asks for one display name, unique ID, password and consent',
);
assert(signupMarkup.includes('autoComplete="username"'));
assert(signupMarkup.includes('autoComplete="new-password"'));
assert(signupMarkup.includes('minLength="8"'));
assert(!signupMarkup.includes('type="email"'));
assert(signupMarkup.includes('表示名') && signupMarkup.includes('ユーザーID'));
assert(
  signupMarkup.includes('maxLength="30"') &&
    signupMarkup.includes('maxLength="24"'),
);
const accountMarkup = readFileSync(
  new URL('../components/member-profile-settings.tsx', import.meta.url),
  'utf8',
);
assert(
  !accountMarkup.includes('<input'),
  'account panel must not contain a second name editor',
);
const photoMarkup = readFileSync(
  new URL('../components/post-image-input.tsx', import.meta.url),
  'utf8',
);
assert(
  photoMarkup.includes('プロフィール写真を変更') &&
    photoMarkup.includes('写真を削除'),
);
assert(
  photoMarkup.includes('image/png,image/jpeg,image/webp') &&
    photoMarkup.includes('rounded-full'),
);
const profileFormSource = readFileSync(
  new URL('../components/social-actions.tsx', import.meta.url),
  'utf8',
);
assert.match(profileFormSource, /purpose="avatar"/);
assert.match(profileFormSource, /expectedRevision: revision/);
assert.match(profileFormSource, /id="profile"/);
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
assert.match(
  discoverSource,
  /view === 'posts' \? await loadPostResults\(q, page\) : null/,
);
assert.match(
  discoverSource,
  /view === 'people' \? await searchSocialProfiles\(q, page\) : null/,
);
assert(discoverSource.includes('taskPage.items.map'));
assert(!discoverSource.includes('tasks.slice(0, 12)'));
assert(feedSource.includes('findTextbookTask(post.taskId)'));
assert(feedSource.includes("target={lessonHref ? '_blank' : undefined}"));
assert(feedSource.includes('この教材の作り方と準備を見る'));
assert(!feedSource.includes("view === 'following' && !me &&"));
assert.match(css, /prefers-reduced-motion: reduce/);
assert.match(
  css,
  /\.as-social-actions \.as-stock-notice\s*\{\s*flex-basis: 100%;\s*order: 10/,
);
assert.match(css, /transition: none !important/);
assert.match(css, /forced-colors: active/);
assert.match(
  css,
  /\.as-social-actions \.as-inline-error\s*\{\s*grid-column: 1 \/ -1/,
);
console.log(
  'AIstock UI checks passed: navigation, private saved-state cache policy, section surfaces, readable content, compact controls, text contrast, motion and focus fallbacks.',
);
