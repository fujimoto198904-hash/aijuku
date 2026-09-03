import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
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
import { authenticatedStaffPermissions } from '../lib/staff-permission-policy';
import { isSameOriginRequest } from '../lib/request-security';

assert.equal(
  isSameOriginRequest(
    new Request('https://mon-ai.jp/aijuku/api/auth/login', {
      headers: {
        origin: 'https://mon-ai.jp',
        'sec-fetch-site': 'same-origin',
      },
    }),
  ),
  true,
  'a direct same-origin request must be accepted',
);
assert.equal(
  isSameOriginRequest(
    new Request(
      'https://toyota-ai-school.mondism.chatgpt.site/api/auth/login',
      {
        headers: {
          origin: 'https://mon-ai.jp',
          'sec-fetch-site': 'same-origin',
        },
      },
    ),
  ),
  true,
  'the branded public origin must be accepted through the Sites reverse proxy',
);
assert.equal(
  isSameOriginRequest(
    new Request(
      'https://toyota-ai-school.mondism.chatgpt.site/api/auth/login',
      {
        headers: {
          origin: 'https://attacker.example',
          'sec-fetch-site': 'same-origin',
        },
      },
    ),
  ),
  false,
  'an unrelated browser origin must be rejected',
);
assert.equal(
  isSameOriginRequest(
    new Request(
      'https://toyota-ai-school.mondism.chatgpt.site/api/auth/login',
      {
        headers: {
          origin: 'https://mon-ai.jp',
          'sec-fetch-site': 'cross-site',
        },
      },
    ),
  ),
  false,
  'a cross-site browser request must be rejected',
);

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
assert.match(
  validatePersonalPassword({
    password: 'Abc123!',
    loginId: 'learner@example.com',
  }) ?? '',
  /8文字以上/,
);
assert.equal(
  validatePersonalPassword({
    password: 'Abc123!x',
    loginId: 'learner@example.com',
  }),
  null,
);
assert.match(
  validatePersonalPassword({
    password: '        ',
    loginId: 'learner@example.com',
  }) ?? '',
  /空白以外/,
);

const ownerConfiguration = {
  adminEmails: 'owner@example.com',
  instructorEmails: 'teacher@example.com',
  ownerLoginId: 'aikanri',
  ownerMemberId: 'owner-member-id',
};
assert.equal(
  authenticatedStaffPermissions(
    {
      userId: 'owner-member-id',
      authMethod: 'password',
      email: 'owner@example.com',
      loginId: 'aikanri',
      isDemo: false,
    },
    ownerConfiguration,
  ).isOwner,
  true,
  'the bound password account must receive owner access',
);
for (const nonOwner of [
  {
    userId: 'another-member-id',
    authMethod: 'password' as const,
    email: 'owner@example.com',
    loginId: 'aikanri',
    isDemo: false,
  },
  {
    userId: 'owner-member-id',
    authMethod: 'password' as const,
    email: 'owner@example.com',
    loginId: 'old-login',
    isDemo: false,
  },
  {
    userId: 'owner-member-id',
    authMethod: 'password' as const,
    email: 'owner@example.com',
    loginId: 'aikanri',
    isDemo: true,
  },
]) {
  assert.deepEqual(
    authenticatedStaffPermissions(nonOwner, ownerConfiguration),
    {
      isOwner: false,
      canManageApplications: false,
      canReviewEvidence: false,
    },
    'password access must fail closed unless member ID, login ID and non-demo state all match',
  );
}
assert.deepEqual(
  authenticatedStaffPermissions(
    {
      userId: 'teacher-member-id',
      authMethod: 'password',
      email: 'teacher@example.com',
      loginId: 'teacher-login',
      isDemo: false,
    },
    ownerConfiguration,
  ),
  {
    isOwner: false,
    canManageApplications: false,
    canReviewEvidence: true,
  },
  'a verified instructor account may review evidence without owner access',
);
assert.deepEqual(
  authenticatedStaffPermissions(
    {
      userId: 'chatgpt-owner',
      authMethod: 'chatgpt',
      email: 'owner@example.com',
      loginId: 'unrelated-login',
      isDemo: false,
    },
    ownerConfiguration,
  ),
  {
    isOwner: true,
    canManageApplications: true,
    canReviewEvidence: true,
  },
  'ChatGPT owner access must continue to use the verified ADMIN_EMAILS identity',
);
assert.deepEqual(
  authenticatedStaffPermissions(
    {
      userId: 'demo-id',
      authMethod: 'chatgpt',
      email: 'owner@example.com',
      loginId: 'aikanri',
      isDemo: true,
    },
    ownerConfiguration,
  ),
  {
    isOwner: false,
    canManageApplications: false,
    canReviewEvidence: false,
  },
  'a demo account must never receive staff access',
);

