import { env } from 'cloudflare:workers';
import {
  createSessionToken,
  sha256Base64Url,
  hashPassword,
  requirePasswordPepper,
  validatePersonalPassword,
} from '@/lib/password-security';
import { membershipTermsVersion, privacyPolicyVersion } from '@/db/membership';
import { issueVerifiedMemberSession } from '@/db/member-auth';
export type RegistrationTicket = {
  email: string;
  provider: string;
  subject: string | null;
};
export async function registrationAllowance(key: string, max = 5) {
  const hash = await sha256Base64Url(
      key + requirePasswordPepper(env.AUTH_PASSWORD_PEPPER),
    ),
    now = Date.now(),
    window = now - 3600000;
  const row =
    await env.DB.prepare(`INSERT INTO registration_rate_limits(key_hash,window_start,request_count) VALUES(?,?,1)
 ON CONFLICT(key_hash) DO UPDATE SET window_start=CASE WHEN window_start<=? THEN ? ELSE window_start END,
 request_count=CASE WHEN window_start<=? THEN 1 ELSE request_count+1 END
 WHERE window_start<=? OR request_count<? RETURNING request_count`)
      .bind(hash, now, window, now, window, window, max)
      .first();
  return !!row;
}
export async function existingRegistrationEmail(email: string) {
  return !!(await env.DB.prepare(`SELECT member_id FROM member_auth_accounts WHERE lower(login_id)=? OR lower(contact_email)=?
 UNION SELECT id FROM members WHERE lower(email)=? LIMIT 1`)
    .bind(email, email, email)
    .first());
}
export async function createRegistrationTicket(
  email: string,
  provider = 'email',
  subject: string | null = null,
) {
  const token = createSessionToken(),
    hash = await sha256Base64Url(token);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM registration_tickets WHERE expires_at<?').bind(
      Date.now(),
    ),
    env.DB.prepare(
      'INSERT INTO registration_tickets(token_hash,email,provider,subject,expires_at) VALUES(?,?,?,?,?)',
    ).bind(hash, email, provider, subject, Date.now() + 1800000),
  ]);
  return token;
}
export async function getRegistrationTicket(
  token: string,
): Promise<RegistrationTicket | null> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  return env.DB.prepare(
    'SELECT email,provider,subject FROM registration_tickets WHERE token_hash=? AND used_at IS NULL AND expires_at>?',
  )
    .bind(await sha256Base64Url(token), Date.now())
    .first<RegistrationTicket>();
}
export async function completeRegistration(input: {
  token: string;
  nickname: string;
  password: string;
}) {
  const ticket = await getRegistrationTicket(input.token);
  if (!ticket)
    throw new Error(
      '確認リンクの有効期限が切れています。もう一度登録を始めてください。',
    );
  const invalid = validatePersonalPassword({
    password: input.password,
    loginId: ticket.email,
  });
  if (invalid) throw new Error(invalid);
  if (await existingRegistrationEmail(ticket.email))
    throw new Error(
      'このメールでは登録を完了できません。登録済みの方はログインしてください。',
    );
  const id = crypto.randomUUID(),
    now = Date.now(),
    hash = await sha256Base64Url(input.token);
  const digest = await hashPassword(
    input.password,
    requirePasswordPepper(env.AUTH_PASSWORD_PEPPER),
  );
  const available = 'token_hash=? AND used_at IS NULL AND expires_at>?';
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO members(id,email,display_name,status,terms_version,terms_accepted_at,privacy_version,privacy_accepted_at,created_at,updated_at)
     SELECT ?,email,?,'active',?,?,?,?,?,? FROM registration_tickets WHERE ${available}`).bind(
      id,
      input.nickname,
      membershipTermsVersion,
      now,
      privacyPolicyVersion,
      now,
      now,
      now,
      hash,
      now,
    ),
    env.DB.prepare(`INSERT INTO member_auth_accounts(member_id,login_id,contact_email,password_digest,password_state,account_kind,status,temporary_password_expires_at,password_changed_at,created_at,updated_at)
     SELECT id,email,email,?,'personal','member','active',NULL,?,?,? FROM members WHERE id=?`).bind(
      digest,
      now,
      now,
      now,
      id,
    ),
    env.DB.prepare(`INSERT INTO member_auth_identities(provider,subject,member_id)
     SELECT provider,subject,? FROM registration_tickets WHERE ${available} AND subject IS NOT NULL AND EXISTS(SELECT 1 FROM member_auth_accounts WHERE member_id=?)`).bind(
      id,
      hash,
      now,
      id,
    ),
    env.DB.prepare(
      `UPDATE registration_tickets SET used_at=? WHERE ${available} AND EXISTS(SELECT 1 FROM member_auth_accounts WHERE member_id=?)`,
    ).bind(now, hash, now, id),
  ]);
  const session = await issueVerifiedMemberSession(id);
  if (!session)
    throw new Error(
      'この確認リンクは使用済みです。ログインからお進みください。',
    );
  return session;
}
