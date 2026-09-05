import { env } from 'cloudflare:workers';
import { membershipTermsVersion, privacyPolicyVersion } from '@/db/membership';
import { issueVerifiedMemberSession } from '@/db/member-auth';
import {
  createSessionToken,
  hashPassword,
  protectedIdentifierHash,
  requirePasswordPepper,
  validatePersonalPassword,
  verifyPassword,
} from '@/lib/password-security';
import {
  registrationUsername,
  reservedRegistrationUsername,
} from '@/lib/username-registration';

const recoveryError = 'ユーザー名と復旧コードを確認してください。';
function recoveryHash(memberId: string, code: string) {
  return protectedIdentifierHash(
    `account-recovery:${memberId}:${code}`,
    requirePasswordPepper(env.AUTH_PASSWORD_PEPPER),
  );
}

export async function registerUsername(input: {
  username: string;
  password: string;
}) {
  const username = registrationUsername(input.username);
  if (
    !username ||
    reservedRegistrationUsername(username, env.AUTH_OWNER_LOGIN_ID)
  )
    throw new Error(
      '別のユーザー名を入力してください。半角英数字・_・-の3〜24文字が使えます。',
    );
  const invalid = validatePersonalPassword({
    password: input.password,
    loginId: username,
  });
  if (invalid) throw new Error(invalid);
  if (
    await env.DB.prepare(
      'SELECT 1 FROM member_auth_accounts WHERE lower(login_id)=?',
    )
      .bind(username)
      .first()
  )
    throw new Error('このユーザー名は使えません。別の名前をお試しください。');
  const id = crypto.randomUUID(),
    now = Date.now();
  const digest = await hashPassword(
    input.password,
    requirePasswordPepper(env.AUTH_PASSWORD_PEPPER),
  );
  // D1 batch is transactional: a competing username claim rolls back the member too.
  try {
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO members(id,email,display_name,status,terms_version,terms_accepted_at,privacy_version,privacy_accepted_at,created_at,updated_at)
        VALUES(?,'','メンバー','active',?,?,?,?,?,?)`).bind(
        id,
        membershipTermsVersion,
        now,
        privacyPolicyVersion,
        now,
        now,
        now,
      ),
      env.DB.prepare(`INSERT INTO member_auth_accounts(member_id,login_id,contact_email,password_digest,password_state,account_kind,status,temporary_password_expires_at,password_changed_at,recovery_code_hash,recovery_code_created_at,created_at,updated_at)
        VALUES(?,?,NULL,?,'personal','member','active',NULL,?,NULL,NULL,?,?)`).bind(
        id,
        username,
        digest,
        now,
        now,
        now,
      ),
    ]);
  } catch (error) {
    if (String(error).includes('UNIQUE'))
      throw new Error('このユーザー名は使えません。別の名前をお試しください。');
    throw error;
  }
  const session = await issueVerifiedMemberSession(id);
  if (!session)
    throw new Error(
      '登録後のログインに失敗しました。入力したユーザー名とパスワードでログインしてください。',
    );
  return { session, username };
}

type RecoveryAccount = {
  memberId: string;
  loginId: string;
  passwordDigest: string;
  codeHash: string | null;
};
async function recoveryAccount(username: string) {
  return env.DB.prepare(`SELECT a.member_id AS memberId,a.login_id AS loginId,a.password_digest AS passwordDigest,a.recovery_code_hash AS codeHash
    FROM member_auth_accounts a JOIN members m ON m.id=a.member_id
    WHERE a.login_id=? AND a.account_kind='member' AND a.password_state='personal' AND a.status='active' AND m.status='active'
      AND a.contact_email IS NULL`)
    .bind(username)
    .first<RecoveryAccount>();
}

export async function hasUsernameRecovery(memberId: string) {
  if (memberId === env.AUTH_OWNER_MEMBER_ID) return false;
  const account =
    await env.DB.prepare(`SELECT login_id AS loginId FROM member_auth_accounts WHERE member_id=? AND account_kind='member'
    AND status='active' AND password_state='personal' AND contact_email IS NULL`)
      .bind(memberId)
      .first<{ loginId: string }>();
  return (
    !!account &&
    !!registrationUsername(account.loginId) &&
    !reservedRegistrationUsername(account.loginId, env.AUTH_OWNER_LOGIN_ID)
  );
}

export async function recoverUsernamePassword(input: {
  username: string;
  code: string;
  password: string;
}) {
  const username = registrationUsername(input.username);
  if (
    !username ||
    reservedRegistrationUsername(username, env.AUTH_OWNER_LOGIN_ID) ||
    !/^[A-Za-z0-9_-]{43}$/.test(input.code)
  )
    throw new Error(recoveryError);
  const invalid = validatePersonalPassword({
    password: input.password,
    loginId: username,
  });
  if (invalid) throw new Error(invalid);
  const account = await recoveryAccount(username);
  if (!account?.codeHash || account.memberId === env.AUTH_OWNER_MEMBER_ID)
    throw new Error(recoveryError);
  const oldHash = await recoveryHash(account.memberId, input.code);
  const code = createSessionToken(),
    nextHash = await recoveryHash(account.memberId, code),
    now = Date.now();
  const digest = await hashPassword(
    input.password,
    requirePasswordPepper(env.AUTH_PASSWORD_PEPPER),
  );
  const results = await env.DB.batch([
    env.DB.prepare(`UPDATE member_auth_accounts SET password_digest=?,password_changed_at=?,recovery_code_hash=?,recovery_code_created_at=?,updated_at=?
      WHERE member_id=? AND recovery_code_hash=? AND status='active' AND account_kind='member' AND password_state='personal'
        AND EXISTS(SELECT 1 FROM members WHERE id=member_id AND status='active')`).bind(
      digest,
      now,
      nextHash,
      now,
      now,
      account.memberId,
      oldHash,
    ),
    // Only the request that successfully rotates the code can revoke sessions.
    env.DB.prepare(`DELETE FROM member_auth_sessions WHERE account_id=? AND EXISTS(
      SELECT 1 FROM member_auth_accounts WHERE member_id=? AND recovery_code_hash=?)`).bind(
      account.memberId,
      account.memberId,
      nextHash,
    ),
  ]);
  if (results[0].meta.changes !== 1) throw new Error(recoveryError);
  return { username, recoveryCode: code };
}

export async function rotateUsernameRecovery(input: {
  memberId: string;
  username: string;
  password: string;
}) {
  const account = await recoveryAccount(input.username);
  if (
    !account ||
    !registrationUsername(input.username) ||
    reservedRegistrationUsername(input.username, env.AUTH_OWNER_LOGIN_ID) ||
    account.memberId !== input.memberId ||
    account.memberId === env.AUTH_OWNER_MEMBER_ID ||
    !(await verifyPassword({
      password: input.password,
      pepper: requirePasswordPepper(env.AUTH_PASSWORD_PEPPER),
      storedDigest: account.passwordDigest,
    }))
  )
    throw new Error('現在のパスワードを確認してください。');
  const code = createSessionToken(),
    nextHash = await recoveryHash(account.memberId, code),
    now = Date.now();
  const result =
    await env.DB.prepare(`UPDATE member_auth_accounts SET recovery_code_hash=?,recovery_code_created_at=?,updated_at=?
    WHERE member_id=? AND recovery_code_hash IS ? AND password_digest=? AND status='active'
      AND EXISTS(SELECT 1 FROM members WHERE id=member_id AND status='active')`)
      .bind(
        nextHash,
        now,
        now,
        account.memberId,
        account.codeHash,
        account.passwordDigest,
      )
      .run();
  if (result.meta.changes !== 1)
    throw new Error(
      '再発行できませんでした。もう一度ログインしてお試しください。',
    );
  return { username: account.loginId, recoveryCode: code };
}
