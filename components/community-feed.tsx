import Link from '@/components/site-link';
import Image from 'next/image';
import {
  ArrowUpRight,
  Bookmark,
  BookOpen,
  MessageCircle,
  Plus,
  Sparkles,
} from 'lucide-react';
import { officialPosts, type OfficialPost } from '@/lib/official-posts';
import { CommunityAuthor } from '@/components/community-author';
import { listCommunityPosts, type CommunityPost } from '@/db/community';
import { communityLabels, type CommunityKind } from '@/lib/community';
import { withSiteBasePath } from '@/lib/site-paths';
import cafePhoto from '@/sozai/cafe-shokuba-3nin.jpg';
import travelPhoto from '@/sozai/kazoku-sougen.jpg';
export function OfficialVisual({ post }: { post: OfficialPost }) {
  if (post.visual === 'image' || post.visual === 'travel')
    return (
      <div className={'as-post-photo photo-' + post.visual}>
        <Image
          src={post.visual === 'image' ? cafePhoto : travelPhoto}
          alt={
            post.visual === 'image'
              ? 'カフェで過ごす人たち。教材の説明用イメージ。'
              : '草原で過ごす家族。旅行教材の説明用イメージ。'
          }
          sizes="(min-width: 1050px) 560px, 100vw"
          width={960}
          height={640}
        />
        <span>教材の説明用イメージ</span>
      </div>
    );
  return (
    <div className={'as-post-visual visual-' + post.visual}>
      <span className="as-visual-label">教科書でつくるもの</span>
      <div className="as-visual-document">
        {post.visual === 'email' ? (
          <>
            <span>返信の下書き</span>
            <strong>
              伝えたいことを、
              <br />
              ちゃんと伝わる言葉に。
            </strong>
            <i />
            <i />
            <i />
          </>
        ) : post.visual === 'sheet' ? (
          <>
            <span>売上データを整理</span>
            <strong>
              「この数字、何だろう？」
              <br />
              から始めよう。
            </strong>
            <div className="as-mini-table">
              <b>日付</b>
              <b>商品</b>
              <b>売上</b>
              <span>04.01</span>
              <span>サンプル A</span>
              <span>12,000</span>
              <span>04.02</span>
              <span>サンプル B</span>
              <span>8,500</span>
            </div>
          </>
        ) : post.visual === 'meeting' ? (
          <>
            <span>会議のあとに</span>
            <strong>
              決まったこと。
              <br />
              まだ決まっていないこと。
            </strong>
            <div className="as-checkline">✓ 結論を確認</div>
            <div className="as-checkline">✓ 未決事項を確認</div>
          </>
        ) : (
          <>
            <span>{post.topic}のアイデア</span>
            <strong>{post.title}</strong>
            <p>考える → 試す → 自分らしく直す</p>
          </>
        )}
      </div>
      <span className="as-visual-note">教材の内容を紹介するイメージです</span>
    </div>
  );
}
export function OfficialCard({ post }: { post: OfficialPost }) {
  return (
    <article className="as-post">
      <header className="as-post-author">
        <span className="as-avatar">✦</span>
        <div>
          <strong>
            MON-ai <span className="as-staff">公式</span>
          </strong>
          <span>教科書からのヒント · {post.topic}</span>
        </div>
        <span className="as-level">{post.level}</span>
      </header>
      <Link href={'/posts/' + post.id} aria-label={post.title}>
        <OfficialVisual post={post} />
      </Link>
      <div className="as-post-copy">
        <h2>
          <Link href={'/posts/' + post.id}>{post.title}</Link>
        </h2>
        <p>{post.body}</p>
        <div className="as-post-actions">
          <Link href={'/posts/' + post.id} className="as-try">
            自分もやってみる <ArrowUpRight size={18} />
          </Link>
          <Link
            href={
              '/community/new?kind=question&task=' +
              encodeURIComponent(post.taskId)
            }
            aria-label="この課題について質問する"
          >
            <MessageCircle size={22} />
          </Link>
        </div>
      </div>
    </article>
  );
}
export function LearningRail() {
  return (
    <aside className="as-learning-rail">
      <section className="as-next-card">
        <span className="as-eyebrow">AIが初めてなら</span>
        <h2>
          最初の一歩は、
          <br />
          ここから。
        </h2>
        <p>
          開き方から、ひとつずつ。
          <br />
          登録なしで始められます。
        </p>
        <Link href="/learn" className="as-primary">
          はじめてのAI <ArrowUpRight size={17} />
        </Link>
      </section>
      <section className="as-rail-links">
        <h2>自分のペースで学ぼう</h2>
        <Link href="/textbook/explore">
          <BookOpen size={19} />
          教科書を探す
          <ArrowUpRight size={15} />
        </Link>
        <Link href="/textbook/columns">
          <Sparkles size={19} />
          言葉・使い方を調べる
          <ArrowUpRight size={15} />
        </Link>
        <Link href="/mypage">
          <Bookmark size={19} />
          保存したもの・学習記録
          <ArrowUpRight size={15} />
        </Link>
      </section>
      <p className="as-rail-note">
        読む・学ぶのは、いつでも無料。
        <br />
        質問や投稿は無料会員で。
      </p>
    </aside>
  );
}

