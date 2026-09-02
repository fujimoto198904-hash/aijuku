import { env } from 'cloudflare:workers';

import {
  createSessionToken,
  hashPassword,
  isPlausibleMemberEmail,
  isValidInitialPassword,
  normalizeLoginId,
  protectedIdentifierHash,
  requirePasswordPepper,
  sha256Base64Url,
  validatePersonalPassword,
  verifiedIdentityCanClaimTemporaryAccount,
  verifyPassword,
} from '@/lib/password-security';
import { getStaffPermissions } from '@/lib/staff-permissions';

export type MemberAuthAccount = {
  memberId: string;
  loginId: string;
  contactEmail: string | null;
  passwordState: 'temporary' | 'personal';
  accountKind: 'member' | 'demo';
  status: 'active' | 'disabled';
  temporaryPasswordExpiresAt: number | null;
  passwordChangedAt: number | null;
  lastLoginAt: number | null;
};

type StoredMemberAuthAccount = MemberAuthAccount & {
  passwordDigest: string;
};

export type PasswordSessionUser = MemberAuthAccount & {
  displayName: string;
  sessionKind: 'member' | 'password-change';
};

export type IssuedPasswordSession = {
  token: string;
  expiresAt: number;
  user: PasswordSessionUser;
};

const memberSessionLifetimeMs = 7 * 24 * 60 * 60 * 1_000;
const passwordChangeSessionLifetimeMs = 20 * 60 * 1_000;
const temporaryPasswordLifetimeMs = 72 * 60 * 60 * 1_000;
const rateLimitWindowMs = 15 * 60 * 1_000;
const rateLimitBlockMs = 30 * 60 * 1_000;
const rateLimitRetentionMs = 7 * 24 * 60 * 60 * 1_000;

let dummyDigestByPepper: { pepper: string; digest: Promise<string> } | null =
  null;

function getD1(): D1Database {
  if (!env.DB) throw new Error('D1 binding `DB` is unavailable.');
  return env.DB;
}

function passwordPepper(): string {
  return requirePasswordPepper(env.AUTH_PASSWORD_PEPPER);
}

function passwordUserEmail(account: MemberAuthAccount): string {
  return account.contactEmail ?? account.loginId;
}

function defaultDisplayName(account: MemberAuthAccount): string {
  if (account.accountKind === 'demo') return 'デモ会員';
  const [localPart] = passwordUserEmail(account).split('@');
  return localPart || '会員';
}

function identityCanClaimTemporaryAccount(input: {
  identity: { userId: string; email: string } | null;
  account: Pick<MemberAuthAccount, 'loginId' | 'contactEmail'>;
}): boolean {
  return verifiedIdentityCanClaimTemporaryAccount({
    identity: input.identity,
    loginId: input.account.loginId,
    contactEmail: input.account.contactEmail,
    configuredOwnerLoginId: env.AUTH_OWNER_LOGIN_ID,
    identityIsOwner: input.identity
      ? getStaffPermissions(input.identity.email).isOwner
      : false,
  });
}

async function getStoredAccountByLoginId(
  loginId: string,
): Promise<StoredMemberAuthAccount | null> {
  return getD1()
    .prepare(
      `
      SELECT
        member_id AS memberId,
        login_id AS loginId,
        contact_email AS contactEmail,
        password_digest AS passwordDigest,
        password_state AS passwordState,
        account_kind AS accountKind,
        status,
        temporary_password_expires_at AS temporaryPasswordExpiresAt,
        password_changed_at AS passwordChangedAt,
        last_login_at AS lastLoginAt
      FROM member_auth_accounts
      WHERE login_id = ?
      LIMIT 1
    `,
    )
    .bind(loginId)
    .first<StoredMemberAuthAccount>();
}

async function getStoredAccountByMemberId(
  memberId: string,
): Promise<StoredMemberAuthAccount | null> {
  return getD1()
    .prepare(
      `
      SELECT
        member_id AS memberId,
        login_id AS loginId,
        contact_email AS contactEmail,
        password_digest AS passwordDigest,
        password_state AS passwordState,
        account_kind AS accountKind,
        status,
        temporary_password_expires_at AS temporaryPasswordExpiresAt,
        password_changed_at AS passwordChangedAt,
        last_login_at AS lastLoginAt
      FROM member_auth_accounts
      WHERE member_id = ?
      LIMIT 1
    `,
    )
    .bind(memberId)
    .first<StoredMemberAuthAccount>();
}

