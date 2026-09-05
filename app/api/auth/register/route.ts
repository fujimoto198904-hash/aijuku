import { env } from 'cloudflare:workers';
import { isSameOriginRequest } from '@/lib/request-security';
import { readBoundedJson } from '@/lib/limited-json';
import { noStoreJson, requestClientAddress } from '@/lib/auth-request';
import {
  isPlausibleMemberEmail,
  normalizeLoginId,
} from '@/lib/password-security';
import { publicNickname } from '@/lib/community';
import { registrationAvailability } from '@/lib/registration-config';
import {
  registrationAllowance,
  existingRegistrationEmail,
  createRegistrationTicket,
  completeRegistration,
} from '@/db/registration';
import { appendSessionCookie } from '@/lib/member-session-cookie';
import { canonicalPublicPath } from '@/lib/site-paths';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return noStoreJson({ error: '送信元を確認できません。' }, { status: 403 });
  let data: Record<string, unknown>;
  try {
    data = await readBoundedJson(request, 5000);
  } catch {
    return noStoreJson(
      { error: '入力内容を確認してください。' },
      { status: 400 },
    );
  }
  try {
    if (
      !(await registrationAllowance('ip:' + requestClientAddress(request), 20))
    )
      return noStoreJson(
        { error: '時間をおいてお試しください。' },
        { status: 429 },
      );
    if (data.action === 'complete') {
      const nickname = publicNickname(data.nickname);
      if (
        !nickname ||
        typeof data.token !== 'string' ||
        typeof data.password !== 'string' ||
        data.terms !== true
      )
        return noStoreJson(
          {
            error: 'ニックネーム、パスワード、規約への同意を確認してください。',
          },
          { status: 400 },
        );
      const session = await completeRegistration({
        token: data.token,
        nickname,
        password: data.password,
      });
      const headers = new Headers();
      appendSessionCookie(headers, {
        request,
        token: session.token,
        expiresAt: session.expiresAt,
      });
      return noStoreJson({ ok: true, next: '/mypage' }, { headers });
    }
    if (data.action !== 'email')
      return noStoreJson(
        { error: '操作を確認してください。' },
        { status: 400 },
      );
    if (!registrationAvailability().email)
      return noStoreJson(
        { error: 'メール登録は準備中です。教科書は登録なしで読めます。' },
        { status: 503 },
      );
    const email = normalizeLoginId(data.email);
    if (!isPlausibleMemberEmail(email))
      return noStoreJson(
        { error: 'メールアドレスを確認してください。' },
        { status: 400 },
      );
    const generic = {
      ok: true,
      message:
        '確認メールを送信しました。登録済みの場合はログインからお進みください。',
    };
    if (
      !(await registrationAllowance('email:' + email, 3)) ||
      (await existingRegistrationEmail(email))
    )
      return noStoreJson(generic);
    const token = await createRegistrationTicket(email);
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + env.AUTH_EMAIL_API_KEY,
        'Content-Type': 'application/json',
        'Idempotency-Key': token,
      },
      body: JSON.stringify({
        from: env.AUTH_EMAIL_FROM,
        to: [email],
        subject: 'AIstock の無料会員登録を続ける',
        text:
          'AIstockへようこそ。次のリンクから、30分以内に登録を完了してください。\n\n' +
          canonicalPublicPath('/join?ticket=' + token) +
          '\n\nこのメールに心当たりがなければ、何もせず閉じてください。\n運営：MON-ai',
      }),
    });
    if (!response.ok)
      throw new Error(
        '確認メールを送信できませんでした。しばらくしてからお試しください。',
      );
    return noStoreJson(generic);
  } catch (error) {
    return noStoreJson(
      {
        error:
          error instanceof Error && /。/.test(error.message)
            ? error.message
            : '登録を完了できませんでした。しばらくしてからお試しください。',
      },
      { status: 400 },
    );
  }
}
