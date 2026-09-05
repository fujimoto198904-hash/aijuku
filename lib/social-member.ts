import { redirect } from 'next/navigation';
import { requireChatGPTUser } from '@/app/chatgpt-auth';
import { getMember, hasCurrentMembershipConsent } from '@/db/membership';
import { withSiteBasePath } from '@/lib/site-paths';
export async function requireSocialMember(path: string) {
  const user = await requireChatGPTUser(path),
    member = await getMember(user.userId);
  if (!member || member.status !== 'active')
    redirect(withSiteBasePath('/login'));
  if (!user.isDemo && !hasCurrentMembershipConsent(member))
    redirect(withSiteBasePath('/mypage/onboarding'));
  return user;
}
