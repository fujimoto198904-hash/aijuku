import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { build } from 'esbuild';
import { Miniflare } from 'miniflare';
import { deflateSync } from 'node:zlib';

// A disposable, in-memory D1 database: never uses production or .wrangler data.
const mf = new Miniflare({
  modules: true,
  script: 'export default {fetch(){return new Response("test")}}',
  d1Databases: ['DB'],
  r2Buckets: ['MEDIA'],
  compatibilityDate: '2026-05-22',
});
const testGlobal = globalThis as typeof globalThis & {
  aistockTestEnv: Record<string, unknown>;
  aistockTestUser: unknown;
  aistockTestHeaders?: Headers;
};
const originalFetch = globalThis.fetch;
try {
  const DB = await mf.getD1Database('DB');
  let launchSeedSql = '';
  for (const name of (await readdir('drizzle'))
    .filter((n) => n.endsWith('.sql'))
    .sort()) {
    const sql = await readFile('drizzle/' + name, 'utf8');
    // First test an empty community, then apply the real launch migration
    // below against existing members before testing the seeded social feed.
    if (name === '0018_official_launch_seed.sql') {
      launchSeedSql = sql;
      continue;
    }
    for (const statement of sql
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean))
      await DB.prepare(statement).run();
  }
  testGlobal.aistockTestEnv = {
    DB,
    AUTH_PASSWORD_PEPPER: 'isolated-test-only-pepper-not-for-deployment',
    AUTH_OWNER_MEMBER_ID: 'test-owner',
    AUTH_OWNER_LOGIN_ID: 'owner@example.test',
    AUTH_GOOGLE_CLIENT_ID: 'test-client',
    AUTH_GOOGLE_CLIENT_SECRET: 'test-secret',
  };
  testGlobal.aistockTestUser = null;
  testGlobal.aistockTestEnv.MEDIA = await mf.getR2Bucket('MEDIA');
  const bundled = await build({
    stdin: {
      contents: `
 export * from './db/community';
 export * from './db/social';
 export * from './db/official-community';
 export {POST as socialPost} from './app/api/social/route';
 export {POST as socialAdminPost} from './app/api/admin/social/route';
 export * from './db/registration';
 export * from './db/username-registration';
 export * from './lib/username-registration';
 export { authenticatePassword,resolvePasswordSession,passwordAuthEmail,changeMemberPassword } from './db/member-auth';
 export { POST as login } from './app/api/auth/login/route';
 export { POST as recover } from './app/api/auth/recover/route';
 export * from './lib/community';
 export * from './lib/google-signin';
 export * from './db/learning-notes';
 export * from './lib/learning-notes';
 export * from './db/community-media';
 export * from './lib/post-image';
 export { POST as learningPost,GET as learningGet } from './app/api/learning/route';
 export { getChatGPTUser as realHeaderUser } from './app/chatgpt-auth';
 export { membershipTermsVersion,privacyPolicyVersion } from './db/membership';
 export { POST as communityPost } from './app/api/community/route';
 export { POST as register } from './app/api/auth/register/route';
 export { GET as googleCallback } from './app/api/auth/google/callback/route';
 export { POST as checkout } from './app/api/billing/checkout/route';
 export { POST as portal } from './app/api/billing/portal/route';
 export { POST as application, PATCH as applicationPatch } from './app/api/applications/route';
 export { PATCH as adminApplication } from './app/api/admin/applications/route';
 export { POST as calendarConnect } from './app/api/admin/google-calendar/connect/route';
 export { GET as calendarCallback } from './app/api/admin/google-calendar/callback/route';
 `,
      resolveDir: process.cwd(),
      loader: 'ts',
    },
    bundle: true,
    write: false,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    plugins: [
      {
        name: 'isolated-d1',
        setup(plugin) {
          plugin.onResolve({ filter: /^cloudflare:workers$/ }, () => ({
            path: 'env',
            namespace: 'aistock-test',
          }));
          plugin.onResolve({ filter: /^@\/app\/chatgpt-auth$/ }, () => ({
            path: 'auth',
            namespace: 'aistock-test',
          }));
          plugin.onResolve({ filter: /^next\/(headers|navigation)$/ }, () => ({
            path: 'headers',
            namespace: 'aistock-test',
          }));
          plugin.onLoad(
            { filter: /.*/, namespace: 'aistock-test' },
            ({ path }) => ({
              contents:
                path === 'env'
                  ? 'export const env=globalThis.aistockTestEnv;'
                  : path === 'headers'
                    ? 'export async function cookies(){return {get(){return undefined}}} export async function headers(){return globalThis.aistockTestHeaders??new Headers()} export function redirect(){throw new Error("Unexpected redirect in unit check")}'
                    : 'export {readChatGPTIdentityHeaders,safeRelativeReturnPath} from "./app/chatgpt-auth"; export async function getChatGPTUser(){return globalThis.aistockTestUser} export const getAuthenticatedUser=getChatGPTUser; export const getBillingAuthenticatedUser=getChatGPTUser; export async function getVerifiedChatGPTIdentity(){return null}',
              loader: 'js',
              resolveDir: process.cwd(),
            }),
          );
        },
      },
    ],
  });
  const api = await import(
    'data:text/javascript;base64,' +
      Buffer.from(bundled.outputFiles[0].contents).toString('base64')
  );
  const now = Date.now();
  for (const [id, consent] of [
    ['test-owner', true],
    ['test-one', true],
    ['test-two', true],
    ['test-old', false],
  ] as const) {
    await DB.prepare(
      'INSERT INTO members(id,email,display_name,status,terms_version,terms_accepted_at,privacy_version,privacy_accepted_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)',
    )
      .bind(
        id,
        id + '@example.test',
        id,
        'active',
        consent ? api.membershipTermsVersion : 'old',
        now,
        consent ? api.privacyPolicyVersion : 'old',
        now,
        now,
        now,
      )
      .run();
  }
  const asUser = (id: string, demo = false) => {
    testGlobal.aistockTestUser = {
      userId: id,
      displayName: id,
      email: id + '@example.test',
      loginId:
        id === 'test-owner' ? 'owner@example.test' : id + '@example.test',
      authMethod: 'password',
      isDemo: demo,
      mustChangePassword: false,
    };
  };
  const request = (data: unknown, origin = 'https://mon-ai.jp') =>
    new Request('https://mon-ai.jp/aistock/api/community', {
      method: 'POST',
      headers: {
        origin,
        'sec-fetch-site': 'same-origin',
        'content-type': 'application/json',
        'cf-connecting-ip': '192.0.2.1',
      },
      body: JSON.stringify(data),
    });
  const post = (overrides = {}) => ({
    action: 'post',
    kind: 'question',
    title: 'メールの下書きを試しました',
    body: '個人情報を消してから試しました。',
    nickname: '学ぶひと',
    publicConsent: true,
    requestId: crypto.randomUUID(),
    ...overrides,
  });
  const clearLimit = () =>
    DB.prepare('DELETE FROM community_write_limits').run();
  assert.equal((await api.communityPost(request(post()))).status, 401);
  asUser('test-one', true);
  assert.equal((await api.communityPost(request(post()))).status, 403);
  asUser('test-old');
  assert.equal((await api.communityPost(request(post()))).status, 403);
  asUser('test-one');
  assert.equal(
    (await api.communityPost(request(post(), 'https://attacker.example')))
      .status,
    403,
  );
  assert.equal(
    (await api.communityPost(request(post({ publicConsent: false })))).status,
    400,
  );
  for (const nickname of [
    'MON-ai 運営',
    'ＭＯＮ－ＡＩ',
    'AIstock管理者',
    'Aitock公式',
    'Ａｉｔｏｃｋ公式',
    'アイトック公式',
    'someone@example.test',
  ])
    assert.equal(
      (await api.communityPost(request(post({ nickname })))).status,
      400,
    );
  await clearLimit();
  assert.equal(
    (await api.communityPost(request(post({ body: 'x'.repeat(25000) }))))
      .status,
    400,
  );
  assert.equal(
    (await api.communityPost(request(post({ kind: 'other' })))).status,
    400,
  );
  assert.equal(
    (await api.communityPost(request(post({ taskId: 'not-a-task' })))).status,
    400,
  );
  const input = post();
  const response = await api.communityPost(request(input));
  assert.equal(response.status, 200);
  const saved = await response.json();
  const id = saved.next.split('/').at(-1);
  const duplicate = await api.communityPost(request(input));
  assert.deepEqual(await duplicate.json(), saved);
  assert.equal(
    (await api.communityPost(request({ ...input, body: '別の内容に直した' })))
      .status,
    409,
  );
  const feed = await api.listCommunityPosts();
  assert.equal(feed.posts.length, 1);
  assert.equal(feed.posts[0].authorRole, 'member');
  for (const field of ['authorId', 'email', 'requestId'])
    assert.equal(field in feed.posts[0], false);
  asUser('test-two');
  assert.equal(
    (await api.communityPost(request({ action: 'delete', target: 'post', id })))
      .status,
    404,
  );
  const replyInput = { ...post(), action: 'reply', postId: id };
  assert.equal((await api.communityPost(request(replyInput))).status, 200);
  assert.equal((await api.communityPost(request(replyInput))).status, 200);
  assert.equal((await api.getCommunityReplies(id)).length, 1);
  asUser('test-owner');
  const staffResponse = await api.communityPost(
    request(post({ kind: 'tip', nickname: 'MON-ai 運営' })),
  );
  assert.equal(staffResponse.status, 200);
  const staffId = (await staffResponse.json()).next.split('/').at(-1);
  assert.equal((await api.getCommunityPost(staffId)).authorRole, 'staff');
  assert.equal(
    (await api.communityPost(request({ action: 'delete', target: 'post', id })))
      .status,
    200,
  );
  assert.equal(await api.getCommunityPost(id), null);
  assert.equal(
    await api.writeCommunityReply({
      postId: id,
      authorId: 'test-two',
      authorName: 'ひと',
      authorRole: 'member',
      body: 'race',
      requestId: crypto.randomUUID(),
    }),
    null,
  );
  await clearLimit();
  asUser('test-one');
  const lastAllowed = post({ kind: 'learning' });
  for (let i = 0; i < 8; i++)
    assert.equal(
      (
        await api.communityPost(
          request(i === 7 ? lastAllowed : post({ kind: 'learning' })),
        )
      ).status,
      200,
    );
  assert.equal((await api.communityPost(request(post()))).status, 429);
  assert.equal(
    (await api.communityPost(request(lastAllowed))).status,
    200,
    'confirming a saved retry must not consume a new write slot',
  );

  // Verified tickets are one-use, expire, and cannot replace an existing login.
  testGlobal.aistockTestUser = null;
  const token = await api.createRegistrationTicket('new@example.test');
  assert.ok(await api.getRegistrationTicket(token));
  assert.equal(await api.getRegistrationTicket('invalid'), null);
  assert.equal(
    (
      await api.register(
        request({
          action: 'complete',
          token,
          nickname: 'はじめて',
          password: 'short',
          terms: true,
        }),
      )
    ).status,
    400,
  );
  const complete = {
    action: 'complete',
    token,
    nickname: 'はじめて',
    password: 'Study safely 2026!',
    terms: true,
  };
  const completed = await api.register(request(complete));
  assert.equal(completed.status, 200);
  assert.match(completed.headers.get('set-cookie'), /HttpOnly/);
  assert.match(completed.headers.get('set-cookie'), /Secure/);
  assert.equal(await api.getRegistrationTicket(token), null);
  assert.equal((await api.register(request(complete))).status, 400);
  const account = await DB.prepare(
    'SELECT password_digest,password_state FROM member_auth_accounts WHERE login_id=?',
  )
    .bind('new@example.test')
    .first();
  assert.equal(account?.password_state, 'personal');
  assert.notEqual(account?.password_digest, complete.password);
  const takeover = await api.createRegistrationTicket('new@example.test');
  await assert.rejects(
    api.completeRegistration({
      token: takeover,
      nickname: 'someone',
      password: 'Another safe 2026!',
    }),
  );
  const expiring = await api.createRegistrationTicket('expired@example.test');
  await DB.prepare('UPDATE registration_tickets SET expires_at=? WHERE email=?')
    .bind(now - 1, 'expired@example.test')
    .run();
  assert.equal(await api.getRegistrationTicket(expiring), null);
  const concurrentToken =
    await api.createRegistrationTicket('race@example.test');
  const raced = await Promise.allSettled(
    [1, 2].map(() =>
      api.completeRegistration({
        token: concurrentToken,
        nickname: '同時送信',
        password: 'Study safely 2026!',
      }),
    ),
  );
  assert.equal(raced.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(
    (
      await DB.prepare('SELECT count(*) AS n FROM members WHERE email=?')
        .bind('race@example.test')
        .first()
    )?.n,
    1,
  );
  assert.equal(
    (
      await api.register(
        request({ action: 'email', email: 'no-mail@example.test' }),
      )
    ).status,
    503,
    'unconfigured mail must not pretend to send',
  );
  // Real username signup, login and recovery SQL, with no email/Google network.
  const authRequest = (
    path: string,
    data: unknown,
    ip = '192.0.2.80',
    origin = 'https://mon-ai.jp',
  ) =>
    new Request('https://mon-ai.jp/aistock/api/auth/' + path, {
      method: 'POST',
      headers: {
        origin,
        'sec-fetch-site': 'same-origin',
        'content-type': 'application/json',
        'cf-connecting-ip': ip,
      },
      body: JSON.stringify(data),
    });
  const signup = (overrides = {}) => ({
    action: 'username',
    username: 'study_sora',
    password: 'study-only-safe-2026',
    terms: true,
    returnTo: '/community/new?kind=use&task=Lv.137#form',
    ...overrides,
  });
  const resetLimits = () =>
    DB.batch([
      DB.prepare('DELETE FROM registration_rate_limits'),
      DB.prepare('DELETE FROM member_auth_rate_limits'),
    ]);
  const sessionToken = (response: Response) => {
    const token = response.headers
      .get('set-cookie')
      ?.match(/__Host-fujimoto_jitsugaku_session=([^;]+)/)?.[1];
    assert.ok(token, 'real session cookie must be issued');
    return token;
  };
  globalThis.fetch = async () => {
    throw new Error('Username signup must not call external services');
  };
  try {
    assert.equal(api.registrationUsername(' Ｓｏｒａ_01 '), 'sora_01');
    assert.equal(api.registrationUsername('person@example.test'), '');
    for (const name of [
      'admin',
      'aikanri',
      'AiStock',
      'aitock',
      'official',
      'demo',
      'mon-ai',
      'ADMIN_1',
    ])
      assert.ok(
        api.reservedRegistrationUsername(api.registrationUsername(name)),
      );
    for (const path of [
      'https://evil.example',
      '//evil.example',
      '/\\evil.example',
      '/api/auth/logout',
      '/aistock/login',
      '/aistock//evil.example',
      '/aijuku//evil.example',
      '/aistock/%2f%2fevil.example',
      '/aistock/%5cevil.example',
      '/%6aoin',
      '/account/recover',
    ])
      assert.equal(api.registrationReturnTo(path), '/mypage');
    assert.equal(
      api.registrationReturnTo('/messages?to=someone#reply'),
      '/messages?to=someone#reply',
    );
    for (const invalid of [
      { password: 'short' },
      { terms: false },
      { username: 'admin' },
      { username: 'ab' },
      { username: 'demo@demo' },
      { username: 'a b' },
    ])
      assert.equal(
        (await api.register(authRequest('register', signup(invalid)))).status,
        400,
      );
    assert.equal(
      (
        await api.register(
          authRequest(
            'register',
            signup(),
            '192.0.2.80',
            'https://evil.example',
          ),
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await api.register(
          authRequest('register', signup({ extra: 'x'.repeat(6000) })),
        )
      ).status,
      400,
    );
    await resetLimits();
    const registered = await api.register(
      authRequest(
        'register',
        signup({ memberId: 'test-owner', accountKind: 'demo' }),
      ),
    );
    assert.equal(registered.status, 200);
    assert.match(registered.headers.get('cache-control'), /private, no-store/);
    assert.match(
      registered.headers.get('set-cookie'),
      /HttpOnly; SameSite=Lax/,
    );
    const result = await registered.json();
    assert.equal(result.next, signup().returnTo);
    assert.equal(result.username, 'study_sora');
    assert.equal(
      result.recoveryCode,
      undefined,
      'signup goes directly to the requested page, with no recovery step',
    );
    const oldToken = sessionToken(registered);
    const user = await api.resolvePasswordSession(oldToken);
    assert.ok(
      user &&
        user.accountKind === 'member' &&
        user.passwordState === 'personal',
    );
    assert.notEqual(user.memberId, 'test-owner');
    assert.equal(api.passwordAuthEmail(user), '');
    const memberRow = await DB.prepare('SELECT * FROM members WHERE id=?')
      .bind(user.memberId)
      .first();
    assert.equal(memberRow?.email, '');
    assert.equal(memberRow?.display_name, 'メンバー');
    assert.equal(memberRow?.terms_version, api.membershipTermsVersion);
    assert.equal(memberRow?.privacy_version, api.privacyPolicyVersion);
    assert.equal(
      await DB.prepare('SELECT 1 FROM social_profiles WHERE member_id=?')
        .bind(user.memberId)
        .first(),
      null,
    );
    const stored = await DB.prepare(
      'SELECT * FROM member_auth_accounts WHERE member_id=?',
    )
      .bind(user.memberId)
      .first();
    assert.equal(
      stored?.recovery_code_hash,
      null,
      'recovery is opt-in, not generated during signup',
    );
    assert.equal(stored?.recovery_code_created_at, null);
    assert.ok(!JSON.stringify(stored).includes(signup().password));
    assert.equal(stored?.contact_email, null);
    assert.equal(
      await api.hasUsernameRecovery(user.memberId),
      true,
      'a new member can optionally set up recovery later',
    );
    assert.equal(
      (
        await api.recover(
          authRequest('recover', {
            action: 'reset',
            username: result.username,
            code: 'a'.repeat(43),
            password: 'not-a-valid-recovery',
          }),
        )
      ).status,
      400,
    );
    testGlobal.aistockTestUser = {
      userId: user.memberId,
      loginId: result.username,
      email: '',
      authMethod: 'password',
      isDemo: false,
    };
    const firstRecovery = await api.recover(
      authRequest('recover', { action: 'rotate', password: signup().password }),
    );
    assert.equal(
      firstRecovery.status,
      200,
      'optional first issuance must work with a null code hash',
    );
    const recoveryCode = (await firstRecovery.json()).recoveryCode;
    assert.ok(/^[A-Za-z0-9_-]{43}$/.test(recoveryCode));
    const issuedCode = await DB.prepare(
      'SELECT recovery_code_hash FROM member_auth_accounts WHERE member_id=?',
    )
      .bind(user.memberId)
      .first();
    assert.ok(
      issuedCode?.recovery_code_hash &&
        issuedCode.recovery_code_hash !== recoveryCode,
    );
    testGlobal.aistockTestUser = null;
    assert.equal(
      (
        await api.register(
          authRequest('register', signup({ username: 'STUDY_SORA' })),
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await DB.prepare(
          'SELECT password_digest FROM member_auth_accounts WHERE member_id=?',
        )
          .bind(user.memberId)
          .first()
      )?.password_digest,
      stored?.password_digest,
    );
    const memberCount = Number(
      (await DB.prepare('SELECT count(*) n FROM members').first())?.n,
    );
    const signupRace = await Promise.all(
      [1, 2].map(() =>
        api.register(
          authRequest('register', signup({ username: 'study_race' })),
        ),
      ),
    );
    assert.equal(signupRace.filter((r) => r.status === 200).length, 1);
    assert.equal(
      Number((await DB.prepare('SELECT count(*) n FROM members').first())?.n),
      memberCount + 1,
      'duplicate signup leaves no orphan member',
    );
    assert.equal(
      (
        await api.login(
          authRequest('login', {
            loginId: result.username,
            password: 'wrong-password',
          }),
        )
      ).status,
      401,
    );
    const logged = await api.login(
      authRequest('login', {
        loginId: result.username,
        password: signup().password,
        returnTo: '/messages?to=friend',
      }),
    );
    assert.equal(logged.status, 200);
    assert.equal((await logged.clone().json()).next, '/messages?to=friend');
    assert.ok(await api.resolvePasswordSession(sessionToken(logged)));
    const reset = {
      action: 'reset',
      username: result.username,
      code: recoveryCode,
      password: 'new-study-only-2026',
    };
    assert.equal(
      (
        await api.recover(
          authRequest('recover', reset, '192.0.2.80', 'https://evil.example'),
        )
      ).status,
      403,
    );
    const recovered = await api.recover(authRequest('recover', reset));
    assert.equal(recovered.status, 200);
    const recoveredBody = await recovered.json();
    assert.ok(recoveredBody.recoveryCode !== recoveryCode);
    assert.equal(await api.resolvePasswordSession(oldToken), null);
    assert.equal(await api.resolvePasswordSession(sessionToken(logged)), null);
    assert.equal(
      (
        await api.login(
          authRequest('login', {
            loginId: result.username,
            password: signup().password,
          }),
        )
      ).status,
      401,
    );
    const newLogin = await api.login(
      authRequest('login', {
        loginId: result.username,
        password: reset.password,
      }),
    );
    assert.equal(newLogin.status, 200);
    const newToken = sessionToken(newLogin);
    assert.equal(
      (await api.recover(authRequest('recover', reset))).status,
      400,
    );
    assert.ok(
      await api.resolvePasswordSession(newToken),
      'replayed code cannot revoke fresh sessions',
    );
    await resetLimits();
    const resetRace = await Promise.all(
      [1, 2].map(() =>
        api.recover(
          authRequest('recover', {
            ...reset,
            code: recoveredBody.recoveryCode,
          }),
        ),
      ),
    );
    assert.equal(resetRace.filter((r) => r.status === 200).length, 1);
    const raceCode = (await resetRace.find((r) => r.status === 200)!.json())
      .recoveryCode;
    assert.equal(await api.resolvePasswordSession(newToken), null);
    testGlobal.aistockTestUser = {
      userId: user.memberId,
      loginId: result.username,
      email: '',
      authMethod: 'password',
      isDemo: false,
    };
    assert.equal(
      (
        await api.register(
          authRequest('register', signup({ username: 'already_logged' })),
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await api.recover(
          authRequest('recover', { action: 'rotate', password: 'wrong-pass' }),
        )
      ).status,
      400,
    );
    const rotated = await api.recover(
      authRequest('recover', { action: 'rotate', password: reset.password }),
    );
    assert.equal(rotated.status, 200);
    const rotatedBody = await rotated.json();
    assert.ok(rotatedBody.recoveryCode !== raceCode);
    testGlobal.aistockTestUser = null;
    assert.equal(
      (
        await api.recover(
          authRequest('recover', {
            action: 'rotate',
            password: reset.password,
          }),
        )
      ).status,
      401,
    );
    assert.equal(
      (await api.recover(authRequest('recover', { ...reset, code: raceCode })))
        .status,
      400,
    );
    await DB.prepare("UPDATE members SET status='suspended' WHERE id=?")
      .bind(user.memberId)
      .run();
    assert.equal(
      (
        await api.recover(
          authRequest('recover', { ...reset, code: rotatedBody.recoveryCode }),
        )
      ).status,
      400,
    );
    await DB.prepare("UPDATE members SET status='active' WHERE id=?")
      .bind(user.memberId)
      .run();
    await DB.prepare(
      "UPDATE member_auth_accounts SET account_kind='demo' WHERE member_id=?",
    )
      .bind(user.memberId)
      .run();
    assert.equal(
      (
        await api.recover(
          authRequest('recover', { ...reset, code: rotatedBody.recoveryCode }),
        )
      ).status,
      400,
    );
    await DB.prepare(
      "UPDATE member_auth_accounts SET account_kind='member' WHERE member_id=?",
    )
      .bind(user.memberId)
      .run();
    await resetLimits();
    // Force recovery between the password check and its later write.
    // This proxy wraps the isolated D1 only; the SQL and CAS are the real implementation.
    let interleaved = false;
    let latestRecoveryCode = rotatedBody.recoveryCode as string;
    const recoverDuringWrite = async () => {
      interleaved = true;
      const value = await api.recoverUsernamePassword({
        username: result.username,
        code: latestRecoveryCode,
        password: 'recovered-during-write-2026',
      });
      latestRecoveryCode = value.recoveryCode;
    };
    testGlobal.aistockTestEnv.DB = {
      prepare(sql: string) {
        const statement = DB.prepare(sql);
        if (/INSERT INTO member_auth_sessions/.test(sql))
          return {
            bind(...values: unknown[]) {
              const bound = statement.bind(...values);
              return {
                async run() {
                  if (!interleaved) await recoverDuringWrite();
                  return bound.run();
                },
              };
            },
          };
        return statement;
      },
      batch: DB.batch.bind(DB),
    };
    try {
      await assert.rejects(
        api.authenticatePassword({
          loginId: result.username,
          password: reset.password,
          clientAddress: '192.0.2.190',
        }),
      );
      assert.ok(interleaved, 'recovery must run after old-password validation');
    } finally {
      testGlobal.aistockTestEnv.DB = DB;
    }
    assert.equal(
      Number(
        (
          await DB.prepare(
            'SELECT count(*) n FROM member_auth_sessions WHERE account_id=?',
          )
            .bind(user.memberId)
            .first()
        )?.n,
      ),
      0,
      'stale login must not reissue a session after recovery',
    );
    const freshLogin = await api.authenticatePassword({
      loginId: result.username,
      password: 'recovered-during-write-2026',
      clientAddress: '192.0.2.191',
    });
    assert.equal(freshLogin.ok, true);
    interleaved = false;
    testGlobal.aistockTestEnv.DB = {
      prepare: DB.prepare.bind(DB),
      async batch(statements: Parameters<typeof DB.batch>[0]) {
        if (!interleaved) await recoverDuringWrite();
        return DB.batch(statements);
      },
    };
    try {
      const staleChange = await api.changeMemberPassword({
        memberId: user.memberId,
        currentPassword: 'recovered-during-write-2026',
        newPassword: 'stale-change-must-not-win',
      });
      assert.equal(staleChange.ok, false);
      assert.ok(interleaved);
    } finally {
      testGlobal.aistockTestEnv.DB = DB;
    }
    assert.equal(
      await api.resolvePasswordSession(freshLogin.session.token),
      null,
    );
    const stillRecovered = await api.authenticatePassword({
      loginId: result.username,
      password: 'recovered-during-write-2026',
      clientAddress: '192.0.2.192',
    });
    assert.equal(stillRecovered.ok, true);
    // The ordinary password-change flow must still succeed outside a conflict.
    const normalChange = await api.changeMemberPassword({
      memberId: user.memberId,
      currentPassword: 'recovered-during-write-2026',
      newPassword: 'ordinary-change-still-works',
    });
    assert.equal(normalChange.ok, true);
    assert.ok(await api.resolvePasswordSession(normalChange.session.token));
    assert.equal(
      await api.resolvePasswordSession(stillRecovered.session.token),
      null,
    );
    testGlobal.aistockTestUser = {
      userId: 'header-only-new',
      authMethod: 'chatgpt',
      email: 'header-only@example.test',
      isDemo: false,
    };
    assert.equal(
      (
        await api.register(
          authRequest('register', signup({ username: 'header_only_user' })),
        )
      ).status,
      200,
      'a provider header without a local account cannot block signup',
    );
    testGlobal.aistockTestUser = null;
    await resetLimits();
    const unknown = await api.recover(
      authRequest('recover', { ...reset, username: 'does_not_exist' }),
    );
    const wrong = await api.recover(
      authRequest('recover', { ...reset, code: 'a'.repeat(43) }),
    );
    assert.deepEqual(await unknown.json(), await wrong.json());
    for (let i = 0; i < 5; i++)
      assert.equal(
        (
          await api.register(
            authRequest(
              'register',
              signup({ username: 'blocked_name', password: 'short' }),
              '192.0.2.' + (100 + i),
            ),
          )
        ).status,
        400,
      );
    assert.equal(
      (
        await api.register(
          authRequest(
            'register',
            signup({ username: 'blocked_name' }),
            '192.0.2.120',
          ),
        )
      ).status,
      429,
    );
    for (let i = 0; i < 5; i++)
      assert.equal(
        (
          await api.recover(
            authRequest(
              'recover',
              { ...reset, username: 'rate_target' },
              '192.0.2.' + (130 + i),
            ),
          )
        ).status,
        400,
      );
    assert.equal(
      (
        await api.recover(
          authRequest(
            'recover',
            { ...reset, username: 'rate_target' },
            '192.0.2.150',
          ),
        )
      ).status,
      429,
    );
  } finally {
    globalThis.fetch = originalFetch;
    testGlobal.aistockTestUser = null;
  }
  await resetLimits();

  const flow = await api.beginGoogleFlow(null, '/posts/official-web#replies');
  const verifiedFlow = await api.readGoogleFlow(flow.cookie);
  assert.ok(verifiedFlow);
  assert.equal(verifiedFlow.returnTo, '/posts/official-web#replies');
  assert.equal(
    new URL(flow.url).searchParams.get('code_challenge_method'),
    'S256',
  );
  assert.equal(await api.readGoogleFlow(flow.cookie + 'tampered'), null);
  const failedCallback = await api.googleCallback(
    new Request(
      'https://mon-ai.jp/aistock/api/auth/google/callback?state=wrong&code=test',
      { headers: { cookie: api.googleFlowCookie + '=' + flow.cookie } },
    ),
  );
  assert.match(failedCallback.headers.get('location'), /google-failed/);
  assert.match(
    api.googleCallbackUrl(),
    /mon-ai\.jp\/aistock\/api\/auth\/google\/callback$/,
  );

  // Verify Google JWTs with locally signed fixtures, without contacting Google.
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  );
  const jwk = {
    ...(await crypto.subtle.exportKey('jwk', keyPair.publicKey)),
    kid: 'fixture-key',
  };
  let tokenFixture = '';
  globalThis.fetch = async (input) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    if (url === 'https://oauth2.googleapis.com/token')
      return Response.json({ id_token: tokenFixture });
    if (url === 'https://www.googleapis.com/oauth2/v3/certs')
      return Response.json({ keys: [jwk] });
    throw Error('External fetch blocked by JWT test');
  };
  const baseClaim = {
    iss: 'https://accounts.google.com',
    aud: 'test-client',
    sub: 'fixture-subject',
    nonce: verifiedFlow.nonce,
    email: 'learner@gmail.com',
    email_verified: true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 300,
  };
  async function tokenFor(claim: Record<string, unknown>, alg = 'RS256') {
    const head = Buffer.from(
        JSON.stringify({ alg, kid: 'fixture-key' }),
      ).toString('base64url'),
      payload = Buffer.from(JSON.stringify(claim)).toString('base64url');
    const sig = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      keyPair.privateKey,
      new TextEncoder().encode(head + '.' + payload),
    );
    return head + '.' + payload + '.' + Buffer.from(sig).toString('base64url');
  }
  try {
    tokenFixture = await tokenFor(baseClaim);
    assert.equal(
      (await api.verifyGoogleCode('fixture-code', verifiedFlow)).authoritative,
      true,
    );
    for (const change of [
      { nonce: 'wrong' },
      { aud: 'wrong' },
      { iss: 'https://attacker.test' },
      { azp: 'wrong' },
      { exp: 0 },
      { iat: Math.floor(Date.now() / 1000) + 600 },
      { email_verified: false },
      { email_verified: 'true' },
      { sub: '' },
    ]) {
      tokenFixture = await tokenFor({ ...baseClaim, ...change });
      await assert.rejects(api.verifyGoogleCode('fixture-code', verifiedFlow));
    }
    tokenFixture = await tokenFor(baseClaim, 'none');
    await assert.rejects(api.verifyGoogleCode('fixture-code', verifiedFlow));
    tokenFixture = (await tokenFor(baseClaim)).slice(0, -10) + 'AAAAAAAAAA';
    await assert.rejects(api.verifyGoogleCode('fixture-code', verifiedFlow));
    tokenFixture = await tokenFor({
      ...baseClaim,
      email: 'learner@example.test',
    });
    assert.equal(
      (await api.verifyGoogleCode('fixture-code', verifiedFlow)).authoritative,
      false,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  // The real legacy-header resolver also rejects missing / disabled accounts.
  testGlobal.aistockTestHeaders = new Headers({
    'oai-authenticated-user-id': 'test-one',
    'oai-authenticated-user-email': 'test-one@example.test',
  });
  assert.equal(await api.realHeaderUser(), null);
  await DB.prepare(
    'INSERT INTO member_auth_accounts(member_id,login_id,password_digest,password_state,account_kind,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)',
  )
    .bind(
      'test-one',
      'test-one@example.test',
      'unused-digest',
      'personal',
      'member',
      'disabled',
      now,
      now,
    )
    .run();
  assert.equal(await api.realHeaderUser(), null);
  await DB.prepare(
    "UPDATE member_auth_accounts SET status='active' WHERE member_id=?",
  )
    .bind('test-one')
    .run();
  assert.equal((await api.realHeaderUser()).userId, 'test-one');
  testGlobal.aistockTestHeaders = undefined;

  // Notes are private, explicitly shared by a separate post, and import is loss-aware.
  await clearLimit();
  testGlobal.aistockTestUser = null;
  assert.equal((await api.learningGet()).status, 401);
  asUser('test-one', true);
  assert.equal(
    (await api.learningPost(request({ action: 'note' }))).status,
    403,
  );
  asUser('test-one');
  assert.equal(
    (
      await api.learningPost(
        request({ action: 'note' }, 'https://attacker.example'),
      )
    ).status,
    403,
  );
  const noteInput = {
    action: 'note',
    body: '自分だけの記録',
    tool: 'ChatGPT',
    outcome: 'learned',
    humanFix: '条件を足した',
    taskId: 'Lv.05',
    sourceRef: 'official-email',
    requestId: crypto.randomUUID(),
  };
  const noteResponse = await api.learningPost(request(noteInput));
  assert.equal(noteResponse.status, 200);
  const noteId = (await noteResponse.json()).id;
  assert.ok(await api.getLearningNote('test-one', noteId));
  assert.equal(await api.getLearningNote('test-two', noteId), null);
  assert.equal(
    (await api.listCommunityPosts(undefined, 1, undefined, '自分だけの記録'))
      .posts.length,
    0,
  );
  assert.equal(
    (await api.learningPost(request({ ...noteInput, body: '直した内容' })))
      .status,
    409,
  );
  assert.equal(api.parseNote({ ...noteInput, outcome: ['worked'] }), null);
  asUser('test-two');
  assert.equal(
    (await api.learningPost(request({ action: 'delete', id: noteId }))).status,
    404,
  );
  asUser('test-one');
  assert.equal(
    (await api.learningPost(request({ action: 'delete', id: noteId }))).status,
    200,
  );
  assert.equal(await api.getLearningNote('test-one', noteId), null);
  const record = {
    id: 'local-test-record',
    body: '以前の記録',
    tool: 'ChatGPT',
    outcome: 'adjusted',
    humanFix: '数字を確認',
    topic: '仕事',
    sourcePostId: 'demo-post-2',
    createdAt: '2026-09-01T02:00:00.000Z',
    testedOn: '2026-08-31',
  };
  const imported = api.parseAitockImport({ version: 1, records: [record] });
  assert.ok(imported);
  assert.equal(imported[0].sourceRef, 'aitock:demo-post-2');
  assert.deepEqual(await api.importLearningNotes('test-one', imported), {
    imported: 1,
    changed: 0,
    skipped: 0,
  });
  assert.deepEqual(await api.importLearningNotes('test-one', imported), {
    imported: 0,
    changed: 0,
    skipped: 1,
  });
  assert.deepEqual(
    await api.importLearningNotes('test-one', [
      { ...imported[0], body: 'あとから直した' },
    ]),
    { imported: 0, changed: 1, skipped: 0 },
  );
  const migrated = (await api.listLearningNotes('test-one')).notes[0];
  const updatedNote = {
    body: '直した記録',
    tool: migrated.tool,
    outcome: migrated.outcome,
    humanFix: migrated.humanFix,
  };
  const expected = [
    migrated.body,
    migrated.tool,
    migrated.outcome,
    migrated.humanFix,
  ];
  assert.equal(
    await api.editLearningNote('test-two', migrated.id, updatedNote, expected),
    false,
  );
  assert.equal(
    await api.editLearningNote('test-one', migrated.id, updatedNote, expected),
    true,
  );
  assert.equal(
    await api.editLearningNote('test-one', migrated.id, updatedNote, expected),
    true,
    'retry after response loss is idempotent',
  );
  assert.equal(
    await api.editLearningNote(
      'test-one',
      migrated.id,
      { ...updatedNote, body: '古い画面の編集' },
      expected,
    ),
    false,
  );
  assert.equal(
    (await api.getLearningNote('test-one', migrated.id)).testedOn,
    migrated.testedOn,
  );
  assert.equal(migrated.testedOn, '2026-08-31');
  assert.equal(migrated.topic, '仕事');
  await api.removeLearningNote('test-one', migrated.id);
  assert.deepEqual(await api.importLearningNotes('test-one', imported), {
    imported: 0,
    changed: 0,
    skipped: 1,
  });
  assert.equal((await api.listLearningNotes('test-one')).notes.length, 0);
  assert.equal(
    api.parseAitockImport({
      version: 1,
      records: [{ ...record, testedOn: '2026-02-30' }],
    }),
    null,
  );
  assert.equal(
    api.parseAitockImport({ version: 1, records: [record, record] }),
    null,
  );
  await clearLimit();
  assert.equal(
    (
      await api.learningPost(
        request({ action: 'stock', ref: 'official-email', saved: true }),
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await api.learningPost(
        request({ action: 'stock', ref: 'not-real', saved: true }),
      )
    ).status,
    404,
  );
  assert.equal((await api.listPostStocks('test-one')).length, 1);
  assert.equal((await api.listPostStocks('test-two')).length, 0);
  assert.equal(
    (
      await api.learningPost(
        request({ action: 'stock', ref: 'official-email', saved: false }),
      )
    ).status,
    200,
  );
  assert.equal((await api.listPostStocks('test-one')).length, 0);

  // Accept a bounded RGBA PNG, strip ancillary metadata, and restrict image reads.
  function crc(bytes: Uint8Array) {
    let n = 0xffffffff;
    for (const b of bytes) {
      n ^= b;
      for (let i = 0; i < 8; i++) n = n & 1 ? (n >>> 1) ^ 0xedb88320 : n >>> 1;
    }
    return (n ^ 0xffffffff) >>> 0;
  }
  function chunk(type: string, data: Buffer) {
    const output = Buffer.alloc(data.length + 12);
    output.writeUInt32BE(data.length);
    output.write(type, 4);
    data.copy(output, 8);
    output.writeUInt32BE(crc(output.subarray(4, -4)), output.length - 4);
    return output;
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1);
  ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('tEXt', Buffer.from('location\0private-place')),
    chunk('IDAT', deflateSync(Buffer.from([0, 120, 180, 80, 255]))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  const clean = await api.cleanPostPng(png);
  assert.equal(clean.width, 1);
  assert.equal(
    Buffer.from(clean.bytes).includes(Buffer.from('private-place')),
    false,
  );
  const broken = Buffer.from(png);
  broken[30] ^= 1;
  await assert.rejects(api.cleanPostPng(broken));
  await assert.rejects(api.cleanPostPng(Buffer.from('<svg/>')));
  const media = await api.storeCommunityMedia('test-one', clean);
  assert.ok(await api.readCommunityMedia(media.id, 'test-one'));
  assert.equal(await api.readCommunityMedia(media.id, 'test-two'), null);
  assert.equal(await api.readCommunityMedia(media.id), null);
  assert.equal(
    await api.writeCommunityPost({
      authorId: 'test-two',
      authorName: '別の人',
      authorRole: 'member',
      requestId: crypto.randomUUID(),
      kind: 'tip',
      title: '画像',
      body: '他人の画像',
      taskId: null,
      mediaId: media.id,
    }),
    null,
  );
  const imagePost = await api.writeCommunityPost({
    authorId: 'test-one',
    authorName: '学ぶひと',
    authorRole: 'member',
    requestId: crypto.randomUUID(),
    kind: 'tip',
    title: '画像を試した',
    body: '自分の画像',
    taskId: null,
    mediaId: media.id,
  });
  assert.ok(imagePost);
  assert.ok(await api.readCommunityMedia(media.id));
  await api.removeCommunityItem({
    kind: 'post',
    id: imagePost.id,
    memberId: 'test-one',
    isOwner: false,
  });
  assert.equal(await api.readCommunityMedia(media.id), null);
  assert.ok(await api.readCommunityMedia(media.id, 'test-one'));

  // Social features: all state lives in disposable D1, never a live account.
  await clearLimit();
  testGlobal.aistockTestUser = null;
  assert.equal(
    (
      await api.socialPost(
        request({ action: 'like', ref: 'official-email', liked: true }),
      )
    ).status,
    401,
  );
  asUser('test-one', true);
  assert.equal(
    (await api.socialPost(request({ action: 'profile' }))).status,
    403,
  );
  asUser('test-old');
  assert.equal(
    (await api.socialPost(request({ action: 'profile' }))).status,
    403,
  );
  asUser('test-one');
  assert.equal(
    (
      await api.socialPost(
        request({ action: 'like' }, 'https://attacker.example'),
      )
    ).status,
    403,
  );
  const profileInput = {
    action: 'profile',
    name: 'ふたば',
    bio: 'メールを学んでいます。',
    isPublic: true,
    dmEnabled: true,
    publicConsent: true,
  };
  assert.equal(
    (await api.socialPost(request({ ...profileInput, publicConsent: false })))
      .status,
    400,
  );
  assert.equal(
    (await api.socialPost(request({ ...profileInput, name: 'Aitock公式' })))
      .status,
    400,
  );
  const p1response = await api.socialPost(
    request({ ...profileInput, memberId: 'test-two', kind: 'official_ai' }),
  );
  assert.equal(p1response.status, 200);
  const p1 = (await p1response.json()).profile;
  assert.equal(p1.kind, 'member');
  assert.equal(
    await api.ownSocialProfile('test-two'),
    null,
    'Cannot write someone else’s profile',
  );
  const p2 = await api.saveSocialProfile('test-two', {
    name: 'みつば',
    bio: '旅行が好き',
    isPublic: true,
    dmEnabled: true,
  });
  const p3 = await api.saveSocialProfile('test-owner', {
    name: '運営の個人ページ',
    bio: '',
    isPublic: true,
    dmEnabled: false,
  });
  assert(p2 && p3);
  assert.equal(
    (await api.socialCounts(p1.handle)).posts,
    0,
    'Old pseudonymous posts must not be automatically linked',
  );
  const publicDto = await api.publicSocialProfile(p1.handle);
  for (const field of ['memberId', 'member_id', 'email', 'loginId'])
    assert.equal(field in publicDto, false);
  assert(await api.setFollow('test-one', p2.handle, true));
  assert(await api.setFollow('test-one', p2.handle, true));
  assert.equal(
    (await api.socialCounts(p2.handle)).followers,
    1,
    'Repeated follow is idempotent',
  );
  assert.equal(
    (await api.followList(p2.handle, 'followers')).profiles[0].handle,
    p1.handle,
  );
  assert.equal(await api.setFollow('test-one', p1.handle, true), false);
  const accountsBefore = await DB.prepare(
    'SELECT count(*) AS n FROM member_auth_accounts',
  ).first<{ n: number }>();
  assert(launchSeedSql, 'Launch data migration must be covered by this check');
  const humansBeforeSeed = await DB.prepare(
    "SELECT * FROM members WHERE id != 'aistock-system-editorial' ORDER BY id",
  ).all();
  const applyLaunchSeed = async () => {
    for (const statement of launchSeedSql.split('--> statement-breakpoint'))
      if (statement.trim()) await DB.prepare(statement.trim()).run();
  };
  await applyLaunchSeed();
  await applyLaunchSeed();
  assert.deepEqual(
    (
      await DB.prepare(
        "SELECT * FROM members WHERE id != 'aistock-system-editorial' ORDER BY id",
      ).all()
    ).results,
    humansBeforeSeed.results,
    'Launch migration never changes human identities, status or consent',
  );
  assert.equal(
    (
      await DB.prepare(
        "SELECT terms_accepted_at FROM members WHERE id='aistock-system-editorial'",
      ).first()
    )?.terms_accepted_at,
    0,
    'Editorial data is not a human terms acceptance',
  );
  assert.equal(
    (
      await DB.prepare(
        "SELECT count(*) n FROM social_profiles WHERE kind IN ('official','official_ai') AND member_id IS NOT NULL",
      ).first()
    )?.n,
    0,
    'Seeded public characters must not be login members',
  );
  await api.seedOfficialCommunity();
  await api.seedOfficialCommunity();
  assert.equal(
    (
      await DB.prepare(
        "SELECT count(*) AS n FROM social_profiles WHERE kind='official_ai'",
      ).first<{ n: number }>()
    )?.n,
    10,
  );
  assert.equal(
    (
      await DB.prepare(
        "SELECT count(*) AS n FROM community_posts WHERE id LIKE 'example-%'",
      ).first<{ n: number }>()
    )?.n,
    20,
  );
  assert.equal(
    (
      await DB.prepare('SELECT count(*) AS n FROM member_auth_accounts').first<{
        n: number;
      }>()
    )?.n,
    accountsBefore?.n,
    'Official AI has no sign-in account',
  );
  assert.equal(
    (
      await DB.prepare(
        "SELECT count(*) AS n FROM community_posts WHERE profile_handle='aitock' AND id LIKE 'official-%'",
      ).first<{ n: number }>()
    )?.n,
    6,
  );
  assert.equal(
    (await api.socialCounts('aitock')).posts,
    7,
    'Includes the real owner post already made in this test',
  );
  const sample = await api.getCommunityPost('example-madoka-1');
  assert.equal(sample.profileKind, 'official_ai');
  assert.equal(sample.exampleDate, '2026-08-20');
  assert(await api.setFollow('test-one', 'aitock', true));
  const followingFeed = await api.listCommunityPosts(
    undefined,
    1,
    undefined,
    '',
    { following: p1.handle },
  );
  assert(
    followingFeed.posts.some((p: { id: string }) => p.id === 'official-email'),
    'Following official includes guides',
  );
  assert(
    sample.createdAt > Date.parse('2026-08-20'),
    'Real creation timestamp must not be backdated',
  );
  assert(
    (await api.listCommunityPosts()).posts.every(
      (p: { id: string }) => !p.id.startsWith('official-'),
    ),
    'No duplicate static guides in member feed',
  );
  const demoOnly = await api.listCommunityPosts(undefined, 1, undefined, '', {
    source: 'ai',
  });
  assert.equal(demoOnly.posts.length, 20);
  asUser('aistock-system-editorial');
  assert.equal(
    (
      await api.socialPost(
        request({ action: 'like', ref: 'official-email', liked: true }),
      )
    ).status,
    403,
  );
  assert.equal((await api.communityPost(request(post()))).status, 403);
  asUser('test-one');
  await clearLimit();
  const withProfile = await api.communityPost(
    request(
      post({ nickname: '別の名前', title: 'プロフィールからの新しい投稿' }),
    ),
  );
  assert.equal(withProfile.status, 200);
  const profilePostId = (await withProfile.json()).next.split('/').at(-1);
  const profilePost = await api.getCommunityPost(profilePostId);
  assert.equal(profilePost.profileHandle, p1.handle);
  assert.equal(profilePost.authorName, p1.name);
  assert.equal((await api.socialCounts(p1.handle)).posts, 1);
  for (let i = 0; i < 2; i++)
    assert.equal(
      (
        await api.socialPost(
          request({ action: 'like', ref: 'official-email', liked: true }),
        )
      ).status,
      200,
    );
  assert.deepEqual(
    (await api.postLikeStates(['official-email'], 'test-one'))[
      'official-email'
    ],
    { count: 1, liked: true },
  );
  assert.equal(await api.setLike('test-one', 'not-a-real-post', true), false);
  assert.equal(await api.setLike('test-one', 'official-email', false), true);
  assert.equal(
    (await api.postLikeStates(['official-email'], 'test-one'))['official-email']
      .count,
    0,
  );
  const message = {
    target: p2.handle,
    body: 'こんにちは。メールの練習について聞いてもいいですか？',
    requestId: crypto.randomUUID(),
  };
  const thread = await api.sendDirectMessage('test-one', message);
  assert(thread);
  assert.equal(
    await api.sendDirectMessage('test-one', message),
    thread,
    'Message retry is idempotent',
  );
  assert.equal(
    await api.sendDirectMessage('test-one', { ...message, body: 'Changed' }),
    null,
  );
  assert.equal(
    await api.sendDirectMessage('test-one', {
      ...message,
      requestId: crypto.randomUUID(),
    }),
    null,
    'Only one pending request',
  );
  assert.equal(
    await api.memberThread('test-owner', thread),
    null,
    'Owner cannot read others’ DMs',
  );
  assert.equal(await api.threadMessages('test-owner', thread), null);
  assert.equal(await api.acceptThread('test-one', thread), false);
  assert(await api.acceptThread('test-two', thread));
  assert.equal(
    await api.sendDirectMessage('test-two', {
      target: p1.handle,
      body: 'どうぞ！',
      requestId: crypto.randomUUID(),
    }),
    thread,
  );
  const conversation = await api.threadMessages('test-one', thread);
  assert.equal((await api.listThreads('test-one')).length, 1);
  assert.equal((await api.listThreads('test-owner')).length, 0);
  assert.equal(conversation.messages.length, 2);
  const firstMessage = conversation.messages.find(
    (m: { sender: string }) => m.sender === p1.handle,
  );
  assert.equal(
    await api.reportSocial(
      'test-owner',
      'message',
      firstMessage.id,
      '他人の会話',
    ),
    false,
  );
  assert.equal(
    await api.sendDirectMessage('test-one', { ...message, target: 'madoka' }),
    null,
    'AI characters cannot receive DMs',
  );
  assert(await api.setBlock('test-two', p1.handle, true));
  assert.equal((await api.socialCounts(p2.handle)).followers, 0);
  assert.equal(await api.setFollow('test-one', p2.handle, true), false);
  assert.equal(
    await api.sendDirectMessage('test-one', {
      ...message,
      requestId: crypto.randomUUID(),
    }),
    null,
  );
  assert.equal(await api.setLike('test-two', profilePostId, true), false);
  assert.equal(
    (await api.threadMessages('test-two', thread)).messages.length,
    2,
    'Blocking preserves evidence access',
  );
  assert(
    await api.reportSocial(
      'test-two',
      'message',
      firstMessage.id,
      '迷惑な内容です',
    ),
  );
  await api.saveSocialProfile('test-one', {
    name: p1.name,
    bio: 'private-bio-sentinel',
    isPublic: false,
    dmEnabled: false,
  });
  assert.equal(await api.publicSocialProfile(p1.handle), null);
  assert.equal((await api.getCommunityPost(profilePostId)).profileHandle, null);
  assert.equal(
    await api.setLike('test-two', profilePostId, true),
    false,
    'Hidden profile cannot bypass block',
  );
  const oldAnon = await api.writeCommunityPost({
    authorId: 'test-one',
    authorName: '過去の別名',
    authorRole: 'member',
    kind: 'tip',
    title: '匿名の投稿例',
    body: '内容',
    taskId: null,
    requestId: crypto.randomUUID(),
  });
  assert.equal(
    await api.canInteractWithPost('test-two', oldAnon.id),
    false,
    'Old pseudonymous posts retain private block protection',
  );
  asUser('test-two');
  await clearLimit();
  assert.equal(
    (
      await api.communityPost(
        request(post({ action: 'reply', postId: oldAnon.id })),
      )
    ).status,
    403,
  );
  assert.equal(
    (await api.memberThread('test-two', thread)).other.bio,
    '',
    'Hidden biography is not exposed through DMs',
  );
  assert(
    await api.reportSocial(
      'test-two',
      'message',
      firstMessage.id,
      '非公開後の確認',
    ),
  );
  asUser('test-one');
  await clearLimit();
  assert.equal(
    (await api.socialAdminPost(request({ action: 'seed' }))).status,
    403,
  );
  asUser('test-owner');
  await clearLimit();
  const job = {
    action: 'queue',
    handle: 'madoka',
    title: '確認した投稿',
    body: 'AIキャラクターの編集済み学習ヒント。',
    taskId: 'Lv.05',
    publishAfter: Date.now() - 1,
    requestId: crypto.randomUUID(),
    approved: true,
  };
  assert.equal(
    (await api.socialAdminPost(request({ ...job, approved: false }))).status,
    400,
  );
  assert.equal((await api.socialAdminPost(request(job))).status, 200);
  assert.equal(await api.publishDueOfficialPosts(), 1);
  assert.equal(await api.publishDueOfficialPosts(), 0);
  assert.equal(
    (await api.getCommunityPost(job.requestId)).profileHandle,
    'madoka',
  );
  await api.removeCommunityItem({
    kind: 'post',
    id: 'example-madoka-1',
    memberId: 'test-owner',
    isOwner: true,
  });
  await applyLaunchSeed();
  await api.seedOfficialCommunity();
  assert.equal(
    await api.getCommunityPost('example-madoka-1'),
    null,
    'Re-seeding never restores deleted examples',
  );
  const reportRows = await api.listSocialReports();
  assert(reportRows.length >= 1);
  await api.resolveSocialReport(reportRows[0].id, 'test-owner');
  assert(
    !(await api.listSocialReports()).some(
      (r: { id: string }) => r.id === reportRows[0].id,
    ),
  );
  console.log(
    'Social checks passed: explicit public identity, real follows/likes, private DM/requests/block/report, official AI seeds and reviewed queue.',
  );

  // No charge or booking request may reach Stripe, Calendar, or even the DB.
  testGlobal.aistockTestEnv.DB = undefined;
  globalThis.fetch = async () => {
    throw new Error('Unexpected network request in free-service guard');
  };
  for (const key of [
    'checkout',
    'portal',
    'application',
    'applicationPatch',
    'adminApplication',
    'calendarConnect',
    'calendarCallback',
  ])
    assert.equal((await api[key](request({}))).status, 410, key);
  console.log(
    'AIstock checks passed: isolated D1/R2; posts/replies and retry safety; private notes/edit/import/stocks; PNG metadata and image access; username signup/login/recovery and stale-credential races; verified tickets and Google JWT; disabled paid endpoints.',
  );
} finally {
  globalThis.fetch = originalFetch;
  await mf.dispose();
}
