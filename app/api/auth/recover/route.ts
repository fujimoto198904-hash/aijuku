import { getChatGPTUser } from '@/app/chatgpt-auth';
import { registrationAllowance } from '@/db/registration';
import {
  recoverUsernamePassword,
  rotateUsernameRecovery,
} from '@/db/username-registration';
import { noStoreJson, requestClientAddress } from '@/lib/auth-request';
import { readBoundedJson } from '@/lib/limited-json';
import { isSameOriginRequest } from '@/lib/request-security';
import { registrationUsername } from '@/lib/username-registration';

export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return noStoreJson({ error: '送信元を確認できません。' }, { status: 403 });
  try {
    const data = await readBoundedJson(request, 5000);
    if (
      !(await registrationAllowance(
        'recovery-ip:' + requestClientAddress(request),
        15,
      ))
    )
      return noStoreJson(
        { error: '時間をおいてお試しください。' },
        { status: 429 },
      );
    if (typeof data.password !== 'string')
      return noStoreJson(
        { error: 'パスワードを入力してください。' },
        { status: 400 },
      );
    if (data.action === 'rotate') {
      const user = await getChatGPTUser();
      if (!user || user.isDemo)
        return noStoreJson(
          { error: 'ログインしてください。' },
          { status: 401 },
        );
      if (!(await registrationAllowance('recovery-member:' + user.userId, 5)))
        return noStoreJson(
          { error: '時間をおいてお試しください。' },
          { status: 429 },
        );
      const result = await rotateUsernameRecovery({
        memberId: user.userId,
        username: user.loginId,
        password: data.password,
      });
      return noStoreJson({ ok: true, ...result });
    }
    if (data.action !== 'reset')
      return noStoreJson(
        { error: '操作を確認してください。' },
        { status: 400 },
      );
    const username = registrationUsername(data.username);
    if (
      !(await registrationAllowance(
        'recovery-name:' + (username || 'invalid'),
        5,
      ))
    )
      return noStoreJson(
        { error: '時間をおいてお試しください。' },
        { status: 429 },
      );
    const result = await recoverUsernamePassword({
      username,
      code: typeof data.code === 'string' ? data.code.trim() : '',
      password: data.password,
    });
    return noStoreJson({ ok: true, ...result });
  } catch (error) {
    return noStoreJson(
      {
        error:
          error instanceof Error && /。/.test(error.message)
            ? error.message
            : '再設定できませんでした。入力内容を確認してください。',
      },
      { status: 400 },
    );
  }
}
