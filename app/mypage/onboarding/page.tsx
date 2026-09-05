import { requireChatGPTUser } from '@/app/chatgpt-auth';
import { getMember } from '@/db/membership';
import { CommunityConsent } from '@/components/community-consent';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { paidServicesEnabled } from '@/lib/site-features';
import PaidOnboarding from '@/features/paid-school/onboarding-page';
import Link from '@/components/site-link';
import { redirect } from 'next/navigation';
import { isVercelRuntime, canonicalMemberUrl } from '@/lib/site-runtime';
import { registrationReturnTo } from '@/lib/username-registration';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: '参加の準備｜AIstock',
  robots: { index: false, follow: false },
};
export default async function Onboarding(
  props: Parameters<typeof PaidOnboarding>[0],
) {
  if (paidServicesEnabled) return <PaidOnboarding {...props} />;
  if (isVercelRuntime()) redirect(canonicalMemberUrl('/mypage/onboarding'));
  return <Content searchParams={props.searchParams} />;
}
async function Content({ searchParams }: Parameters<typeof PaidOnboarding>[0]) {
  const params = await searchParams;
  const returnTo = registrationReturnTo(params?.return_to ?? '/mypage');
  const user = await requireChatGPTUser(
    '/mypage/onboarding?return_to=' + encodeURIComponent(returnTo),
  );
  const member = await getMember(user.userId);
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="text-3xl font-bold">AIstockへようこそ。</h1>
        {member && member.status === 'active' && !user.isDemo ? (
          <CommunityConsent name={member.displayName} returnTo={returnTo} />
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
