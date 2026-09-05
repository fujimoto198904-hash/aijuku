'use client';
import { useState } from 'react';
import { Bookmark, LoaderCircle } from 'lucide-react';
import { withSiteBasePath } from '@/lib/site-paths';
import Link from '@/components/site-link';

export function PostStockNotice({
  notice,
  saved,
}: {
  notice: string;
  saved: boolean;
}) {
  return (
    <output
      className={notice ? 'as-stock-notice' : 'sr-only'}
      aria-live="polite"
    >
      {notice}
      {notice && saved && <Link href="/mypage#saved">保存済みを見る →</Link>}
    </output>
  );
}

export function PostStock({
  postRef,
  initialSaved = false,
  canSave = false,
  compact = false,
}: {
  postRef: string;
  initialSaved?: boolean;
  canSave?: boolean;
  compact?: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  async function toggle() {
    if (busy) return;
    if (!canSave) {
      window.location.assign(
        withSiteBasePath(
          '/login?return_to=' +
            encodeURIComponent(
              (postRef.startsWith('official-') ? '/posts/' : '/community/') +
                postRef,
            ),
        ),
      );
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const r = await fetch(withSiteBasePath('/api/learning'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stock', ref: postRef, saved: !saved }),
      });
      const data = (await r.json()) as { error?: string };
      if (!r.ok) throw Error(data.error || '保存できませんでした。');
      setSaved(!saved);
      setNotice(saved ? '保存を解除しました。' : '保存しました。');
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存できませんでした。');
    } finally {
      setBusy(false);
    }
  }
  return (
    <span className="as-stock-control">
      <button
        type="button"
        disabled={busy}
        aria-pressed={canSave ? saved : undefined}
        aria-busy={busy}
        data-feedback={notice && saved ? 'saved' : undefined}
        aria-label={canSave ? 'この投稿を保存' : 'ログインしてこの投稿を保存'}
        title={!canSave ? 'ログインして保存' : saved ? '保存済み' : '保存'}
        onClick={toggle}
        className={
          compact ? 'as-stock-button as-stock-compact' : 'as-stock-button'
        }
      >
        <span
          className="as-stock-icon"
          key={busy ? 'busy' : saved ? 'saved' : 'empty'}
          aria-hidden="true"
        >
          {busy ? (
            <LoaderCircle size={20} />
          ) : (
            <Bookmark
              size={compact ? 24 : 20}
              fill={saved ? 'currentColor' : 'none'}
            />
          )}
        </span>
        <span className={compact ? 'sr-only' : undefined}>
          {busy
            ? '保存中…'
            : !canSave
              ? 'ログインして保存'
              : saved
                ? '保存済み'
                : '保存'}
        </span>
      </button>
      <PostStockNotice notice={notice} saved={saved} />
      {error && (
        <span role="alert" className="as-inline-error">
          {error}
        </span>
      )}
    </span>
  );
}
