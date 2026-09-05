import { notFound } from 'next/navigation';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import Link from '@/components/site-link';
import {
  ProfileIdentity,
  ProfilePostGrid,
  MemberDirectory,
} from '@/components/social-profile';
import { ProfileActions, ReportButton } from '@/components/social-actions';
import {
  publicSocialProfile,
  socialCounts,
  relationship,
  followList,
} from '@/db/social';
import { listCommunityPosts } from '@/db/community';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'プロフィール｜AIstock' };
export default async function PublicProfile({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const { handle } = await params,
    query = await searchParams;
  const profile = await publicSocialProfile(handle);
  if (!profile) notFound();
  const tab =
    query.tab === 'following' || query.tab === 'followers'
      ? query.tab
      : 'posts';
  const page = Math.max(1, Math.min(1000, Math.floor(Number(query.page) || 1)));
  const [counts, user, feed, people] = await Promise.all([
    socialCounts(handle),
    getChatGPTUser(),
    tab === 'posts'
      ? listCommunityPosts(undefined, page, undefined, '', {
          profileHandle: handle,
        })
      : null,
    tab !== 'posts' ? followList(handle, tab, page) : null,
  ]);
  const relation = await relationship(user?.userId, handle);
  const hasMore = feed?.hasMore || people?.hasMore;
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="as-profile-page">
        <ProfileIdentity profile={profile} counts={counts}>
          <ProfileActions
            handle={handle}
            relation={relation}
            canInteract={!!user && !user.isDemo}
          />
        </ProfileIdentity>
        {profile.kind !== 'member' && (
          <p className="as-private-note">
            {profile.kind === 'official_ai'
              ? '架空の投稿例と教材のヒントを届ける、運営管理のAIキャラクターです。'
              : 'Aitockの教材紹介アカウントです。運営：MON-ai。'}{' '}
            このアカウントはDMを受け付けていません。
          </p>
        )}
        <nav className="as-profile-tabs" aria-label="プロフィールの表示">
          {[
            ['posts', '投稿'],
            ['followers', 'フォロワー'],
            ['following', 'フォロー中'],
          ].map(([key, label]) => (
            <Link
              aria-current={tab === key ? 'page' : undefined}
              key={key}
              href={'/u/' + handle + '?tab=' + key}
            >
              {label}
            </Link>
          ))}
        </nav>
        {feed ? (
          <ProfilePostGrid posts={feed.posts} />
        ) : (
          <>
            <MemberDirectory profiles={people?.profiles ?? []} />
            {!people?.profiles.length && (
              <p className="as-profile-empty">まだつながりはありません。</p>
            )}
          </>
        )}
        <nav className="as-action-row" aria-label="プロフィールのページ">
          {page > 1 && (
            <Link href={'/u/' + handle + '?tab=' + tab + '&page=' + (page - 1)}>
              ← 前へ
            </Link>
          )}
          {hasMore && (
            <Link href={'/u/' + handle + '?tab=' + tab + '&page=' + (page + 1)}>
              もっと見る →
            </Link>
          )}
        </nav>
        {user && !user.isDemo && !relation.self && (
          <ReportButton targetType="profile" target={handle} />
        )}
      </main>
      <SiteFooter />
    </>
  );
}
