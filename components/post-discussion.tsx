'use client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  lazy,
  Suspense,
  type ReactNode,
} from 'react';
import { MessageCircle, X } from 'lucide-react';
const CommunityForm = lazy(() =>
  import('@/components/community-form').then((module) => ({
    default: module.CommunityForm,
  })),
);
const CommunityDelete = lazy(() =>
  import('@/components/community-form').then((module) => ({
    default: module.CommunityDelete,
  })),
);
import { CommunityBody } from '@/components/community-body';
import { CommunityAuthor } from '@/components/community-author';
import { withSiteBasePath } from '@/lib/site-paths';
import type { CommunityThread } from '@/lib/community-thread';

const DiscussionContext = createContext<{
  open: boolean;
  id: string;
  count: number;
  toggle: (trigger: HTMLButtonElement) => void;
} | null>(null);

export function PostCommentButton({ caption = false }: { caption?: boolean }) {
  const discussion = useContext(DiscussionContext);
  if (!discussion) return null;
  return (
    <button
      type="button"
      onClick={(event) => discussion.toggle(event.currentTarget)}
      aria-expanded={discussion.open}
      aria-controls={discussion.id}
      aria-label={caption ? undefined : 'この投稿のコメントを開く'}
      className={
        caption ? 'as-caption-link as-comment-trigger' : 'as-icon-button'
      }
    >
      {caption ? (
        discussion.count ? (
          `コメント${discussion.count}件`
        ) : (
          'コメントする'
        )
      ) : (
        <MessageCircle size={24} aria-hidden="true" />
      )}
    </button>
  );
}

export function PostDiscussion({
  postId,
  initialCount = 0,
  children,
}: {
  postId: string;
  initialCount?: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<CommunityThread | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const request = useRef<AbortController | null>(null);
  const requestedPage = useRef<number | 'last'>(1);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const id = 'comments-' + postId;
  const load = useCallback(
    async (page: number | 'last' = 1) => {
      requestedPage.current = page;
      request.current?.abort();
      const controller = new AbortController();
      request.current = controller;
      setBusy(true);
      setError('');
      try {
        const response = await fetch(
          withSiteBasePath('/api/community') +
            '?' +
            new URLSearchParams({ postId, page: String(page) }),
          {
            signal: controller.signal,
            cache: 'no-store',
          },
        );
        const result = (await response.json()) as CommunityThread & {
          error?: string;
        };
        if (controller.signal.aborted) return;
        if (!response.ok) {
          if (response.status === 404) setData(null);
          throw new Error(result.error ?? 'コメントを読み込めませんでした。');
        }
        if (!controller.signal.aborted) setData(result);
      } catch (e) {
        if (!controller.signal.aborted)
          setError(
            e instanceof Error ? e.message : 'コメントを読み込めませんでした。',
          );
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    },
    [postId],
  );
  useEffect(() => {
    // A login return hash is browser-only. Open after hydration, not during SSR.
    const frame = requestAnimationFrame(() => {
      if (window.location.hash === '#' + id) {
        setOpen(true);
        void load();
      }
    });
    return () => {
      cancelAnimationFrame(frame);
      request.current?.abort();
    };
  }, [id, load]);
  function toggle(button: HTMLButtonElement) {
    trigger.current = button;
    if (!open) void load(requestedPage.current);
    setOpen(!open);
  }
  function signIn(consent = false) {
    const returnTo =
      window.location.pathname + window.location.search + '#' + id;
    window.location.assign(
      withSiteBasePath(consent ? '/mypage/onboarding' : '/login') +
        '?return_to=' +
        encodeURIComponent(returnTo),
    );
  }
  return (
    <DiscussionContext.Provider
      value={{ open, id, count: data?.replyCount ?? initialCount, toggle }}
    >
      {children}
      <section
        id={id}
        hidden={!open}
        className="as-inline-comments"
        aria-label="この投稿のコメント"
      >
        <header className="as-inline-comments-heading">
          <h3>コメント{data ? ` ${data.replyCount}件` : ''}</h3>
          <button
            type="button"
            className="as-icon-button"
            aria-label="コメントを閉じる"
            onClick={() => {
              setOpen(false);
              trigger.current?.focus();
            }}
          >
            <X size={18} />
          </button>
        </header>
        {notice && <output className="as-comments-notice">{notice}</output>}
        {busy && <output className="as-comments-notice">読み込み中…</output>}
        {error && (
          <div role="alert" className="as-comments-error">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void load(requestedPage.current)}
            >
              もう一度読み込む
            </button>
          </div>
        )}
        {data && (
          <Suspense
            fallback={
              <p className="as-comments-notice">入力欄を開いています…</p>
            }
          >
            <div className="as-inline-replies" aria-busy={busy}>
              {data.replies.map((reply) => (
                <article key={reply.id} className="as-inline-reply">
                  <CommunityAuthor
                    name={reply.authorName}
                    role={reply.authorRole}
                  />
                  <p>
                    <CommunityBody body={reply.body} />
                  </p>
                  {reply.canDelete && (
                    <CommunityDelete
                      id={reply.id}
                      target="reply"
                      postId={postId}
                      onRemoved={() => void load(data.page)}
                    />
                  )}
                </article>
              ))}
            </div>
            {data.pages > 1 && (
              <nav className="as-comments-pages" aria-label="コメントのページ">
                <button
                  type="button"
                  disabled={busy || data.page <= 1}
                  onClick={() => void load(data.page - 1)}
                >
                  前のコメント
                </button>
                <span>
                  {data.page} / {data.pages}
                </span>
                <button
                  type="button"
                  disabled={busy || data.page >= data.pages}
                  onClick={() => void load(data.page + 1)}
                >
                  次のコメント
                </button>
              </nav>
            )}
            {data.canReply ? (
              <CommunityForm
                postId={postId}
                isStaff={data.isStaff}
                publicProfile={data.publicProfile}
                defaultNickname={data.defaultNickname}
                onReplySaved={() => {
                  setNotice('コメントしました。');
                  void load('last');
                }}
              />
            ) : (
              <div className="as-comments-signin">
                <p>{data.notice}</p>
                {data.needsLogin && (
                  <button type="button" onClick={() => signIn()}>
                    ログインしてコメントする
                  </button>
                )}
                {data.needsConsent && (
                  <button type="button" onClick={() => signIn(true)}>
                    会員情報を確認する
                  </button>
                )}
              </div>
            )}
          </Suspense>
        )}
      </section>
    </DiscussionContext.Provider>
  );
}
