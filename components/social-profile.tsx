import Link from '@/components/site-link';
import Image from 'next/image';
import type { CommunityPost } from '@/db/community';
import type { SocialProfile } from '@/db/social';
import { SocialAvatar, AccountBadge } from '@/components/social-avatar';
import { officialAiDisclosure } from '@/lib/official-characters';
import { communityLabels } from '@/lib/community';
import { withSiteBasePath } from '@/lib/site-paths';
export function ProfileIdentity({
  profile,
  counts,
  children,
}: {
  profile: SocialProfile;
  counts: { posts: number; followers: number; following: number };
  children?: React.ReactNode;
}) {
  return (
    <header className="as-profile-identity">
      <SocialAvatar
        name={profile.name}
        kind={profile.kind}
        avatar={profile.avatar}
        large
      />
      <div className="as-profile-info">
        <p className="as-profile-handle">
          {profile.handle === 'your-profile'
            ? '自分のプロフィール'
            : '@' + profile.handle}
        </p>
        <h1>
          {profile.name} <AccountBadge kind={profile.kind} />
        </h1>
        <div className="as-profile-counts">
          <span>
            <strong>{counts.posts}</strong> 投稿
          </span>
          {profile.isPublic ? (
            <Link href={'/u/' + profile.handle + '?tab=followers'}>
              <strong>{counts.followers}</strong> フォロワー
            </Link>
          ) : (
            <span>
              <strong>{counts.followers}</strong> フォロワー
            </span>
          )}
          {profile.isPublic ? (
            <Link href={'/u/' + profile.handle + '?tab=following'}>
              <strong>{counts.following}</strong> フォロー中
            </Link>
          ) : (
            <span>
              <strong>{counts.following}</strong> フォロー中
            </span>
          )}
        </div>
        <p className="as-profile-bio">
          {profile.bio || 'やってみたいことから、ひとつずつ。'}
        </p>
        {children}
      </div>
      {profile.kind === 'official_ai' && (
        <p className="as-ai-disclosure">{officialAiDisclosure}</p>
      )}
    </header>
  );
}
export function ProfilePostGrid({
  posts,
  empty = 'まだ投稿はありません。',
}: {
  posts: CommunityPost[];
  empty?: string;
}) {
  return posts.length ? (
    <div className="as-profile-grid">
      {posts.map((p) => (
        <Link
          className={'as-profile-tile tile-' + p.kind}
          key={p.id}
          href={
            (p.id.startsWith('official-') ? '/posts/' : '/community/') + p.id
          }
        >
          {p.mediaId ? (
            <Image
              src={withSiteBasePath('/media/' + p.mediaId)}
              alt=""
              width={500}
              height={500}
              sizes="(min-width:1050px) 280px, 33vw"
              unoptimized
            />
          ) : null}
          <div className="as-tile-copy">
            <span>
              {communityLabels[p.kind]}{' '}
              {p.profileKind === 'official_ai' ? '· 公式AI' : null}
            </span>
            <h2>{p.title}</h2>
            <small>{p.replyCount} コメント</small>
          </div>
        </Link>
      ))}
    </div>
  ) : (
    <div className="as-profile-empty">
      <h2>{empty}</h2>
      <p>小さな発見も、途中の疑問も、残していこう。</p>
      <Link className="as-secondary" href="/community/new">
        最初の投稿を書く
      </Link>
    </div>
  );
}
export function MemberDirectory({ profiles }: { profiles: SocialProfile[] }) {
  return (
    <div className="as-member-directory">
      {profiles.map((p) => (
        <Link
          href={'/u/' + p.handle}
          key={p.handle}
          className="as-directory-person"
        >
          <SocialAvatar name={p.name} kind={p.kind} avatar={p.avatar} />
          <div>
            <strong>{p.name}</strong> <AccountBadge kind={p.kind} />
            <p>{p.bio}</p>
          </div>
          <span aria-hidden="true">↗</span>
        </Link>
      ))}
    </div>
  );
}
