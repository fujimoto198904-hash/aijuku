import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import {
  membershipTermsVersion,
  privacyPolicyVersion,
  getMember,
} from '@/db/membership';
import { isSameOriginRequest } from '@/lib/request-security';
import { readBoundedJson } from '@/lib/limited-json';
import { publicNickname } from '@/lib/community';
import { noStoreJson } from '@/lib/auth-request';
export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return noStoreJson({ error: '送信元を確認できません。' }, { status: 403 });
  const user = await getChatGPTUser();
  if (!user || user.isDemo)
    return noStoreJson({ error: 'ログインしてください。' }, { status: 403 });
  const member = await getMember(user.userId);
  if (member?.status !== 'active')
    return noStoreJson(
      { error: '利用できないアカウントです。' },
      { status: 403 },
    );
  try {
    const data = await readBoundedJson(request, 1500);
    const name = publicNickname(data.nickname);
    if (!name || data.accepted !== true)
      return noStoreJson(
        { error: '名前と同意を確認してください。' },
        { status: 400 },
      );
    const now = Date.now();
    await env.DB.prepare(
      "UPDATE members SET display_name=?,terms_version=?,terms_accepted_at=?,privacy_version=?,privacy_accepted_at=?,updated_at=? WHERE id=? AND status='active'",
    )
      .bind(
        name,
        membershipTermsVersion,
        now,
        privacyPolicyVersion,
        now,
        now,
        user.userId,
      )
      .run();
    return noStoreJson({ ok: true });
  } catch {
    return noStoreJson({ error: '保存できませんでした。' }, { status: 400 });
  }
}
