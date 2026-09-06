import Link from '@/components/site-link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { SocialProfileSettings } from '@/components/social-actions';
import { requireSocialMember } from '@/lib/social-member';
import { ownSocialProfile } from '@/db/social';
import { getMember } from '@/db/membership';
import { registrationReturnTo } from '@/lib/username-registration';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'プロフィールの準備｜AIstock',
  robots: { index: false, follow: false },
};
export default async function ProfileSetup({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string }>;
}) {
  const params = await searchParams;
  const returnTo = registrationReturnTo(params.return_to ?? '/mypage');
  const user = await requireSocialMember(
    '/mypage/profile?return_to=' + encodeURIComponent(returnTo),
  );
  const [profile, member] = await Promise.all([
    ownSocialProfile(user.userId),
    getMember(user.userId),
  ]);
  return (
    <>
      <SiteHeader signedIn />
      <main id="main-content" className="as-profile-setup">
        <Link href={returnTo} className="as-back">
          ← 戻る
        </Link>
        <header>
          <p className="as-step-label">プロフィールの準備</p>
          <h1>どんな人か、ひと目で。</h1>
          <p>
            メッセージを始めるなら「プロフィールを公開する」をオンにして保存。受信の許可は別に選べます。
          </p>
        </header>
        <SocialProfileSettings
          profile={profile}
          displayName={member?.displayName ?? ''}
          readOnly={!!user.isDemo}
          returnTo={returnTo}
        />
        <Link href="/" className="as-text-button">
          あとで設定して、フィードを見る
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
