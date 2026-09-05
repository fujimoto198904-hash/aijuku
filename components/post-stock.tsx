'use client';
import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { withSiteBasePath } from '@/lib/site-paths';
export function PostStock({
  postRef,
  initialSaved = false,
  canSave = false,
}: {
  postRef: string;
  initialSaved?: boolean;
  canSave?: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function toggle() {
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
    try {
      const r = await fetch(withSiteBasePath('/api/learning'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stock', ref: postRef, saved: !saved }),
      });
      const data = (await r.json()) as { error?: string };
      if (!r.ok) throw Error(data.error || '保存できませんでした。');
      setSaved(!saved);
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
        aria-pressed={saved}
        onClick={toggle}
        className="as-stock-button"
      >
        <Bookmark size={20} fill={saved ? 'currentColor' : 'none'} />
        {busy
          ? '保存中…'
          : !canSave
            ? 'ログインして保存'
            : saved
              ? '保存済み'
              : '保存'}
      </button>
      {error && (
        <span role="alert" className="as-inline-error">
          {error}
        </span>
      )}
    </span>
  );
}
