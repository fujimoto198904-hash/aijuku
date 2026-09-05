'use client';
import { useRef, useState, type SubmitEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from '@/components/site-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { noteOutcomes, type LearningNote } from '@/lib/learning-notes';
import { withSiteBasePath } from '@/lib/site-paths';
import { NoteEditor } from '@/components/note-editor';
export function LearningNotebook({
  notes,
  taskId = '',
  sourceRef = '',
  readOnly = false,
}: {
  notes: LearningNote[];
  taskId?: string;
  sourceRef?: string;
  readOnly?: boolean;
}) {
  const router = useRouter(),
    requestId = useRef<string | null>(null);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [deleting, setDeleting] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false),
    [editing, setEditing] = useState<string | null>(null);
  async function send(data: unknown) {
    const r = await fetch(withSiteBasePath('/api/learning'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = (await r.json()) as {
      error?: string;
      imported?: number;
      changed?: number;
    };
    if (!r.ok) {
      if (r.status === 409) setConflict(true);
      throw Error(result.error || '保存できませんでした。');
    }
    return result;
  }
  async function save(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true);
    setError('');
    setMessage('');
    requestId.current ??= crypto.randomUUID();
    try {
      await send({
        action: 'note',
        requestId: requestId.current,
        body: f.get('body'),
        tool: f.get('tool'),
        outcome: f.get('outcome'),
        humanFix: f.get('humanFix'),
        taskId,
        sourceRef,
      });
      form.reset();
      requestId.current = null;
      setConflict(false);
      setMessage('自分用のノートに保存しました。公開はされていません。');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存できませんでした。');
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    setBusy(true);
    setError('');
    try {
      await send({ action: 'delete', id });
      setDeleting(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '削除できませんでした。');
    } finally {
      setBusy(false);
    }
  }
  async function importFile(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = new FormData(e.currentTarget).get('file');
    if (!(file instanceof File) || file.size > 350000) {
      setError('350KB以下のJSONファイルを選んでください。');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await send({
        action: 'import',
        export: JSON.parse(await file.text()),
      });
      setMessage(
        result.imported +
          '件を取り込みました。' +
          (result.changed
            ? result.changed +
              '件は保存済みの内容と違うため、上書きしていません。'
            : '重複・削除済みの記録は追加していません。'),
      );
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'ファイルを読み取れませんでした。',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <form className="as-panel as-note-form" onSubmit={save}>
        <fieldset disabled={busy || readOnly} className="contents">
          <div>
            <h2>今日、どんなことを試した？</h2>
            <p>短いメモで大丈夫。自分だけに見える記録です。</p>
          </div>
          <label htmlFor="note-body">
            試したこと
            <Textarea
              id="note-body"
              name="body"
              maxLength={2000}
              required
              placeholder="例：長いメールをAIに要約してもらった。読みたいところがすぐ分かった。"
            />
          </label>
          <div className="as-form-pair">
            <label htmlFor="note-tool">
              使ったAI・道具
              <Input
                id="note-tool"
                name="tool"
                maxLength={60}
                placeholder="例：ChatGPT"
              />
            </label>
            <label>
              どうだった？
              <select name="outcome">
                {Object.entries(noteOutcomes).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label htmlFor="note-fix">
            自分で工夫したこと・次に試したいこと
            <Textarea
              id="note-fix"
              name="humanFix"
              maxLength={1000}
              placeholder="例：「3行で」と付け足したら読みやすくなった。"
            />
          </label>
          {taskId && <p className="as-eyebrow">関連する課題：{taskId}</p>}
          <Button type="submit" disabled={busy || readOnly}>
            {busy ? '保存中…' : '自分用に保存する'}
          </Button>
        </fieldset>
      </form>
      {error && (
        <p role="alert" className="as-inline-error">
          {error}
        </p>
      )}
      {conflict && (
        <div className="as-status">
          <p>
            入力内容は残っています。下の記録と見比べてから、別の記録として保存することもできます。
          </p>
          <button
            type="button"
            className="as-text-button"
            disabled={busy}
            onClick={() => {
              requestId.current = crypto.randomUUID();
              setConflict(false);
              setError('');
              setMessage(
                '入力内容を別の記録として保存できます。上の保存ボタンを押してください。',
              );
            }}
          >
            別の記録として保存する準備
          </button>
        </div>
      )}
      {message && <output className="as-status">{message}</output>}
      <section className="as-section">
        <h2>自分の記録</h2>
        {!notes.length && (
          <p>記録はまだありません。今日のひとつから残してみましょう。</p>
        )}
        <div className="as-note-list">
          {notes.map((n) => (
            <article key={n.id} className="as-panel">
              {editing === n.id ? (
                <NoteEditor note={n} onClose={() => setEditing(null)} />
              ) : (
                <>
                  <header className="as-note-meta">
                    <span>{noteOutcomes[n.outcome]}</span>
                    <time>
                      {n.testedOn ??
                        new Date(n.createdAt).toLocaleDateString('ja-JP', {
                          timeZone: 'Asia/Tokyo',
                        })}
                    </time>
                    <span>{n.tool}</span>
                    {n.topic && <span>{n.topic}</span>}
                  </header>
                  <p className="as-note-text">{n.body}</p>
                  {n.humanFix && (
                    <p className="as-note-text as-note-hint">{n.humanFix}</p>
                  )}
                  {n.taskId && (
                    <Link
                      href={'/textbook/lesson/' + encodeURIComponent(n.taskId)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      関連する教科書 ↗
                    </Link>
                  )}
                  <div className="as-action-row">
                    {!readOnly && (
                      <button
                        type="button"
                        className="as-text-button"
                        disabled={busy}
                        onClick={() => setEditing(n.id)}
                      >
                        記録を編集
                      </button>
                    )}
                    {!readOnly && (
                      <Link
                        href={
                          '/community/new?kind=learning&note=' +
                          encodeURIComponent(n.id)
                        }
                      >
                        内容を確認して、みんなにも共有 →
                      </Link>
                    )}
                    {deleting === n.id ? (
                      <span>
                        この記録は元に戻せません。共有済みの投稿は残ります。
                        <button
                          disabled={busy}
                          onClick={() => remove(n.id)}
                          className="as-text-button"
                        >
                          削除する
                        </button>
                        <button
                          onClick={() => setDeleting(null)}
                          className="as-text-button"
                        >
                          やめる
                        </button>
                      </span>
                    ) : (
                      <button
                        disabled={readOnly || busy}
                        onClick={() => setDeleting(n.id)}
                        className="as-text-button"
                      >
                        削除
                      </button>
                    )}
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      </section>
      <details className="as-panel as-import">
        <summary>Aitockの記録の引き継ぎ（準備中）</summary>
        <p>
          旧サイトの書き出し画面は、まだ公開していません。すでにJSONをお持ちの方のみ、以下から取り込めます。
        </p>
        <p>
          以前のAitockから書き出したJSONを読み込みます。公開投稿や「課題を完了」の印には変わりません。
        </p>
        <p>
          記録は以前使っていたブラウザーの中にあります。旧サイトは移行が済むまで残します。
        </p>
        <form onSubmit={importFile}>
          <label>
            Aitockの書き出しファイル
            <input
              name="file"
              type="file"
              accept=".json,application/json"
              required
              disabled={readOnly}
            />
          </label>
          <Button type="submit" disabled={busy || readOnly}>
            自分用ノートへ取り込む
          </Button>
        </form>
      </details>
    </>
  );
}