function publicAccount(account: StoredMemberAuthAccount): MemberAuthAccount {
  const { passwordDigest: _, ...safeAccount } = account;
  return safeAccount;
}

export async function getMemberAuthAccount(
  memberId: string,
): Promise<MemberAuthAccount | null> {
  const account = await getStoredAccountByMemberId(memberId);
  return account ? publicAccount(account) : null;
}

export type VerifiedMemberAuthResolution =
  | { kind: 'account'; account: MemberAuthAccount; claimed: boolean }
  | { kind: 'none' }
  | { kind: 'conflict' };

/**
 * Resolve the password account belonging to a verified ChatGPT identity.
 *
 * Bootstrap creates the owner account before a Sites member id exists, so its
 * temporary account starts with an otherwise-unused UUID. We may re-key only
 * that untouched temporary row after the verified identity and initial
 * password match. A separately configured owner login may also be claimed by
 * an ADMIN_EMAILS identity. Accounts with a member record, a session, a
 * personal password, demo status, or an expired temporary password are never
 * merged.
 */
export async function resolveVerifiedMemberAuthAccount(input: {
  memberId: string;
  email: string;
  initialPassword: string;
  loginId?: string;
}): Promise<VerifiedMemberAuthResolution> {
  const directAccount = await getStoredAccountByMemberId(input.memberId);
  if (directAccount) {
    return {
      kind: 'account',
      account: publicAccount(directAccount),
      claimed: false,
    };
  }

  const verifiedEmail = normalizeLoginId(input.email);
  const candidateLoginId = normalizeLoginId(input.loginId ?? verifiedEmail);
  const candidate = candidateLoginId
    ? await getStoredAccountByLoginId(candidateLoginId)
    : null;
  if (!candidate) return { kind: 'none' };

  const now = Date.now();
  const claimable =
    candidate.accountKind === 'member' &&
    candidate.passwordState === 'temporary' &&
    candidate.status === 'active' &&
    Boolean(
      candidate.temporaryPasswordExpiresAt &&
      candidate.temporaryPasswordExpiresAt > now,
    ) &&
    identityCanClaimTemporaryAccount({
      identity: { userId: input.memberId, email: verifiedEmail },
      account: candidate,
    }) &&
    (await verifyPassword({
      password: input.initialPassword,
      pepper: passwordPepper(),
      storedDigest: candidate.passwordDigest,
    }));
  if (!claimable) return { kind: 'conflict' };

  const result = await getD1()
    .prepare(
      `
      UPDATE member_auth_accounts
      SET member_id = ?, updated_at = ?
      WHERE member_id = ?
        AND login_id = ?
        AND account_kind = 'member'
        AND password_state = 'temporary'
        AND status = 'active'
        AND temporary_password_expires_at > ?
        AND NOT EXISTS (
          SELECT 1 FROM members WHERE id = ?
        )
        AND NOT EXISTS (
          SELECT 1 FROM member_auth_sessions WHERE account_id = ?
        )
        AND NOT EXISTS (
          SELECT 1 FROM member_auth_accounts WHERE member_id = ?
        )
        AND NOT EXISTS (
          SELECT 1 FROM members WHERE id = ? AND status <> 'active'
        )
    `,
    )
    .bind(
      input.memberId,
      now,
      candidate.memberId,
      candidate.loginId,
      now,
      candidate.memberId,
      candidate.memberId,
      input.memberId,
      input.memberId,
    )
    .run();

  if (Number(result.meta.changes ?? 0) !== 1) {
    const concurrentlyResolved = await getStoredAccountByMemberId(
      input.memberId,
    );
    return concurrentlyResolved
      ? {
          kind: 'account',
          account: publicAccount(concurrentlyResolved),
          claimed: false,
        }
      : { kind: 'conflict' };
  }

  const resolved = await getStoredAccountByMemberId(input.memberId);
  if (!resolved) throw new Error('Claimed member auth account is unavailable.');
  return {
    kind: 'account',
    account: publicAccount(resolved),
    claimed: true,
  };
}

