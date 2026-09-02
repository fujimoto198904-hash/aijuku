import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  hashPassword,
  initialPasswordFromBirthDate,
  isValidInitialPassword,
  normalizeLoginId,
  passwordIterations,
  validatePersonalPassword,
  verifiedIdentityCanClaimTemporaryAccount,
  verifiedIdentityMatchesTemporaryAccount,
  verifyPassword,
} from '../lib/password-security';

const pepper = 'local-auth-check-only-not-a-deployment-secret';
const password = 'A safe passphrase 2026!';

assert.equal(
  passwordIterations,
  100_000,
  'Sites Workers support PBKDF2 iteration counts up to 100,000',
);

const firstDigest = await hashPassword(password, pepper);
const secondDigest = await hashPassword(password, pepper);
assert.notEqual(firstDigest, secondDigest, 'password salts must be unique');
assert.equal(
  await verifyPassword({ password, pepper, storedDigest: firstDigest }),
  true,
  'correct password must verify',
);
assert.equal(
  await verifyPassword({
    password: 'A wrong passphrase 2026!',
    pepper,
    storedDigest: firstDigest,
  }),
  false,
  'wrong password must not verify',
);
assert.equal(
  await verifyPassword({
    password,
    pepper: `${pepper}-wrong`,
    storedDigest: firstDigest,
  }),
  false,
  'a different pepper must not verify',
);

assert.equal(normalizeLoginId('  LEARNER@EXAMPLE.COM '), 'learner@example.com');
assert.equal(initialPasswordFromBirthDate('2000-02-29'), '20000229');
assert.equal(initialPasswordFromBirthDate('2001-02-29'), null);
assert.equal(
  isValidInitialPassword({ accountKind: 'member', password: '20000229' }),
  true,
);
assert.equal(
  isValidInitialPassword({ accountKind: 'member', password: 'temporary' }),
  false,
);
assert.equal(
  isValidInitialPassword({ accountKind: 'demo', password: 'temporary' }),
  true,
);
assert.equal(
  verifiedIdentityMatchesTemporaryAccount({
    identity: { userId: 'chatgpt-user', email: 'LEARNER@example.com' },
    loginId: 'learner@example.com',
    contactEmail: 'learner@example.com',
  }),
  true,
);
assert.equal(
  verifiedIdentityMatchesTemporaryAccount({
    identity: { userId: 'chatgpt-user', email: 'other@example.com' },
    loginId: 'learner@example.com',
    contactEmail: 'learner@example.com',
  }),
  false,
);
assert.equal(
  verifiedIdentityCanClaimTemporaryAccount({
    identity: { userId: 'owner-chatgpt-id', email: 'owner@example.com' },
    loginId: 'school-owner@example.com',
    contactEmail: 'school-owner@example.com',
    configuredOwnerLoginId: 'school-owner@example.com',
    identityIsOwner: true,
  }),
  true,
  'a configured owner may verify a separate school login ID',
);
assert.equal(
  verifiedIdentityCanClaimTemporaryAccount({
    identity: { userId: 'teacher-chatgpt-id', email: 'teacher@example.com' },
    loginId: 'school-owner@example.com',
    contactEmail: 'school-owner@example.com',
    configuredOwnerLoginId: 'school-owner@example.com',
    identityIsOwner: false,
  }),
  false,
  'a non-owner may not claim the configured owner login ID',
);
assert.equal(
  verifiedIdentityMatchesTemporaryAccount({
    identity: null,
    loginId: 'learner@example.com',
    contactEmail: 'learner@example.com',
  }),
  false,
);
assert.match(
  validatePersonalPassword({
    password: '20000229',
    loginId: 'learner@example.com',
  }) ?? '',
  /誕生日8桁/,
);
assert.equal(
  validatePersonalPassword({
    password,
    loginId: 'learner@example.com',
  }),
  null,
);