const ownerLoginMigration = await readFile(
  'drizzle/0009_aikanri_owner_login.sql',
  'utf8',
);
function migratedLoginId(seedSql: string, memberId: string): string {
  const schema = `
    CREATE TABLE member_auth_accounts (
      member_id TEXT PRIMARY KEY,
      login_id TEXT NOT NULL UNIQUE,
      password_state TEXT NOT NULL,
      account_kind TEXT NOT NULL,
      status TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `;
  return execFileSync('sqlite3', ['-batch', ':memory:'], {
    encoding: 'utf8',
    input: `${schema}\n${seedSql}\n${ownerLoginMigration}\nSELECT login_id FROM member_auth_accounts WHERE member_id = '${memberId}';`,
  }).trim();
}
const demoSeed =
  "INSERT INTO member_auth_accounts VALUES ('demo-id', 'demo-login', 'personal', 'demo', 'active', 1);";
assert.equal(
  migratedLoginId(
    `${demoSeed}\nINSERT INTO member_auth_accounts VALUES ('owner-id', 'owner-login', 'personal', 'member', 'active', 1);`,
    'owner-id',
  ),
  'aikanri',
  'the exact two-account initial production shape must receive the requested login ID',
);
assert.equal(
  migratedLoginId(
    `${demoSeed}\nINSERT INTO member_auth_accounts VALUES ('first-id', 'first-login', 'personal', 'member', 'active', 1);\nINSERT INTO member_auth_accounts VALUES ('second-id', 'second-login', 'personal', 'member', 'active', 1);`,
    'first-id',
  ),
  'first-login',
  'multiple active members must make the data migration a no-op',
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

const staffPermissionSource = await readFile(
  'lib/staff-permission-policy.ts',
  'utf8',
);
assert.match(
  staffPermissionSource,
  /user\.isDemo[\s\S]+authMethod === 'chatgpt'[\s\S]+user\.userId[\s\S]+ownerMemberId[\s\S]+user\.loginId[\s\S]+ownerLoginId/,
  'password-authenticated owner access must bind the immutable member ID, login ID and non-demo state',
);

for (const adminSourcePath of [
  'app/admin/page.tsx',
  'app/api/admin/applications/route.ts',
  'app/api/admin/skills/route.ts',
]) {
  const adminSource = await readFile(adminSourcePath, 'utf8');
  assert.match(
    adminSource,
    /getAuthenticatedStaffPermissions\(user\)/,
    `${adminSourcePath} must authorize the password-authenticated owner`,
  );
}

const myPageSource = await readFile('app/mypage/page.tsx', 'utf8');
assert.match(
  myPageSource,
  /getAuthenticatedStaffPermissions\(user\)\.isOwner\) redirect\('\/aikanri'\)/,
  'the owner account must use the management home instead of the member page',
);