async function issueSession(
  account: StoredMemberAuthAccount,
  sessionKind: 'member' | 'password-change',
): Promise<IssuedPasswordSession> {
  const token = createSessionToken();
  const tokenHash = await sha256Base64Url(token);
  const now = Date.now();
  const expiresAt =
    now +
    (sessionKind === 'member'
      ? memberSessionLifetimeMs
      : passwordChangeSessionLifetimeMs);
  const db = getD1();
  await db
    .prepare(
      `
      INSERT INTO member_auth_sessions (
        token_hash,
        account_id,
        session_kind,
        created_at,
        last_seen_at,
        expires_at,
        revoked_at
      ) VALUES (?, ?, ?, ?, ?, ?, NULL)
    `,
    )
    .bind(tokenHash, account.memberId, sessionKind, now, now, expiresAt)
    .run();
  await db
    .prepare(
      `
      DELETE FROM member_auth_sessions
      WHERE expires_at <= ? OR (revoked_at IS NOT NULL AND revoked_at <= ?)
    `,
    )
    .bind(now, now - 24 * 60 * 60 * 1_000)
    .run();

  const member = await db
    .prepare(
      `
      SELECT display_name AS displayName
      FROM members
      WHERE id = ?
      LIMIT 1
    `,
    )
    .bind(account.memberId)
    .first<{ displayName: string }>();

  return {
    token,
    expiresAt,
    user: {
      ...publicAccount(account),
      displayName: member?.displayName ?? defaultDisplayName(account),
      sessionKind,
    },
  };
}

async function rateLimitKey(action: string, value: string): Promise<string> {
  return protectedIdentifierHash(`${action}:${value}`, passwordPepper());
}

async function consumeRateLimit(input: {
  action: 'login-id' | 'login-ip' | 'password-change' | 'bootstrap';
  value: string;
  limit: number;
}): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const now = Date.now();
  const keyHash = await rateLimitKey(input.action, input.value);
  const db = getD1();
  const current = await db
    .prepare(
      `
      INSERT INTO member_auth_rate_limits (
        key_hash,
        action,
        window_started_at,
        request_count,
        blocked_until,
        updated_at
      ) VALUES (?, ?, ?, 1, NULL, ?)
      ON CONFLICT(key_hash) DO UPDATE SET
        action = excluded.action,
        window_started_at = CASE
          WHEN member_auth_rate_limits.blocked_until > ?
            THEN member_auth_rate_limits.window_started_at
          WHEN member_auth_rate_limits.window_started_at + ? <= ?
            THEN excluded.window_started_at
          ELSE member_auth_rate_limits.window_started_at
        END,
        request_count = CASE
          WHEN member_auth_rate_limits.blocked_until > ?
            THEN member_auth_rate_limits.request_count
          WHEN member_auth_rate_limits.window_started_at + ? <= ?
            THEN 1
          ELSE member_auth_rate_limits.request_count + 1
        END,
        blocked_until = CASE
          WHEN member_auth_rate_limits.blocked_until > ?
            THEN member_auth_rate_limits.blocked_until
          WHEN member_auth_rate_limits.window_started_at + ? <= ?
            THEN NULL
          WHEN member_auth_rate_limits.request_count + 1 > ?
            THEN ?
          ELSE NULL
        END,
        updated_at = excluded.updated_at
      RETURNING
        request_count AS requestCount,
        blocked_until AS blockedUntil
    `,
    )
    .bind(
      keyHash,
      input.action,
      now,
      now,
      now,
      rateLimitWindowMs,
      now,
      now,
      rateLimitWindowMs,
      now,
      now,
      rateLimitWindowMs,
      now,
      input.limit,
      now + rateLimitBlockMs,
    )
    .first<{
      requestCount: number;
      blockedUntil: number | null;
    }>();

  if (!current) throw new Error('Rate limit update did not return a row.');

  await maybeCleanupExpiredRateLimits(db, now);

  return {
    allowed: !current.blockedUntil || current.blockedUntil <= now,
    retryAfterSeconds:
      current.blockedUntil && current.blockedUntil > now
        ? Math.max(1, Math.ceil((current.blockedUntil - now) / 1_000))
        : 0,
  };
}

async function maybeCleanupExpiredRateLimits(
  db: D1Database,
  now: number,
): Promise<void> {
  const sample = new Uint8Array(1);
  crypto.getRandomValues(sample);
  if (sample[0] !== 0) return;

  try {
    await db
      .prepare(
        `
        DELETE FROM member_auth_rate_limits
        WHERE key_hash IN (
          SELECT key_hash
          FROM member_auth_rate_limits
          WHERE updated_at < ?
            AND (blocked_until IS NULL OR blocked_until <= ?)
          ORDER BY updated_at
          LIMIT 250
        )
      `,
      )
      .bind(now - rateLimitRetentionMs, now)
      .run();
  } catch (error) {
    console.error('expired auth rate limit cleanup failed', error);
  }
}

