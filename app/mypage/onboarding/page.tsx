import { requireChatGPTUser } from '@/app/chatgpt-auth';
import { getMember, hasCurrentMembershipConsent } from '@/db/membership';
import { ownSocialProfile } from '@/db/social';
import { CommunityConsent } from '@/components/community-consent';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { paidServicesEnabled } from '@/lib/site-features';
import PaidOnboarding from '@/features/paid-school/onboarding-page';
import Link from '@/components/site-link';
import { redirect } from 'next/navigation';
import { isVercelRuntime, canonicalMemberUrl } from '@/lib/site-runtime';
import { registrationReturnTo } from '@/lib/username-registration';
import { withSiteBasePath } from '@/lib/site-paths';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: '参加の準備｜AIstock',
  robots: { index: false, follow: false },
};
export default async function Onboarding(
  props: Parameters<typeof PaidOnboarding>[0],
) {
  if (paidServicesEnabled) return <PaidOnboarding {...props} />;
  if (isVercelRuntime()) {
    const params = await props.searchParams;
    const returnTo = registrationReturnTo(params?.return_to ?? '/mypage');
    redirect(
      canonicalMemberUrl(
        '/mypage/onboarding?return_to=' +
          encodeURIComponent(returnTo) +
          (params?.mode === 'edit' ? '&mode=edit' : ''),
      ),
    );
  }
  return <Content searchParams={props.searchParams} />;
}
async function Content({ searchParams }: Parameters<typeof PaidOnboarding>[0]) {
  const params = await searchParams;
  const returnTo = registrationReturnTo(params?.return_to ?? '/mypage');
  const user = await requireChatGPTUser(
    '/mypage/onboarding?return_to=' +
      encodeURIComponent(returnTo) +
      (params?.mode === 'edit' ? '&mode=edit' : ''),
  );
  const member = await getMember(user.userId);
  if (
    member?.status === 'active' &&
    hasCurrentMembershipConsent(member) &&
    !user.isDemo &&
    params?.mode !== 'edit' &&
    !returnTo.startsWith('/mypage/onboarding')
  )
    redirect(withSiteBasePath(returnTo));
  const profile = await ownSocialProfile(user.userId);
  return (
    <>
      <SiteHeader signedIn />
      <main id="main-content" className="as-profile-setup">
        <header>
          <p className="as-step-label">参加の準備</p>
          <h1>あと少しで、始められます。</h1>
          <p>
            名前と利用規約を確認したら、元の画面へ戻ります。プロフィールの公開はあとから選べます。
          </p>
        </header>
        {member && member.status === 'active' && !user.isDemo ? (
          <CommunityConsent
            name={profile?.name ?? member.displayName}
            hasProfile={!!profile}
            returnTo={returnTo}
          />
        ) : (
          <p className="mt-6 leading-8">
            このアカウントでは手続きを進められません。
            <Link className="text-sapphire" href="/login">
              ログイン画面へ戻る
            </Link>
          </p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
