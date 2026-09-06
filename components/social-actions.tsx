'use client';
import { PostImageInput } from '@/components/post-image-input';
import { avatarMediaId } from '@/lib/public-profile';
import { useRef, useState, type SubmitEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Send, MessageCircle } from 'lucide-react';
import Link from '@/components/site-link';
import { withSiteBasePath, canonicalPublicPath } from '@/lib/site-paths';
import type { SocialProfile } from '@/db/social';
export async function socialRequest(data: Record<string, unknown>) {
  const response = await fetch(withSiteBasePath('/api/social'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = (await response.json()) as {
    error?: string;
    count: number;
    liked: boolean;
    next: string;
    profile?: SocialProfile;
  };
  if (!response.ok) throw new Error(result.error || '保存できませんでした。');
  return result;
}
export function ShareButton({ path, title }: { path: string; title?: string }) {
  const [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  async function share() {
    setBusy(true);
    setMessage('');
    const url = ['localhost', '127.0.0.1'].includes(window.location.hostname)
      ? new URL(withSiteBasePath(path), window.location.origin).href
      : canonicalPublicPath(path);
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        setMessage('リンクをコピーしました。');
      }
    } catch (e) {
      if (!(e instanceof Error && e.name === 'AbortError'))
        setMessage('共有できませんでした。ページのURLをコピーしてください。');
    } finally {
      setBusy(false);
    }
  }
  return (
    <span className="as-inline-control">
      <button
        className="as-icon-button"
        type="button"
        aria-label="リンクをシェア"
        disabled={busy}
        onClick={share}
      >
        <Send size={23} />
      </button>
      <output className="sr-only" aria-live="polite">
        {message}
      </output>
    </span>
  );
}
export function PostReactions({
  postRef,
  path,
  canInteract = false,
  count = 0,
  liked = false,
  commentControl,
}: {
  postRef: string;
  path: string;
  canInteract?: boolean;
  count?: number;
  liked?: boolean;
  commentControl?: ReactNode;
}) {
  const [state, setState] = useState({ count, liked }),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function like() {
    if (!canInteract) {
      window.location.assign(
        withSiteBasePath('/login?return_to=' + encodeURIComponent(path)),
      );
      return;
    }
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const r = await socialRequest({
        action: 'like',
        ref: postRef,
        liked: !state.liked,
      });
      setState({ count: r.count, liked: r.liked });
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存できませんでした。');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <span className="as-reaction">
        <button
          className="as-icon-button"
          type="button"
          aria-label={canInteract ? 'いいね' : 'ログインしていいね'}
          aria-pressed={canInteract ? state.liked : undefined}
          disabled={busy}
          onClick={like}
        >
          <Heart size={24} fill={state.liked ? 'currentColor' : 'none'} />
        </button>
        <span aria-live="polite">{state.count > 0 ? state.count : null}</span>
      </span>
      {commentControl ?? (
        <Link
          className="as-icon-button"
          href={path + '#replies'}
          aria-label="コメントを見る"
        >
          <MessageCircle size={24} />
        </Link>
      )}
      <ShareButton path={path} />
      {error && (
        <span className="as-inline-error" role="alert">
          {error}
        </span>
      )}
    </>
  );
}
type Relation = {
  following: boolean;
  blocked: boolean;
  blockedByMe: boolean;
  self: boolean;
  canMessage: boolean;
};
export function ProfileActions({
  handle,
  relation,
  canInteract,
}: {
  handle: string;
  relation: Relation;
  canInteract: boolean;
}) {
  const router = useRouter(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function change(action: 'follow' | 'block') {
    if (!canInteract) {
      window.location.assign(
        withSiteBasePath(
          '/login?return_to=' + encodeURIComponent('/u/' + handle),
        ),
      );
      return;
    }
    setBusy(true);
    setError('');
    try {
      await socialRequest(
        action === 'follow'
          ? { action, target: handle, following: !relation.following }
          : { action, target: handle, blocked: !relation.blockedByMe },
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存できませんでした。');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="as-action-row">
      {relation.self ? (
        <Link className="as-secondary" href="/mypage#account">
          プロフィールを編集
        </Link>
      ) : (
        <>
          {!relation.blocked && (
            <button
              className={relation.following ? 'as-secondary' : 'as-primary'}
              type="button"
              disabled={busy}
              onClick={() => change('follow')}
            >
              {relation.following ? 'フォロー中' : 'フォローする'}
            </button>
          )}
          {relation.canMessage && (
            <Link className="as-secondary" href={'/messages?to=' + handle}>
              メッセージ
            </Link>
          )}
          {canInteract && (
            <button
              className="as-text-button"
              type="button"
              disabled={busy}
              onClick={() => change('block')}
            >
              {relation.blockedByMe ? 'ブロックを解除' : 'ブロック'}
            </button>
          )}
        </>
      )}
      <ShareButton path={'/u/' + handle} />
      {error && (
        <p role="alert" className="as-inline-error">
          {error} <Link href="/mypage#account">プロフィール設定へ</Link>
        </p>
      )}
    </div>
  );
}
export function SocialProfileSettings({
  profile,
  displayName = '',
  readOnly = false,
  returnTo,
}: {
  profile: SocialProfile | null;
  displayName?: string;
  readOnly?: boolean;
  returnTo?: string;
}) {
  const router = useRouter(),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState(false),
    [uploading, setUploading] = useState(false),
    [photo, setPhoto] = useState(avatarMediaId(profile?.avatar)),
    [publicId, setPublicId] = useState(profile?.publicId ?? ''),
    [revision, setRevision] = useState(profile?.revision ?? 0);
  async function save(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (readOnly || busy || uploading) return;
    setBusy(true);
    setMessage('');
    const f = new FormData(e.currentTarget);
    try {
      const result = await socialRequest({
        action: 'profile',
        name: f.get('name'),
        bio: f.get('bio'),
        isPublic: f.get('public') === 'on',
        dmEnabled: f.get('dm') === 'on',
        publicConsent: f.get('consent') === 'on',
        publicId,
        avatarMediaId: photo,
        expectedRevision: revision,
      });
      if (!result.profile)
        throw new Error(
          '保存結果を確認できませんでした。ページを開き直してください。',
        );
      const saved = result.profile;
      setRevision(saved.revision ?? revision + 1);
      setPublicId(saved.publicId ?? publicId);
      setMessage('プロフィールを保存しました。');
      setError(false);
      if (returnTo && saved.isPublic) {
        window.location.assign(withSiteBasePath(returnTo));
        return;
      }
      router.refresh();
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : '保存できませんでした。');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="as-panel" id="profile">
      <h2>プロフィールを編集</h2>
      <p>名前・写真・ユーザーIDを、ここでまとめて変更できます。</p>
      <form className="as-social-form" onSubmit={save}>
        <fieldset disabled={readOnly || busy || uploading}>
          <PostImageInput
            purpose="avatar"
            value={photo}
            onChange={setPhoto}
            onBusy={setUploading}
          />
          <label>
            表示名
            <input
              name="name"
              required
              maxLength={30}
              defaultValue={profile?.name ?? displayName}
              placeholder="ニックネーム"
            />
          </label>
          <label>
            ユーザーID（@）
            <input
              name="publicId"
              value={publicId}
              onChange={(e) => setPublicId(e.target.value.toLowerCase())}
              required
              minLength={3}
              maxLength={24}
              pattern="[a-z0-9][a-z0-9_\-]{2,23}"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="例：ai_sora"
              aria-describedby="profile-id-hint"
            />
          </label>
          <small id="profile-id-hint">
            半角英数字・_・-で3〜24文字。ログインには @
            {publicId || 'ユーザーID'}{' '}
            を使えます。IDを変えても投稿やつながりは残ります。
          </small>
          <label>
            自己紹介
            <textarea
              name="bio"
              maxLength={300}
              rows={3}
              defaultValue={profile?.bio ?? ''}
              placeholder="好きなこと、AIでやってみたいこと。"
            />
          </label>
          <label className="as-check">
            <input
              type="checkbox"
              name="public"
              defaultChecked={!!profile?.isPublic}
            />
            プロフィールを公開する
          </label>
          <label className="as-check">
            <input
              type="checkbox"
              name="dm"
              defaultChecked={!!profile?.dmEnabled}
            />
            会員からのメッセージを受け付ける
          </label>
          <label className="as-check">
            <input type="checkbox" name="consent" />
            表示名・写真・ユーザーID・自己紹介・今後の投稿・フォロー関係を公開してよい
          </label>
          <small>
            表示名は公開済みの共有ページにも反映されます。過去の別名投稿はまとめません。非公開にしても、公開済みの投稿自体は残ります。
          </small>
          <button className="as-primary" type="submit">
            {readOnly
              ? 'デモは閲覧専用です'
              : busy || uploading
                ? '保存中…'
                : 'プロフィールを保存'}
          </button>
        </fieldset>
      </form>
      {message && <p role={error ? 'alert' : 'status'}>{message}</p>}
    </section>
  );
}
export function ReportButton({
  targetType,
  target,
}: {
  targetType: string;
  target: string;
}) {
  const [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  async function report(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    const f = new FormData(e.currentTarget);
    try {
      await socialRequest({
        action: 'report',
        targetType,
        target,
        reason: f.get('reason'),
      });
      setMessage('運営へ送りました。');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '送信できませんでした。');
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="as-report">
      <summary>通報する</summary>
      <form onSubmit={report} className="as-social-form">
        <label>
          困った内容
          <textarea name="reason" required minLength={3} maxLength={500} />
        </label>
        <small>
          {targetType === 'message'
            ? 'このメッセージ1通と理由を運営に送ります。'
            : '対象の公開内容と理由を運営に送ります。'}
        </small>
        <button className="as-secondary" disabled={busy}>
          運営へ送る
        </button>
        <output aria-live="polite">{message}</output>
      </form>
    </details>
  );
}
export function MessageComposer({
  target,
  thread,
  canAccept = false,
  waiting = false,
  readOnly = false,
}: {
  target: string;
  thread?: string;
  canAccept?: boolean;
  waiting?: boolean;
  readOnly?: boolean;
}) {
  const router = useRouter(),
    requestId = useRef<string | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function submit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setError('');
    requestId.current ??= crypto.randomUUID();
    try {
      const result = await socialRequest({
        action: 'message',
        target,
        body: new FormData(form).get('body'),
        requestId: requestId.current,
      });
      requestId.current = null;
      form.reset();
      if (thread) router.refresh();
      else window.location.assign(withSiteBasePath(result.next));
    } catch (e) {
      setError(e instanceof Error ? e.message : '送信できませんでした。');
    } finally {
      setBusy(false);
    }
  }
  async function accept() {
    setBusy(true);
    try {
      await socialRequest({ action: 'accept', thread });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '承認できませんでした。');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="as-panel">
      {canAccept ? (
        <>
          <p>この人からのメッセージを受け取りました。会話を続けますか？</p>
          <button
            className="as-primary"
            disabled={busy || readOnly}
            onClick={accept}
          >
            会話を承認する
          </button>
        </>
      ) : waiting ? (
        <p>相手の承認を待っています。続きは承認後に送れます。</p>
      ) : (
        <form onSubmit={submit} className="as-social-form">
          <label>
            メッセージ
            <textarea
              name="body"
              required
              maxLength={2000}
              rows={4}
              disabled={busy || readOnly}
            />
          </label>
          <small>
            最初は1通だけ送れます。相手が承認すると会話を続けられます。サイトは仕事の斡旋や契約・支払いの仲介を行いません。
          </small>
          <button className="as-primary" disabled={busy || readOnly}>
            {busy ? '送信中…' : '送信する'}
          </button>
        </form>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