export function MemberPostCard({ post }: { post: CommunityPost }) {
  return (
    <article className="as-post">
      <header className="as-post-author">
        <span className="as-avatar as-member-avatar">
          {post.authorName.slice(0, 1)}
        </span>
        <div>
          <CommunityAuthor role={post.authorRole} name={post.authorName} />
          <span>
            {communityLabels[post.kind]} ·{' '}
            {new Date(post.createdAt).toLocaleDateString('ja-JP', {
              timeZone: 'Asia/Tokyo',
            })}
          </span>
        </div>
      </header>
      {post.mediaId && (
        <Link href={'/community/' + post.id} className="as-post-photo">
          <Image
            src={withSiteBasePath('/media/' + post.mediaId)}
            alt="投稿者が添付した画像"
            width={1000}
            height={1000}
            sizes="(min-width: 1050px) 560px, 100vw"
            unoptimized
          />
        </Link>
      )}
      <div className="as-post-copy">
        <h2>
          <Link href={'/community/' + post.id}>{post.title}</Link>
        </h2>
        <p className="as-user-excerpt">{post.body}</p>
        <div className="as-post-actions">
          <Link href={'/community/' + post.id} className="as-try">
            続きを見る <ArrowUpRight size={18} />
          </Link>
          <Link
            href={'/community/' + post.id + '#replies'}
            className="as-reply-count"
          >
            <MessageCircle size={20} />
            {post.replyCount}件の返信
          </Link>
        </div>
      </div>
    </article>
  );
}
export async function CommunityFeed({
  kind,
  page = 1,
}: { kind?: CommunityKind; page?: number } = {}) {
  const feed = await listCommunityPosts(kind, page);
  const composeHref = '/community/new' + (kind ? '?kind=' + kind : '');
  const official = page === 1 && (!kind || kind === 'tip') ? officialPosts : [];
  // Real member posts come first. Official guides fill the initial feed, explicitly labelled.
  const items: React.ReactNode[] = [];
  const max = Math.max(feed.posts.length, official.length);
  for (let i = 0; i < max; i++) {
    if (feed.posts[i])
      items.push(
        <MemberPostCard key={feed.posts[i].id} post={feed.posts[i]} />,
      );
    if (official[i])
      items.push(<OfficialCard key={official[i].id} post={official[i]} />);
  }
  const pageHref = (p: number) =>
    '/community?' +
    new URLSearchParams({ ...(kind ? { kind } : {}), page: String(p) });
  return (
    <main id="main-content" className="as-feed-layout">
      <div className="as-feed-main">
        <header className="as-feed-heading">
          <div>
            <p className="as-eyebrow">AIで、できることが増えていく。</p>
            <h1>みんなの発見</h1>
          </div>
          <Link
            href={composeHref}
            className="as-compose"
            aria-label="投稿を書く"
          >
            <Plus size={22} />
          </Link>
        </header>
        <nav aria-label="投稿の種類" className="as-feed-tabs">
          {[
            [undefined, 'すべて'],
            ['tip', '便利な使い方'],
            ['learning', 'できたこと'],
            ['question', '質問'],
          ].map(([k, label]) => (
            <Link
              key={k ?? 'all'}
              href={k ? '/community?kind=' + k : '/'}
              aria-current={k === kind ? 'page' : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <Link href="/learn" className="as-mobile-start">
          <span>何から始めるか迷ったら</span>
          <strong>
            はじめてのAI <ArrowUpRight size={16} />
          </strong>
        </Link>
        <div className="as-feed-list">{items}</div>
        {!items.length && (
          <section className="as-panel">
            <h2>まだ投稿はありません。</h2>
            <p>
              最初の「やってみた」も、困ったことも。ここから話してみませんか。
            </p>
            <Link href={composeHref} className="as-secondary">
              投稿を書く →
            </Link>
          </section>
        )}
        <nav className="as-action-row" aria-label="フィードのページ">
          {page > 1 && <Link href={pageHref(page - 1)}>← 前へ</Link>}
          {feed.hasMore && <Link href={pageHref(page + 1)}>もっと見る →</Link>}
        </nav>
        <p className="as-feed-end">
          {!feed.hasMore && 'ここまでが今回の投稿です。'}
          <br />
          <Link href={composeHref}>あなたの発見も、聞かせてください。</Link>
        </p>
      </div>
      <LearningRail />
    </main>
  );
}
