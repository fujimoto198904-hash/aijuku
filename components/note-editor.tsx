'use client';
import { useState, useId, type SubmitEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { noteOutcomes, type LearningNote } from '@/lib/learning-notes';
import { withSiteBasePath } from '@/lib/site-paths';
export function NoteEditor({
  note,
  onClose,
}: {
  note: LearningNote;
  onClose: () => void;
}) {
  const router = useRouter(),
    formId = useId();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function save(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      const response = await fetch(withSiteBasePath('/api/learning'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          id: note.id,
          body: form.get('body'),
          tool: form.get('tool'),
          outcome: form.get('outcome'),
          humanFix: form.get('humanFix'),
          expected: [note.body, note.tool, note.outcome, note.humanFix],
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw Error(result.error || '更新できませんでした。');
      router.refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新できませんでした。');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save} className="as-note-form">
      <fieldset disabled={busy} className="as-note-form">
        <legend>自分用ノートを編集</legend>
        <label htmlFor={formId + '-body'}>
          試したこと
          <Textarea
            id={formId + '-body'}
            name="body"
            defaultValue={note.body}
            maxLength={2000}
            required
          />
        </label>
        <label htmlFor={formId + '-tool'}>
          使ったAI・道具
          <Input
            id={formId + '-tool'}
            name="tool"
            defaultValue={note.tool}
            maxLength={60}
          />
        </label>
        <label>
          どうだった？
          <select name="outcome" defaultValue={note.outcome}>
            {Object.entries(noteOutcomes).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={formId + '-fix'}>
          工夫したこと
          <Textarea
            id={formId + '-fix'}
            name="humanFix"
            defaultValue={note.humanFix}
            maxLength={1000}
          />
        </label>
        <p>
          公開済みの投稿は変わりません。実践日・元の課題もそのまま残ります。
        </p>
        <div className="as-action-row">
          <Button type="submit">{busy ? '更新中…' : '変更を保存'}</Button>
          <Button type="button" variant="outline" onClick={onClose}>
            やめる
          </Button>
        </div>
        {error && (
          <p role="alert" className="as-inline-error">
            {error}
          </p>
        )}
      </fieldset>
    </form>
  );
}
