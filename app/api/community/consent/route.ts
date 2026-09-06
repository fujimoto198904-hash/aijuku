import { getChatGPTUser } from '@/app/chatgpt-auth';
import {
  registerMember,
  getMember,
  membershipTermsVersion,
  privacyPolicyVersion,
} from '@/db/membership';
import { isSameOriginRequest } from '@/lib/request-security';
import { readBoundedJson } from '@/lib/limited-json';
import { publicNickname } from '@/lib/community';
import { noStoreJson } from '@/lib/auth-request';
import { ownSocialProfile } from '@/db/social';
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
    const profile = await ownSocialProfile(user.userId);
    const name = publicNickname(data.nickname);
    if ((!profile && !name) || data.accepted !== true)
      return noStoreJson(
        { error: '名前と同意を確認してください。' },
        { status: 400 },
      );
    if (profile) {
      // Consent is not a second profile editor. Read the current name atomically.
      const now = Date.now();
      await env.DB.prepare(
        `UPDATE members SET display_name=COALESCE((SELECT name FROM social_profiles WHERE member_id=?),display_name),terms_version=?,terms_accepted_at=?,privacy_version=?,privacy_accepted_at=?,updated_at=? WHERE id=? AND status='active'`,
      )
        .bind(
          user.userId,
          membershipTermsVersion,
          now,
          privacyPolicyVersion,
          now,
          now,
          user.userId,
        )
        .run();
    } else {
      await registerMember({ user, displayName: name! });
    }
    return noStoreJson({ ok: true });
  } catch {
    return noStoreJson({ error: '保存できませんでした。' }, { status: 400 });
  }
}
import { env } from 'cloudflare:workers';
