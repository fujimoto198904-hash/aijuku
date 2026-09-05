import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import {
  googleFlowCookie,
  readGoogleFlow,
  verifyGoogleCode,
  googleCookieHeader,
} from '@/lib/google-signin';
import {
  createRegistrationTicket,
  existingRegistrationEmail,
} from '@/db/registration';
import { issueVerifiedMemberSession } from '@/db/member-auth';
import { getMember } from '@/db/membership';
import { appendSessionCookie } from '@/lib/member-session-cookie';
import { canonicalPublicPath } from '@/lib/site-paths';
import { isPlausibleMemberEmail } from '@/lib/password-security';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const headers = new Headers({
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
  });
  headers.append(
    'Set-Cookie',
    googleCookieHeader('', new URL(request.url).protocol === 'https:', 0),
  );
  function go(path: string) {
    headers.set('Location', canonicalPublicPath(path));
    return new Response(null, { status: 303, headers });
  }
  try {
    const params = new URL(request.url).searchParams;
    const raw = request.headers
      .get('cookie')
      ?.split(';')
      .map((v) => v.trim())
      .find((v) => v.startsWith(googleFlowCookie + '='))
      ?.slice(googleFlowCookie.length + 1);
    const flow = raw ? await readGoogleFlow(raw) : null;
    if (!flow || params.get('state') !== flow.state || !params.get('code'))
      return go('/login?error=google-failed');
    const identity = await verifyGoogleCode(params.get('code')!, flow);
    if (!isPlausibleMemberEmail(identity.email))
      return go('/login?error=google-failed');
    const linked = await env.DB.prepare(
      "SELECT member_id AS memberId FROM member_auth_identities WHERE provider='google' AND subject=?",
    )
      .bind(identity.subject)
      .first<{ memberId: string }>();
    if (!identity.authoritative) return go('/join?error=google-email');
    if (flow.memberId) {
      const user = await getChatGPTUser(),
        member = user ? await getMember(user.userId) : null;
      if (
        !user ||
        user.isDemo ||
        user.userId !== flow.memberId ||
        member?.status !== 'active' ||
        user.email.toLowerCase() !== identity.email ||
        (linked && linked.memberId !== user.userId)
      )
        return go('/login?error=google-link');
      await env.DB.prepare(
        "INSERT INTO member_auth_identities(provider,subject,member_id) VALUES('google',?,?) ON CONFLICT(provider,subject) DO NOTHING",
      )
        .bind(identity.subject, user.userId)
        .run();
      return go('/mypage?google=linked');
    }
    if (linked) {
      const session = await issueVerifiedMemberSession(linked.memberId);
      if (!session) return go('/login?error=google-failed');
      appendSessionCookie(headers, {
        request,
        token: session.token,
        expiresAt: session.expiresAt,
      });
      return go('/mypage');
    }
    if (await existingRegistrationEmail(identity.email))
      return go('/login?error=google-link');
    const ticket = await createRegistrationTicket(
      identity.email,
      'google',
      identity.subject,
    );
    return go('/join?ticket=' + ticket);
  } catch {
    return go('/login?error=google-failed');
  }
}
