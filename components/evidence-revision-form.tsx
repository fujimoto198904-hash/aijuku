'use client';

import { RotateCcw, Send } from 'lucide-react';
import { type SubmitEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { SkillEvidenceRecord } from '@/db/skill-passport';
import { withSiteBasePath } from '@/lib/site-paths';

export function EvidenceRevisionForm({
  evidence,
}: {
  evidence: SkillEvidenceRecord;
}) {
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [status, setStatus] = useState<
    'idle' | 'sending' | 'success' | 'error'
  >('idle');
  const [message, setMessage] = useState('');

  async function resubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setMessage('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(withSiteBasePath('/api/skills/evidence'), {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'resubmit',
          evidenceId: evidence.id,
          expectedUpdatedAt: evidence.updatedAt,
          title: form.get('title'),
          summary: form.get('summary'),
          evidenceUrl: form.get('evidenceUrl'),
          rightsConfirmed,
        }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? '再提出できませんでした。');
      }
      setStatus('success');
      setMessage(
        '修正内容を保存し、運営確認待ちへ戻しました。以前の未回答評価リンクは失効しています。',
      );
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error ? error.message : '再提出できませんでした。',
      );
    }
  }

  return (
    <form
      className="soft-control mt-5 grid gap-4 border border-human-coral/35 bg-human-coral-soft p-5"
      onSubmit={resubmit}
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        <RotateCcw className="size-4 text-human-coral" aria-hidden="true" />
        運営メモを反映して再提出
      </div>
      <label
        className="grid gap-2 text-xs font-semibold"
        htmlFor={`revision-title-${evidence.id}`}
      >
        成果物名
        <Input
          className="min-h-11 bg-white px-3 font-normal"
          id={`revision-title-${evidence.id}`}
          defaultValue={evidence.title}
          maxLength={120}
          minLength={3}
          name="title"
          required
        />
      </label>
      <label
        className="grid gap-2 text-xs font-semibold"
        htmlFor={`revision-summary-${evidence.id}`}
      >
        修正後にできること・確認したこと
        <Textarea
          className="min-h-32 bg-white p-3 font-normal leading-6"
          id={`revision-summary-${evidence.id}`}
          defaultValue={evidence.summary}
          maxLength={1_200}
          minLength={20}
          name="summary"
          required
        />
      </label>
      <label
        className="grid gap-2 text-xs font-semibold"
        htmlFor={`revision-url-${evidence.id}`}
      >
        修正後の成果物URL（任意・httpsのみ）
        <Input
          className="min-h-11 bg-white px-3 font-normal"
          id={`revision-url-${evidence.id}`}
          defaultValue={evidence.evidenceUrl ?? ''}
          maxLength={2_000}
          name="evidenceUrl"
          type="url"
        />
      </label>
      <label
        className="flex cursor-pointer items-start gap-3 text-xs leading-6"
        htmlFor={`revision-rights-${evidence.id}`}
      >
        <Checkbox
          checked={rightsConfirmed}
          className="mt-1"
          id={`revision-rights-${evidence.id}`}
          onCheckedChange={(checked) => setRightsConfirmed(checked === true)}
        />
        <span>
          修正後の内容にも顧客情報・社外秘・第三者の個人情報・権利未確認素材がなく、共有許可を確認しました。
        </span>
      </label>
      {message ? (
        <p
          className={`soft-control border-l-4 p-4 text-xs leading-6 ${status === 'error' ? 'border-human-coral bg-white' : 'border-future-mint bg-future-mint-soft'}`}
          role={status === 'error' ? 'alert' : 'status'}
        >
          {message}
        </p>
      ) : null}
      {status === 'success' ? (
        <Button
          onClick={() => window.location.reload()}
          type="button"
          variant="outline"
        >
          最新状態を表示
        </Button>
      ) : (
        <Button
          className="min-h-11 bg-human-coral text-white"
          disabled={status === 'sending' || !rightsConfirmed}
          type="submit"
        >
          <Send className="size-4" aria-hidden="true" />
          {status === 'sending' ? '再提出しています…' : '修正して再提出'}
        </Button>
      )}
    </form>
  );
}
