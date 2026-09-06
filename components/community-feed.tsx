import Link from '@/components/site-link';
import Image from 'next/image';
import {
  ArrowUpRight,
  Bookmark,
  BookOpen,
  Sparkles,
  ArrowRight,
  Mail,
  Check,
  ListChecks,
  Table2,
  PanelsTopLeft,
} from 'lucide-react';
import {
  officialPosts,
  findOfficialPost,
  type OfficialPost,
} from '@/lib/official-posts';
import { CommunityAuthor } from '@/components/community-author';
import { PostStock } from '@/components/post-stock';
import { getPostStockViewer } from '@/lib/post-stock-viewer';
import { postLikeStates, ownSocialProfile } from '@/db/social';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { PostReactions } from '@/components/social-actions';
import { SocialAvatar, AccountBadge } from '@/components/social-avatar';
import {
  mixLearningFeed,
  communityFeedPath,
  followingEmptyState,
  spreadFeedAuthors,
} from '@/lib/social-feed';
import { findTextbookTask } from '@/lib/textbook-catalog';
import { textbookLessonPath } from '@/lib/textbook-routes';
import { listCommunityPosts, type CommunityPost } from '@/db/community';
import { communityLabels, type CommunityKind } from '@/lib/community';
import { withSiteBasePath } from '@/lib/site-paths';
import { FeedPostBody } from '@/components/feed-post-body';
import {
  PostDiscussion,
  PostCommentButton,
} from '@/components/post-discussion';
import { communityPostTitle } from '@/lib/community-composer';
import { postCardAnchor } from '@/lib/post-navigation';
import { PostReturnNotice } from '@/components/post-return-notice';
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
        <span className="as-photo-topic">{post.topic}</span>
        <span className="as-photo-note">教材の説明用イメージ</span>
      </div>
    );
  return (
    <div className={'as-post-visual visual-' + post.visual}>
      <span className="as-visual-label">{post.topic}の小さな一歩</span>
      <div className="as-visual-document">
        {post.visual === 'email' ? (
          <>
            <span className="as-example-heading">
              <Mail size={17} aria-hidden="true" /> メールの下書き · 例
            </span>
            <div className="as-memo-example">火曜15時 OK。資料ありがとう。</div>
            <span className="as-example-flow">
              <ArrowRight size={15} aria-hidden="true" /> 相手に伝わる言葉へ
            </span>
            <p className="as-email-example">
              資料をお送りいただき、ありがとうございます。
              <br />
              火曜日の15時に、よろしくお願いいたします。
            </p>
          </>
        ) : post.visual === 'sheet' ? (
          <>
            <span className="as-example-heading">
              <Table2 size={17} aria-hidden="true" /> 売上の見える化 · 例
            </span>
            <table className="as-example-table">
              <caption className="sr-only">練習用の売上例、金額は円</caption>
              <thead>
                <tr>
                  <th scope="col">商品</th>
                  <th scope="col">売上</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">サンプル A</th>
                  <td>12,000</td>
                </tr>
                <tr>
                  <th scope="row">サンプル B</th>
                  <td>8,500</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">合計</th>
                  <td>20,500</td>
                </tr>
              </tfoot>
            </table>
            <div className="as-example-bars" aria-hidden="true">
              <span />
              <span />
            </div>
          </>
        ) : post.visual === 'meeting' ? (
          <>
            <span className="as-example-heading">
              <ListChecks size={17} aria-hidden="true" /> 会議の整理 · 例
            </span>
            <div className="as-meeting-example">
              <div>
                <span>目的</span>
                <p>お知らせの準備</p>
              </div>
              <div>
                <span>話したこと</span>
                <p>伝え方と日程</p>
              </div>
              <div>
                <span>
                  <Check size={13} aria-hidden="true" /> 結論
                </span>
                <p>まず下書きを作る</p>
              </div>
              <div>
                <span>未決</span>
                <p>公開日は確認する</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <span className="as-example-heading">
              <PanelsTopLeft size={17} aria-hidden="true" /> 最初の画面を比べる
              · 例
            </span>
            <div className="as-web-examples">
              {['写真で伝える', '言葉で伝える', '特徴を並べる'].map(
                (label, index) => (
                  <div
                    className={'as-web-example example-' + index}
                    key={label}
                  >
                    <span className="as-browser-bar" aria-hidden="true">
                      •••
                    </span>
                    <div className="as-wireframe" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </div>
                    <strong>{label}</strong>
                  </div>
                ),
              )}
            </div>
          </>
        )}
      </div>
      <span className="as-visual-note">教材の説明用イメージ</span>
    </div>
  );
}
type CardStockProps = {
  canSave?: boolean;
  initialSaved?: boolean;
  likeState?: { count: number; liked: boolean };
};
function PostCardActions({
  postRef,
  detailHref,
  official = false,
  lessonHref,
  canSave,
  initialSaved,
  likeState,
}: CardStockProps & {
  postRef: string;
  detailHref: string;
  official?: boolean;
  lessonHref?: string;
}) {
  return (
    <div className="as-social-actions">
      <PostReactions
        postRef={postRef}
        returnAnchor={postCardAnchor(postRef)}
        path={detailHref}
        canInteract={canSave}
        commentControl={<PostCommentButton />}
        {...likeState}
      />
      {(official || lessonHref) && (
        <Link
          href={lessonHref ?? detailHref}
          target={lessonHref ? '_blank' : undefined}
          rel={lessonHref ? 'noopener noreferrer' : undefined}
          className="as-social-try"
          aria-label={
            lessonHref
              ? '教材を試す（新しいタブ）'
              : official
                ? 'この教材の作り方と準備を見る'
                : '投稿の続きを見る'
          }
          title={lessonHref ? '教材を試す（新しいタブ）' : undefined}
        >
          {official || lessonHref ? (
            <BookOpen size={24} strokeWidth={1.7} aria-hidden="true" />
          ) : (
            <ArrowUpRight size={24} strokeWidth={1.7} aria-hidden="true" />
          )}
          <span>{lessonHref ? '試す ↗' : official ? '準備' : '読む'}</span>
        </Link>
      )}
      <PostStock
        postRef={postRef}
        returnAnchor={postCardAnchor(postRef)}
        canSave={canSave}
        initialSaved={initialSaved}
        compact
      />
    </div>
  );
}
export function OfficialCard({
  post,
  canSave,
  initialSaved,
  likeState,
}: { post: OfficialPost } & CardStockProps) {
  return (
    <article id={postCardAnchor(post.id)} className="as-post as-official-post">
      <header className="as-post-author">
        <Link href="/u/aitock" aria-label="Aitock公式のプロフィール">
          <SocialAvatar name="Aitock公式" kind="official" />
        </Link>
        <div>
          <strong>
            <Link href="/u/aitock">
              Aitock <AccountBadge kind="official" />
            </Link>
          </strong>
          <span>教科書からのヒント · {post.topic}</span>
        </div>
        <span className="as-level">{post.level}</span>
      </header>
      <PostDiscussion postId={post.id}>
        <div className="as-post-media-link">
          <OfficialVisual post={post} />
        </div>
        <PostCardActions
          postRef={post.id}
          detailHref={'/posts/' + post.id}
          official
          canSave={canSave}
          initialSaved={initialSaved}
          likeState={likeState}
        />
        <div className="as-post-copy">
          <h2>{post.title}</h2>
          <FeedPostBody body={post.body} />
          <PostCommentButton caption />
        </div>
      </PostDiscussion>
    </article>
  );
}
export function LearningRail() {
  return (
    <aside className="as-learning-rail">
      <section className="as-next-card as-rail-start">
        <span className="as-rail-emblem" aria-hidden="true">
          <Sparkles size={23} />
        </span>
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

export function MemberPostCard({
  post,
  canSave,
  initialSaved,
  likeState,
}: { post: CommunityPost } & CardStockProps) {
  const actions = (
    <PostCardActions
      postRef={post.id}
      detailHref={'/community/' + post.id}
      lessonHref={
        post.taskId && findTextbookTask(post.taskId)
          ? textbookLessonPath(post.taskId)
          : undefined
      }
      canSave={canSave}
      initialSaved={initialSaved}
      likeState={likeState}
    />
  );
  return (
    <article id={postCardAnchor(post.id)} className="as-post">
      <header className="as-post-author">
        {post.profileHandle ? (
          <Link
            href={'/u/' + post.profileHandle}
            aria-label={post.authorName + 'のプロフィール'}
          >
            <SocialAvatar
              name={post.authorName}
              kind={post.profileKind}
              avatar={post.avatar}
            />
          </Link>
        ) : (
          <SocialAvatar name={post.authorName} />
        )}
        <div>
          {post.profileHandle ? (
            <Link
              href={'/u/' + post.profileHandle}
              className="as-post-identity"
            >
              <strong>{post.authorName}</strong>{' '}
              <AccountBadge kind={post.profileKind} />
            </Link>
          ) : (
            <CommunityAuthor role={post.authorRole} name={post.authorName} />
          )}
          <span>
            {communityLabels[post.kind]} ·{' '}
            {post.exampleDate
              ? '投稿例 · 設定日 ' + post.exampleDate
              : new Date(post.createdAt).toLocaleDateString('ja-JP', {
                  timeZone: 'Asia/Tokyo',
                })}
          </span>
        </div>
      </header>
      <PostDiscussion postId={post.id} initialCount={post.replyCount}>
        {post.mediaId && (
          <div className="as-post-photo">
            <Image
              src={withSiteBasePath('/media/' + post.mediaId)}
              alt="投稿者が添付した画像"
              width={1000}
              height={1000}
              sizes="(min-width: 1050px) 560px, 100vw"
              unoptimized
            />
          </div>
        )}
        {post.mediaId ? actions : null}
        <div className="as-post-copy">
          <h2
            className={
              post.title === communityPostTitle(post.body)
                ? 'sr-only'
                : undefined
            }
          >
            {post.title}
          </h2>
          <FeedPostBody body={post.body} />
          <PostCommentButton caption />
        </div>
        {!post.mediaId ? actions : null}
      </PostDiscussion>
    </article>
  );
}
export async function CommunityFeed({
  kind: requestedKind,
  page = 1,
  view = 'all',
}: { kind?: CommunityKind; page?: number; view?: string } = {}) {
  // 教材紹介は「便利な使い方」のみ。別タブの種類条件は持ち込まない。
  const kind = view === 'textbook' ? undefined : requestedKind;
  const user = await getChatGPTUser();
  const me =
    (view === 'following' || view === 'all') && user && !user.isDemo
      ? await ownSocialProfile(user.userId)
      : null;
  const [feed, viewer] = await Promise.all([
    view === 'textbook' || (view === 'following' && !me)
      ? Promise.resolve({ posts: [], hasMore: false })
      : listCommunityPosts(kind, page, undefined, '', {
          source: view,
          following: view === 'following' ? me?.handle : undefined,
          prioritizeFollowing: view === 'all' ? me?.handle : undefined,
        }),
    getPostStockViewer(),
  ]);
  const composeHref = '/community/new' + (kind ? '?kind=' + kind : '');
  const official =
    (view === 'all' || view === 'textbook') && (!kind || kind === 'tip')
      ? view === 'textbook'
        ? officialPosts
        : [
            ...officialPosts.slice(((page - 1) * 3) % officialPosts.length),
            ...officialPosts.slice(0, ((page - 1) * 3) % officialPosts.length),
          ].slice(0, Math.max(1, Math.ceil(feed.posts.length / 3)))
      : [];
  const likes = await postLikeStates(
    [...feed.posts.map((p) => p.id), ...official.map((p) => p.id)],
    user?.isDemo ? undefined : user?.userId,
  );
  const items = mixLearningFeed(
    view === 'all' ? spreadFeedAuthors(feed.posts) : feed.posts,
    official,
  ).map((item) =>
    item.type === 'member' && !findOfficialPost(item.value.id) ? (
      <MemberPostCard
        key={item.value.id}
        post={item.value as CommunityPost}
        canSave={viewer.canSave}
        initialSaved={viewer.savedRefs.has(item.value.id)}
        likeState={likes[item.value.id]}
      />
    ) : (
      <OfficialCard
        key={item.value.id}
        post={
          item.type === 'guide' ? item.value : findOfficialPost(item.value.id)!
        }
        canSave={viewer.canSave}
        initialSaved={viewer.savedRefs.has(item.value.id)}
        likeState={likes[item.value.id]}
      />
    ),
  );
  const pageHref = (p: number) => communityFeedPath(view, kind, p);
  const followingEmpty = followingEmptyState({
    signedIn: !!user && !user.isDemo,
    publicProfile: !!me?.isPublic,
    kind,
    page,
  });
  return (
    <main id="main-content" className="as-feed-layout as-social-feed">
      <div className="as-feed-main">
        <h1 className="sr-only">みんなの投稿</h1>
        <PostReturnNotice
          visibleRefs={[
            ...feed.posts.map((p) => p.id),
            ...official.map((p) => p.id),
          ]}
        />
        <div className="as-feed-list">{items}</div>
        {!items.length &&
          (view === 'following' ? (
            <section className="as-panel as-feed-empty">
              <h2>{followingEmpty.title}</h2>
              <p>{followingEmpty.body}</p>
              <Link href={followingEmpty.href} className="as-secondary">
                {followingEmpty.label} →
              </Link>
            </section>
          ) : (
            <section className="as-panel">
              <h2>まだ投稿はありません。</h2>
              <p>
                最初の「やってみた」も、困ったことも。ここから話してみませんか。
              </p>
              <Link href={composeHref} className="as-secondary">
                投稿を書く →
              </Link>
            </section>
          ))}
        <nav className="as-action-row" aria-label="フィードのページ">
          {page > 1 && <Link href={pageHref(page - 1)}>← 前へ</Link>}
          {feed.hasMore && <Link href={pageHref(page + 1)}>もっと見る →</Link>}
        </nav>
        {!!items.length && (
          <p className="as-feed-end">
            {!feed.hasMore && 'ここまでが今回の投稿です。'}
            <br />
            <Link href={composeHref}>あなたの発見も、聞かせてください。</Link>
          </p>
        )}
      </div>
      <LearningRail />
    </main>
  );
}