const authSourcePaths = [
  'db/member-auth.ts',
  'lib/password-security.ts',
  'app/api/auth/bootstrap/route.ts',
  'app/api/auth/login/route.ts',
];
for (const sourcePath of authSourcePaths) {
  const source = await readFile(sourcePath, 'utf8');
  assert.doesNotMatch(
    source,
    /initialPassword\s*:\s*["']\d{8}["']/,
    `${sourcePath} must not contain a plaintext bootstrap password`,
  );
}

const memberAuthSource = await readFile('db/member-auth.ts', 'utf8');
assert.match(
  memberAuthSource,
  /ON CONFLICT\(key_hash\) DO UPDATE SET[\s\S]+RETURNING/,
  'rate limiting must update and return its result in one atomic D1 statement',
);
assert.match(
  memberAuthSource,
  /identityCanClaimTemporaryAccount/,
  'temporary member sessions must require a matching identity or configured owner',
);
assert.match(
  memberAuthSource,
  /DELETE FROM member_auth_rate_limits[\s\S]+updated_at < \?[\s\S]+LIMIT 250/,
  'expired rate limit records must be cleaned up opportunistically',
);
assert.match(
  memberAuthSource,
  /resolveVerifiedMemberAuthAccount[\s\S]+accountKind === 'member'[\s\S]+passwordState === 'temporary'[\s\S]+verifyPassword/,
  'bootstrap account claims must require a temporary member account and its initial password',
);
assert.match(
  memberAuthSource,
  /UPDATE member_auth_accounts[\s\S]+NOT EXISTS \([\s\S]+FROM members WHERE id = \?[\s\S]+NOT EXISTS \([\s\S]+FROM member_auth_sessions WHERE account_id = \?/,
  'bootstrap account claims must reject rows with an existing member or session',
);
assert.match(
  memberAuthSource,
  /authenticatePassword[\s\S]+const resolution = await resolveVerifiedMemberAuthAccount[\s\S]+return \{ ok: true, session: await issueSession/,
  'a fresh bootstrap account must be claimed for the verified ChatGPT id before its first session is issued',
);
assert.match(
  memberAuthSource,
  /resolveVerifiedMemberAuthAccount[\s\S]+candidateLoginId[\s\S]+loginId: account\.loginId/,
  'the configured owner login ID must be used to find its bootstrap account',
);

const loginRouteSource = await readFile('app/api/auth/login/route.ts', 'utf8');
assert.match(
  loginRouteSource,
  /readChatGPTIdentityHeaders\(request\.headers\)/,
);
assert.match(loginRouteSource, /verificationRequired/);

const membershipRouteSource = await readFile(
  'app/api/membership/route.ts',
  'utf8',
);
assert.match(
  membershipRouteSource,
  /const accountResolution = await resolveVerifiedMemberAuthAccount[\s\S]+await registerMember\(\{ user, displayName \}\)/,
  'a verified bootstrap collision must be resolved before a member row is written',
);

const mypageSource = await readFile('app/mypage/page.tsx', 'utf8');
assert.match(
  mypageSource,
  /getMemberAuthAccount\(user\.userId\)[\s\S]+!authAccount/,
  'mypage must send members without a password account back to onboarding',
);

const loginPageSource = await readFile('app/login/page.tsx', 'utf8');
assert.match(
  loginPageSource,
  /isPasswordManagementReturn[\s\S]+searchParams\.get\('mode'\) === 'manage'/,
  'password-management login recovery must preserve its return path',
);

const demoProtectedRoutes = [
  'app/api/membership/route.ts',
  'app/api/applications/route.ts',
  'app/api/lesson-progress/route.ts',
  'app/api/skills/evidence/route.ts',
  'app/api/skills/external-reviews/route.ts',
  'app/api/skills/profile/route.ts',
  'app/api/skills/review-requests/route.ts',
  'app/api/admin/applications/route.ts',
  'app/api/admin/skills/route.ts',
];
for (const sourcePath of demoProtectedRoutes) {
  const source = await readFile(sourcePath, 'utf8');
  assert.match(
    source,
    /rejectDemoWrite/,
    `${sourcePath} must reject demo writes on the server`,
  );
}

console.log('認証セキュリティ検査: OK');
