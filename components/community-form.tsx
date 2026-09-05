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
export function CommunityForm({
  postId,
  initialKind = 'question',
  taskId = '',
  isStaff = false,
  initialBody = '',
}: {
  postId?: string;
  initialKind?: CommunityKind;
  taskId?: string;
  isStaff?: boolean;
  initialBody?: string;
}) {
  const formId = useId();
  const router = useRouter(),
    id = useRef<string | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const [mediaId, setMediaId] = useState<string | null>(null),
    [imageBusy, setImageBusy] = useState(false);
  const [existingNext, setExistingNext] = useState<string | null>(null);
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || imageBusy) return;
    setBusy(true);
    setError('');
    id.current ??= crypto.randomUUID();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch(withSiteBasePath('/api/community'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: postId ? 'reply' : 'post',
          postId,
          kind: data.get('kind'),
          title: data.get('title'),
          body: data.get('body'),
          nickname: isStaff ? 'MON-ai 運営' : data.get('nickname'),
          taskId,
          mediaId,
          publicConsent: data.get('publicConsent') === 'on',
          requestId: id.current,
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        next?: string;
        existingNext?: string;
      };
      if (response.status === 409)
        setExistingNext(result.existingNext ?? '/mypage');
      if (!response.ok)
        throw new Error(result.error ?? '投稿できませんでした。');
      if (postId) {
        id.current = null;
        form.reset();
        router.refresh();
      } else
        window.location.assign(withSiteBasePath(result.next ?? '/community'));
    } catch (e) {
      setError(e instanceof Error ? e.message : '投稿できませんでした。');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      onSubmit={submit}
      className="soft-panel grid gap-5 border border-rule bg-white p-6 sm:p-8"
    >
      <fieldset disabled={busy} className="contents">
        {!postId && (
          <fieldset>
            <legend className="mb-3 font-semibold">何を投稿しますか？</legend>
            <div className="flex flex-wrap gap-4">
              {communityKinds.map((kind) => (
                <label key={kind} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="kind"
                    value={kind}
                    defaultChecked={kind === initialKind}
                    required
                  />
                  {communityLabels[kind]}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        {isStaff ? (
          <p className="font-semibold text-sapphire">
            MON-ai 運営として投稿します
          </p>
        ) : (
          <label
            htmlFor={formId + '-nickname'}
            className="grid gap-2 font-semibold"
          >
            みんなに表示する名前
            <Input
              id={formId + '-nickname'}
              name="nickname"
              placeholder="ニックネーム"
              minLength={1}
              maxLength={30}
              required
            />
            <span className="text-sm font-normal text-quiet">
              本名でなくて大丈夫です。ここに入力した名前が公開されます。
            </span>
          </label>
        )}
        {!postId && (
          <label
            htmlFor={formId + '-title'}
            className="grid gap-2 font-semibold"
          >
            タイトル
            <Input
              id={formId + '-title'}
              name="title"
              placeholder="どんなことを話したいですか？"
              maxLength={100}
              required
            />
          </label>
        )}
        <label htmlFor={formId + '-body'} className="grid gap-2 font-semibold">
          {postId ? '返信' : '本文'}
          <Textarea
            className="min-h-48 text-base"
            id={formId + '-body'}
            name="body"
            defaultValue={initialBody}
            placeholder={
              postId
                ? 'わかることや、試してみたことを書いてください。'
                : '何を試して、どうなりましたか？気づきや困ったところを書いてください。'
            }
            maxLength={5000}
            required
          />
        </label>
        {!postId && (
          <PostImageInput
            value={mediaId}
            onChange={setMediaId}
            onBusy={setImageBusy}
          />
        )}
        {taskId && (
          <p className="text-sm text-sapphire">関連する課題：{taskId}</p>
        )}
        <label className="flex items-start gap-3 text-sm leading-6">
          <input
            type="checkbox"
            name="publicConsent"
            className="mt-1.5"
            required
          />
          誰でも読める投稿です。個人情報や仕事の秘密を含めず公開することを確認しました。
        </label>
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
          disabled={busy || imageBusy}
          className="min-h-12 bg-sapphire text-white"
        >
          {busy ? '保存しています…' : postId ? '返信する' : '公開する'}
        </Button>
      </fieldset>
    </form>
  );
}
export function CommunityDelete({
  id,
  target,
  postId,
}: {
  id: string;
  target: 'post' | 'reply';
  postId?: string;
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
        router.refresh();
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
