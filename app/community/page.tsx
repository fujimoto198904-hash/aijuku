import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { CommunityFeed } from '@/components/community-feed';
import { isCommunityKind } from '@/lib/community';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'みんなの投稿｜AIstock',
  description:
    '質問、便利な使い方、勉強の記録。みんなで学ぶ無料AIコミュニティ。',
};
export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; page?: string }>;
}) {
  const params = await searchParams;
  const kind = isCommunityKind(params.kind) ? params.kind : undefined;
  const page = Math.max(
    1,
    Math.min(1000, Math.floor(Number(params.page) || 1)),
  );
  return (
    <>
      <SiteHeader />
      <CommunityFeed kind={kind} page={page} />
      <SiteFooter />
    </>
  );
}
