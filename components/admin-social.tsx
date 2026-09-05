'use client';
import { useRef, useState, type SubmitEvent } from 'react';
import { useRouter } from 'next/navigation';
import { withSiteBasePath } from '@/lib/site-paths';
import { officialCharacters } from '@/lib/official-characters';
export function AdminSocialAction({
  action,
  id,
  children,
}: {
  action: string;
  id?: string;
  children: React.ReactNode;
}) {
  const router = useRouter(),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <div>
      <button
        type="button"
        className="as-secondary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setMessage('');
          try {
            const r = await fetch(withSiteBasePath('/api/admin/social'), {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ action, id }),
            });
            const d = (await r.json()) as {
              error?: string;
              published?: number;
            };
            if (!r.ok) throw new Error(d.error);
            setMessage(
              d.published !== undefined
                ? d.published + '件を処理しました。'
                : '保存しました。',
            );
            router.refresh();
          } catch (e) {
            setMessage(e instanceof Error ? e.message : '失敗しました。');
          } finally {
            setBusy(false);
          }
        }}
      >
        {children}
      </button>
      <output aria-live="polite">{message}</output>
    </div>
  );
}
export function OfficialQueueForm() {
  const router = useRouter(),
    id = useRef<string | null>(null),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      d = new FormData(form);
    const dateValue = d.get('date'),
      timeValue = d.get('time');
    const date = typeof dateValue === 'string' ? dateValue : '',
      time = typeof timeValue === 'string' ? timeValue : '';
    id.current ??= crypto.randomUUID();
    setBusy(true);
    setMessage('');
    try {
      const r = await fetch(withSiteBasePath('/api/admin/social'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'queue',
          handle: d.get('handle'),
          title: d.get('title'),
          body: d.get('body'),
          taskId: d.get('task'),
          publishAfter: Date.parse(date + 'T' + time + ':00+09:00'),
          requestId: id.current,
          approved: d.get('approved') === 'on',
        }),
      });
      const result = (await r.json()) as { error?: string };
      if (!r.ok) throw new Error(result.error);
      id.current = null;
      form.reset();
      setMessage('公開待ちに保存しました。定期実行はまだ停止中です。');
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '保存できませんでした。');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="as-social-form" onSubmit={submit}>
      <fieldset disabled={busy}>
        <label>
          投稿する公式アカウント
          <select name="handle">
            <option value="aitock">Aitock公式</option>
            {officialCharacters.map((c) => (
              <option key={c.handle} value={c.handle}>
                {c.name} · 公式AI
              </option>
            ))}
          </select>
        </label>
        <label>
          タイトル
          <input name="title" required maxLength={100} />
        </label>
        <label>
          本文
          <textarea name="body" rows={6} required maxLength={5000} />
        </label>
        <label>
          関連課題（任意）
          <input name="task" placeholder="Lv.05" />
        </label>
        <label>
          公開してよい日（日本時間）
          <input name="date" type="date" required />
        </label>
        <label>
          時刻
          <input name="time" type="time" required />
        </label>
        <label className="as-check">
          <input name="approved" type="checkbox" required />
          内容と出典を確認しました。AIキャラクターには「公式AI」と表示されます。
        </label>
        <button className="as-primary">確認済みの投稿を保存</button>
      </fieldset>
      <output aria-live="polite">{message}</output>
    </form>
  );
}
