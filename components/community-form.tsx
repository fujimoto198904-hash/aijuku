'use client';
import { useRef, useState, useId, type SubmitEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  communityKinds,
  communityLabels,
  type CommunityKind,
} from '@/lib/community';
import { PostImageInput } from '@/components/post-image-input';
import { withSiteBasePath } from '@/lib/site-paths';
import Link from '@/components/site-link';
import { textbookLessonPath } from '@/lib/textbook-routes';
import { Link2, X } from 'lucide-react';
import {
  communityPostBody,
  communityPostMaxLength,
  communityReplyMaxLength,
  communityTextLength,
} from '@/lib/community-composer';
import { uploadPostImage } from '@/lib/prepare-post-image';
export function CommunityForm({
  postId,
  initialKind = 'learning',
  taskId = '',
  taskTitle,
  isStaff = false,
  initialBody = '',
  publicProfile,
  defaultNickname = '',
  onReplySaved,
}: {
  postId?: string;
  initialKind?: CommunityKind;
  taskId?: string;
  taskTitle?: string;
  isStaff?: boolean;
  initialBody?: string;
  publicProfile?: { name: string; handle: string } | null;
  defaultNickname?: string;
  onReplySaved?: () => void;
}) {
  const formId = useId();
  const router = useRouter(),
    id = useRef<string | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const [mediaId, setMediaId] = useState<string | null>(null),
    [imageBusy, setImageBusy] = useState(false);
  const [existingNext, setExistingNext] = useState<string | null>(null);
  const [selectedKind, setSelectedKind] = useState(initialKind);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [bodyValue, setBodyValue] = useState(initialBody);
  const [linkValue, setLinkValue] = useState('');
  const maxLength = postId ? communityReplyMaxLength : communityPostMaxLength;
  let characterCount = communityTextLength(bodyValue.trim());
  try {
    characterCount = communityTextLength(
      communityPostBody(bodyValue, linkOpen ? linkValue : ''),
    );
  } catch {
    characterCount += communityTextLength(linkOpen ? linkValue : '');
  }
  const submitting = useRef(false);
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || imageBusy) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    id.current ??= crypto.randomUUID();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const rawBody = data.get('body'),
        rawLink = data.get('link');
      const body = communityPostBody(
        typeof rawBody === 'string' ? rawBody : '',
        typeof rawLink === 'string' ? rawLink : '',
      );
      if (!body || communityTextLength(body) > maxLength)
        throw new Error(
          `本文とリンクを合わせて1〜${maxLength.toLocaleString('ja-JP')}文字で入力してください。`,
        );
      let uploadedMediaId = mediaId;
      if (imageBlob && !uploadedMediaId) {
        uploadedMediaId = await uploadPostImage(imageBlob);
        setMediaId(uploadedMediaId);
      }
      const response = await fetch(withSiteBasePath('/api/community'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: postId ? 'reply' : 'post',
          postId,
          kind: selectedKind,
          body,
          nickname: isStaff
            ? 'Aitock公式'
            : (publicProfile?.name ?? data.get('nickname')),
          taskId,
          mediaId: uploadedMediaId,
          // 「投稿する」の明示操作が公開操作。毎回の確認チェックは設けない。
          publicConsent: true,
          requestId: id.current,
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        code?: string;
        next?: string;
        existingNext?: string;
      };
      if (result.code === 'media_unavailable') setMediaId(null);
      if (response.status === 409)
        setExistingNext(result.existingNext ?? '/mypage');
      if (!response.ok)
        throw new Error(result.error ?? '投稿できませんでした。');
      if (postId) {
        id.current = null;
        form.reset();
        setBodyValue('');
        if (onReplySaved) onReplySaved();
        else router.refresh();
      } else
        window.location.assign(withSiteBasePath(result.next ?? '/community'));
    } catch (e) {
      setError(e instanceof Error ? e.message : '投稿できませんでした。');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <form
      onSubmit={submit}
      className={'as-composer' + (postId ? ' as-composer-reply' : '')}
    >
      <fieldset disabled={busy} className="contents">
        {!postId && taskId && (
          <div className="as-composer-task">
            <Link
              href={textbookLessonPath(taskId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-sapphire"
            >
              {taskId}
              {taskTitle ? ` ${taskTitle}` : ''} ↗
            </Link>
          </div>
        )}
        {isStaff ? (
          <p className="font-semibold text-sapphire">Aitock公式</p>
        ) : publicProfile ? (
          <p className="as-composer-author">
            <strong>{publicProfile.name}</strong>
          </p>
        ) : (
          <label htmlFor={formId + '-nickname'} className="as-composer-name">
            <span className="sr-only">投稿に表示する名前</span>
            <Input
              id={formId + '-nickname'}
              name="nickname"
              defaultValue={defaultNickname}
              placeholder="ニックネーム"
              minLength={1}
              maxLength={30}
              required
            />
          </label>
        )}
        <label htmlFor={formId + '-body'} className="as-composer-body">
          <span className="sr-only">
            {postId
              ? '返信'
              : selectedKind === 'question'
                ? '試したこと・分からないところ'
                : '本文'}
          </span>
          <Textarea
            className="min-w-0 w-full text-base"
            id={formId + '-body'}
            name="body"
            value={bodyValue}
            onChange={(event) => setBodyValue(event.target.value)}
            placeholder={
              postId
                ? 'コメントを追加…'
                : selectedKind === 'question'
                  ? 'どこで困った？試したことを気軽に書いてみよう。'
                  : 'AIでやってみたこと、見つけたもの。ひとことから。'
            }
            aria-describedby={formId + '-count'}
            required
          />
        </label>
        {!postId && (
          <>
            <div className="as-composer-tools">
              <PostImageInput
                value={mediaId}
                onChange={setMediaId}
                onBusy={setImageBusy}
                disabled={busy}
                onPrepared={(blob) => {
                  setImageBlob(blob);
                  setMediaId(null);
                }}
              />
              <button
                type="button"
                className="as-composer-tool"
                aria-expanded={linkOpen}
                aria-controls={formId + '-link-row'}
                onClick={() => setLinkOpen(true)}
              >
                <Link2 size={20} aria-hidden="true" />
                リンク
              </button>
              <label className="as-composer-kind">
                <span className="sr-only">投稿の種類</span>
                <select
                  name="kind"
                  value={selectedKind}
                  onChange={(e) =>
                    setSelectedKind(e.target.value as CommunityKind)
                  }
                >
                  {communityKinds.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind === 'learning'
                        ? '投稿'
                        : kind === 'tip'
                          ? '使い方'
                          : communityLabels[kind]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {linkOpen && (
              <div className="as-composer-link" id={formId + '-link-row'}>
                <label className="sr-only" htmlFor={formId + '-link'}>
                  追加するURL
                </label>
                <Input
                  id={formId + '-link'}
                  name="link"
                  type="url"
                  inputMode="url"
                  placeholder="https://…"
                  maxLength={2000}
                  value={linkValue}
                  onChange={(event) => setLinkValue(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => {
                    setLinkOpen(false);
                    setLinkValue('');
                  }}
                  aria-label="リンクを外す"
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </>
        )}
        <p className="as-composer-visibility">投稿は誰でも読めます。</p>
        <span
          id={formId + '-count'}
          className="as-composer-count"
          data-over={characterCount > maxLength || undefined}
        >
          {characterCount.toLocaleString('ja-JP')} /{' '}
          {maxLength.toLocaleString('ja-JP')}文字
        </span>
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        {existingNext && (
          <div className="as-status">
            <a
              href={withSiteBasePath(existingNext)}
              target="_blank"
              rel="noopener noreferrer"
            >
              保存済みの投稿を別のタブで確認 ↗
            </a>
            <button
              type="button"
              className="as-text-button"
              onClick={() => {
                id.current = crypto.randomUUID();
                setExistingNext(null);
                setError('');
              }}
            >
              入力を残して、別の投稿として保存する準備
            </button>
          </div>
        )}
        <Button
          type="submit"
          disabled={busy || imageBusy || characterCount > maxLength}
          className="min-h-12 bg-sapphire text-white"
        >
          {busy
            ? '投稿しています…'
            : postId
              ? 'コメントする'
              : selectedKind === 'question'
                ? '質問を投稿する'
                : '投稿する'}
        </Button>
      </fieldset>
    </form>
  );
}
export function CommunityDelete({
  id,
  target,
  postId,
  onRemoved,
}: {
  id: string;
  target: 'post' | 'reply';
  postId?: string;
  onRemoved?: () => void;
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function remove() {
    setBusy(true);
    try {
      const r = await fetch(withSiteBasePath('/api/community'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', target, id }),
      });
      if (!r.ok) throw new Error('削除できませんでした。');
      if (target === 'post')
        window.location.assign(withSiteBasePath('/community'));
      else {
        setConfirm(false);
        if (onRemoved) onRemoved();
        else router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '削除できませんでした。');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-4 text-sm">
      {confirm ? (
        <div className="flex flex-wrap items-center gap-3">
          <span>この投稿を非公開にしますか？</span>
          <Button disabled={busy} onClick={remove}>
            削除する
          </Button>
          <Button variant="outline" onClick={() => setConfirm(false)}>
            戻る
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setConfirm(true)}
          className="underline text-quiet"
        >
          投稿を削除{postId ? '' : ''}
        </button>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