async function clearRateLimit(action: string, value: string): Promise<void> {
  const keyHash = await rateLimitKey(action, value);
  await getD1()
    .prepare('DELETE FROM member_auth_rate_limits WHERE key_hash = ?')
    .bind(keyHash)
    .run();
}

async function dummyDigest(pepper: string): Promise<string> {
  if (!dummyDigestByPepper || dummyDigestByPepper.pepper !== pepper) {
    dummyDigestByPepper = {
      pepper,
      digest: hashPassword('invalid-password-placeholder', pepper),
    };
  }
  return dummyDigestByPepper.digest;
}

export async function authenticatePassword(input: {
  loginId: string;
  password: string;
  clientAddress: string;
  verifiedIdentity?: { userId: string; email: string } | null;
}): Promise<
  | { ok: true; session: IssuedPasswordSession }
  | {
      ok: false;
      reason: 'invalid' | 'rate-limited' | 'verification-required';
      retryAfterSeconds: number;
    }
> {
  const loginId = normalizeLoginId(input.loginId);
  const pepper = passwordPepper();
  const [loginLimit, addressLimit] = await Promise.all([
    consumeRateLimit({
      action: 'login-id',
      value: loginId || 'invalid',
      limit: 6,
    }),
    consumeRateLimit({
      action: 'login-ip',
      value: input.clientAddress || 'unknown',
      limit: 30,
    }),
  ]);
  if (!loginLimit.allowed || !addressLimit.allowed) {
    return {
      ok: false,
      reason: 'rate-limited',
      retryAfterSeconds: Math.max(
        loginLimit.retryAfterSeconds,
        addressLimit.retryAfterSeconds,
      ),
    };
  }

  let account = loginId ? await getStoredAccountByLoginId(loginId) : null;
  const storedDigest = account?.passwordDigest ?? (await dummyDigest(pepper));
  const passwordMatches = await verifyPassword({
    password: input.password,
    pepper,
    storedDigest,
  });
  const now = Date.now();
  const temporaryExpired = Boolean(
    account?.passwordState === 'temporary' &&
    account.temporaryPasswordExpiresAt &&
    account.temporaryPasswordExpiresAt <= now,
  );
  if (
    !account ||
    !passwordMatches ||
    account.status !== 'active' ||
    temporaryExpired
  ) {
    return { ok: false, reason: 'invalid', retryAfterSeconds: 0 };
  }

  if (
    account.accountKind === 'member' &&
    account.passwordState === 'temporary' &&
    !identityCanClaimTemporaryAccount({
      identity: input.verifiedIdentity ?? null,
      account,
    })
  ) {
    return {
      ok: false,
      reason: 'verification-required',
      retryAfterSeconds: 0,
    };
  }

  if (
    account.accountKind === 'member' &&
    account.passwordState === 'temporary' &&
    input.verifiedIdentity
  ) {
    const resolution = await resolveVerifiedMemberAuthAccount({
      memberId: input.verifiedIdentity.userId,
      email: input.verifiedIdentity.email,
      initialPassword: input.password,
      loginId: account.loginId,
    });
    if (
      resolution.kind === 'account' &&
      resolution.account.memberId === input.verifiedIdentity.userId &&
      resolution.account.loginId === account.loginId
    ) {
      const resolvedAccount = await getStoredAccountByMemberId(
        input.verifiedIdentity.userId,
      );
      if (resolvedAccount) account = resolvedAccount;
    }
  }

  await Promise.all([
    getD1()
      .prepare(
        'UPDATE member_auth_accounts SET last_login_at = ?, updated_at = ? WHERE member_id = ?',
      )
      .bind(now, now, account.memberId)
      .run(),
    clearRateLimit('login-id', loginId),
  ]);
  account.lastLoginAt = now;
  const sessionKind =
    account.passwordState === 'temporary' ? 'password-change' : 'member';
  return { ok: true, session: await issueSession(account, sessionKind) };
}

