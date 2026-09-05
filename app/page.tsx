import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { CommunityFeed } from '@/components/community-feed';
import { paidServicesEnabled } from '@/lib/site-features';
import PaidSchoolHome from '@/features/paid-school/home-page';
export const dynamic = 'force-dynamic';
export default function Home() {
  if (paidServicesEnabled) return <PaidSchoolHome />;
  return (
    <>
      <SiteHeader />
      <CommunityFeed />
      <SiteFooter />
    </>
  );
}