const ownerEntrySource = await readFile('app/aikanri/page.tsx', 'utf8');
assert.match(
  ownerEntrySource,
  /isVercelRuntime\(\)[\s\S]+canonicalMemberUrl\('\/aikanri'\)[\s\S]+redirect\('\/admin'\)/,
  'the owner entry must hand Vercel traffic to Sites before opening the protected admin page',
);
const ownerLoginRouteSource = await readFile(
  'app/api/auth/login/route.ts',
  'utf8',
);
assert.match(
  ownerLoginRouteSource,
  /const accountHome = inactiveMember[\s\S]+\? '\/mypage\/billing'[\s\S]+staffPermissions\.isOwner[\s\S]+\? '\/aikanri'/,
  'inactive password login must prefer billing-only access while active owners keep the management entry',
);
const nextConfigSource = await readFile('next.config.ts', 'utf8');
assert.match(
  nextConfigSource,
  /privateRouteRoots[\s\S]+['"]\/aikanri['"]/,
  'the owner entry must receive private no-store and noindex headers',
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
assert.match(
  memberAuthSource,
  /resolvePasswordSession[\s\S]+row\.memberStatus && row\.memberStatus !== 'active'[\s\S]+resolveBillingPasswordSession/,
  'normal member sessions must continue rejecting inactive membership before the billing-only resolver is declared',
);
assert.match(
  memberAuthSource,
  /resolveBillingPasswordSession[\s\S]+INNER JOIN members AS member[\s\S]+session\.session_kind = 'member'[\s\S]+account\.status = 'active'[\s\S]+account\.password_state = 'personal'[\s\S]+account\.account_kind = 'member'/,
  'billing-only password sessions must require a real member and reject temporary, demo, disabled, or password-change access',
);

const loginRouteSource = await readFile('app/api/auth/login/route.ts', 'utf8');
assert.match(
  loginRouteSource,
  /readChatGPTIdentityHeaders\(request\.headers\)/,
);
assert.match(loginRouteSource, /verificationRequired/);

const bootstrapRouteSource = await readFile(
  'app/api/auth/bootstrap/route.ts',
  'utf8',
);
assert.match(
  bootstrapRouteSource,
  /export async function POST\(\) \{\s*return noStoreJson\(\{ error: 'Not found\.' \}, \{ status: 404 \}\);\s*\}/,
  'the retired bootstrap endpoint must unconditionally return 404',
);
assert.doesNotMatch(
  bootstrapRouteSource,
  /AUTH_BOOTSTRAP_TOKEN|member-auth|request\.json|authorization/,
  'the retired bootstrap endpoint must not read secrets, databases, or requests',
);

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
assert.match(
  loginPageSource,
  /href="\/mypage\/billing"[\s\S]+請求管理専用ページへ/,
  'the login screen must expose the billing-only recovery path',
);

const billingAuthSource = await readFile('app/chatgpt-auth.ts', 'utf8');
assert.match(
  billingAuthSource,
  /getBillingAuthenticatedUser[\s\S]+resolveBillingPasswordSession[\s\S]+linkedAccount\.status !== 'active'[\s\S]+linkedAccount\.accountKind !== 'member'[\s\S]+linkedAccount\.passwordState !== 'personal'/,
  'billing-only identity must apply the same strict account requirements to password and ChatGPT entry paths',
);
const billingPageSource = await readFile('app/mypage/billing/page.tsx', 'utf8');
assert.match(
  billingPageSource,
  /requireBillingAuthenticatedUser\(billingPath\)[\s\S]+memberStatus === 'active'[\s\S]+isOwner[\s\S]+getBillingCustomer\([\s\S]+<BillingPortalButton/,
  'the billing-only page must retain active-owner routing and show the portal only for the member-owned D1 customer mapping',
);
const billingRouteSource = await readFile('lib/stripe-route.ts', 'utf8');
assert.match(
  billingRouteSource,
  /allowInactiveMember[\s\S]+\? await getBillingAuthenticatedUser\(\)[\s\S]+: await getChatGPTUser\(\)[\s\S]+!allowInactiveMember[\s\S]+member\.status !== 'active'/,
  'only the customer portal may use inactive billing identity; checkout must retain active membership checks',
);
const billingPortalRouteSource = await readFile(
  'app/api/billing/portal/route.ts',
  'utf8',
);
assert.match(
  billingPortalRouteSource,
  /auth\.member\.status === 'active'[\s\S]+urls\.portalReturnUrl[\s\S]+withSiteBasePath\('\/mypage\/billing'\)[\s\S]+return_url: portalReturnUrl/,
  'inactive customers must return from Stripe Portal to the billing-only page instead of the regular mypage guard',
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