export async function resolvePasswordSession(
  token: string,
): Promise<PasswordSessionUser | null> {
  if (!token || token.length > 200) return null;
  const tokenHash = await sha256Base64Url(token);
  const now = Date.now();
  type StoredPasswordSessionRow = MemberAuthAccount & {
    sessionKind: 'member' | 'password-change';
    lastSeenAt: number;
    displayName: string | null;
    memberStatus: 'active' | 'suspended' | 'withdrawn' | null;
  };
  const row = await getD1()
    .prepare(
      `
      SELECT
        account.member_id AS memberId,
        account.login_id AS loginId,
        account.contact_email AS contactEmail,
        account.password_state AS passwordState,
        account.account_kind AS accountKind,
        account.status,
        account.temporary_password_expires_at AS temporaryPasswordExpiresAt,
        account.password_changed_at AS passwordChangedAt,
        account.last_login_at AS lastLoginAt,
        session.session_kind AS sessionKind,
        session.last_seen_at AS lastSeenAt,
        member.display_name AS displayName,
        member.status AS memberStatus
      FROM member_auth_sessions AS session
      INNER JOIN member_auth_accounts AS account
        ON account.member_id = session.account_id
      LEFT JOIN members AS member
        ON member.id = account.member_id
      WHERE session.token_hash = ?
        AND session.revoked_at IS NULL
        AND session.expires_at > ?
        AND account.status = 'active'
        AND (
          account.password_state = 'personal'
          OR account.temporary_password_expires_at > ?
        )
      LIMIT 1
    `,
    )
    .bind(tokenHash, now, now)
    .first<StoredPasswordSessionRow>();
  if (!row) return null;
  if (row.memberStatus && row.memberStatus !== 'active') return null;
  if (row.sessionKind === 'member' && row.passwordState !== 'personal') {
    return null;
  }
  if (now - row.lastSeenAt > 15 * 60 * 1_000) {
    await getD1()
      .prepare(
        'UPDATE member_auth_sessions SET last_seen_at = ? WHERE token_hash = ?',
      )
      .bind(now, tokenHash)
      .run();
  }
  const { lastSeenAt: _, memberStatus: __, ...user } = row;
  return {
    ...user,
    displayName: row.displayName ?? defaultDisplayName(row),
  };
}

export async function revokePasswordSession(token: string): Promise<void> {
  if (!token || token.length > 200) return;
  const tokenHash = await sha256Base64Url(token);
  await getD1()
    .prepare(
      `
      UPDATE member_auth_sessions
      SET revoked_at = ?
      WHERE token_hash = ? AND revoked_at IS NULL
    `,
    )
    .bind(Date.now(), tokenHash)
    .run();
}

export async function changeMemberPassword(input: {
  memberId: string;
  currentPassword: string;
  newPassword: string;
}): Promise<
  | { ok: true; session: IssuedPasswordSession }
  | { ok: false; error: string; retryAfterSeconds?: number }
> {
  const limit = await consumeRateLimit({
    action: 'password-change',
    value: input.memberId,
    limit: 6,
  });
  if (!limit.allowed) {
    return {
      ok: false,
      error: 'しばらく時間をおいてから、もう一度お試しください。',
      retryAfterSeconds: limit.retryAfterSeconds,
    };
  }
  const account = await getStoredAccountByMemberId(input.memberId);
  if (
    !account ||
    account.status !== 'active' ||
    account.accountKind === 'demo'
  ) {
    return { ok: false, error: 'パスワードを変更できませんでした。' };
  }
  const pepper = passwordPepper();
  const currentMatches = await verifyPassword({
    password: input.currentPassword,
    pepper,
    storedDigest: account.passwordDigest,
  });
  if (!currentMatches) {
    return { ok: false, error: '現在のパスワードを確認してください。' };
  }
  const policyError = validatePersonalPassword({
    password: input.newPassword,
    loginId: account.loginId,
  });
  if (policyError) return { ok: false, error: policyError };
  const unchanged = await verifyPassword({
    password: input.newPassword,
    pepper,
    storedDigest: account.passwordDigest,
  });
  if (unchanged) {
    return { ok: false, error: '現在とは異なるパスワードを設定してください。' };
  }

  const now = Date.now();
  const passwordDigest = await hashPassword(input.newPassword, pepper);
  const db = getD1();
  await db.batch([
    db
      .prepare(
        `
        UPDATE member_auth_accounts
        SET
          password_digest = ?,
          password_state = 'personal',
          temporary_password_expires_at = NULL,
          password_changed_at = ?,
          updated_at = ?
        WHERE member_id = ? AND status = 'active'
      `,
      )
      .bind(passwordDigest, now, now, account.memberId),
    db
      .prepare(
        `
        UPDATE member_auth_sessions
        SET revoked_at = ?
        WHERE account_id = ? AND revoked_at IS NULL
      `,
      )
      .bind(now, account.memberId),
  ]);
  await clearRateLimit('password-change', input.memberId);
  const updated = await getStoredAccountByMemberId(account.memberId);
  if (!updated)
    return { ok: false, error: 'パスワードを変更できませんでした。' };
  return { ok: true, session: await issueSession(updated, 'member') };
}

export async function createVerifiedMemberPasswordAccount(input: {
  memberId: string;
  email: string;
  initialPassword: string;
}): Promise<MemberAuthAccount> {
  const loginId = normalizeLoginId(input.email);
  if (!loginId || loginId !== input.email.trim().toLowerCase()) {
    throw new Error('Verified email is invalid.');
  }
  if (
    !isValidInitialPassword({
      accountKind: 'member',
      password: input.initialPassword,
    })
  ) {
    throw new Error('Initial member password must be exactly eight digits.');
  }
  const existingByMember = await getStoredAccountByMemberId(input.memberId);
  if (existingByMember) return publicAccount(existingByMember);
  const existingByLogin = await getStoredAccountByLoginId(loginId);
  if (existingByLogin && existingByLogin.memberId !== input.memberId) {
    throw new Error('Login ID is already linked to another member.');
  }
  const now = Date.now();
  const account: StoredMemberAuthAccount = {
    memberId: input.memberId,
    loginId,
    contactEmail: input.email.trim(),
    passwordDigest: await hashPassword(input.initialPassword, passwordPepper()),
    passwordState: 'temporary',
    accountKind: 'member',
    status: 'active',
    temporaryPasswordExpiresAt: now + temporaryPasswordLifetimeMs,
    passwordChangedAt: null,
    lastLoginAt: null,
  };
  await getD1()
    .prepare(
      `
      INSERT INTO member_auth_accounts (
        member_id,
        login_id,
        contact_email,
        password_digest,
        password_state,
        account_kind,
        status,
        temporary_password_expires_at,
        password_changed_at,
        last_login_at,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, 'temporary', 'member', 'active', ?, NULL, NULL, ?, ?)
    `,
    )
    .bind(
      account.memberId,
      account.loginId,
      account.contactEmail,
      account.passwordDigest,
      account.temporaryPasswordExpiresAt,
      now,
      now,
    )
    .run();
  return publicAccount(account);
}

export async function bootstrapPasswordAccount(input: {
  loginId: string;
  contactEmail: string | null;
  initialPassword: string;
  accountKind: 'member' | 'demo';
}): Promise<{ account: MemberAuthAccount; created: boolean }> {
  const loginId = normalizeLoginId(input.loginId);
  if (!loginId) throw new Error('Bootstrap login ID is invalid.');
  const contactEmail = input.contactEmail
    ? normalizeLoginId(input.contactEmail)
    : null;
  if (
    input.accountKind === 'member' &&
    (!isPlausibleMemberEmail(loginId) ||
      (contactEmail !== null && contactEmail !== loginId))
  ) {
    throw new Error('Bootstrap member email is invalid.');
  }
  if (
    !isValidInitialPassword({
      accountKind: input.accountKind,
      password: input.initialPassword,
    })
  ) {
    throw new Error('Bootstrap initial password is invalid.');
  }
  const existing = await getStoredAccountByLoginId(loginId);
  if (existing) return { account: publicAccount(existing), created: false };
  const now = Date.now();
  const personal = input.accountKind === 'demo';
  const account: StoredMemberAuthAccount = {
    memberId: crypto.randomUUID(),
    loginId,
    contactEmail,
    passwordDigest: await hashPassword(input.initialPassword, passwordPepper()),
    passwordState: personal ? 'personal' : 'temporary',
    accountKind: input.accountKind,
    status: 'active',
    temporaryPasswordExpiresAt: personal
      ? null
      : now + temporaryPasswordLifetimeMs,
    passwordChangedAt: personal ? now : null,
    lastLoginAt: null,
  };
  await getD1()
    .prepare(
      `
      INSERT INTO member_auth_accounts (
        member_id,
        login_id,
        contact_email,
        password_digest,
        password_state,
        account_kind,
        status,
        temporary_password_expires_at,
        password_changed_at,
        last_login_at,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, NULL, ?, ?)
    `,
    )
    .bind(
      account.memberId,
      account.loginId,
      account.contactEmail,
      account.passwordDigest,
      account.passwordState,
      account.accountKind,
      account.temporaryPasswordExpiresAt,
      account.passwordChangedAt,
      now,
      now,
    )
    .run();
  return { account: publicAccount(account), created: true };
}

export async function consumeBootstrapRateLimit(
  clientAddress: string,
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  return consumeRateLimit({
    action: 'bootstrap',
    value: clientAddress || 'unknown',
    limit: 5,
  });
}

export function passwordAuthEmail(account: MemberAuthAccount): string {
  return passwordUserEmail(account);
}
