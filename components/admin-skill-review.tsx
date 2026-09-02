'use client';

import {
  ArrowUpRight,
  BadgeCheck,
  RotateCcw,
  UserRoundCheck,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { AdminSkillEvidenceRecord } from '@/db/skill-passport';
import { instructorStatusLabels } from '@/lib/skill-passport';
import { withSiteBasePath } from '@/lib/site-paths';
import { getSkillDefinition } from '@/lib/skill-taxonomy';

function formatDate(value: number) {
  return new Intl.DateTimeFormat('ja-JP', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Tokyo',
  }).format(new Date(value));
}

export function AdminSkillReview({
  canReviewEvidence,
  currentUserId,
  evidence,
  pendingEvidenceTotal,
}: {
  canReviewEvidence: boolean;
  currentUserId: string;
  evidence: AdminSkillEvidenceRecord[];
  pendingEvidenceTotal: number;
}) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messageKind, setMessageKind] = useState<'success' | 'error'>(
    'success',
  );

  async function runAction(input: {
    action: 'verify-evidence' | 'request-changes';
    id: string;
    note?: string;
    expectedUpdatedAt?: number;
  }) {
    setPendingId(input.id);
    setMessage('');
    try {
      const response = await fetch(withSiteBasePath('/api/admin/skills'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? '管理操作を保存できませんでした。');
      }
      setMessageKind('success');
      setMessage('確認結果を保存しました。最新一覧へ更新できます。');
      setPendingId(null);
    } catch (error) {
      setMessageKind('error');
      setMessage(
        error instanceof Error
          ? error.message
          : '管理操作を保存できませんでした。',
      );
      setPendingId(null);
    }
  }

  const pendingEvidence = evidence.filter(
    (item) => item.instructorStatus === 'pending',
  );
  const verifiedEvidence = evidence.filter(
    (item) => item.instructorStatus === 'verified',
  );
  return (
    <section className="mt-16 border-t-2 border-brand-dark pt-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-sapphire">
            SKILL PASSPORT REVIEW
          </p>
          <h2 className="mt-3 font-mincho text-4xl">成果物の確認</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-quiet">
            AIの自己申告やレベル番号では判断しません。実際の成果物・操作・確認記録を見た範囲だけを残します。
          </p>
        </div>
        <div className="soft-panel border border-rule bg-paper-white px-5 py-4 text-xs">
          <p>講師確認待ち {pendingEvidenceTotal}件</p>
          {pendingEvidenceTotal > pendingEvidence.length ? (
            <p className="mt-2 leading-5 text-quiet">
              画面には古い順に最大200件を表示します。保存後に再読込すると次の対象が表示されます。
            </p>
          ) : null}
        </div>
      </div>

      {message ? (
        <div
          className={`soft-control mt-6 flex flex-col gap-3 border-l-4 p-4 text-sm sm:flex-row sm:items-center sm:justify-between ${messageKind === 'success' ? 'border-future-mint bg-future-mint-soft' : 'border-human-coral bg-human-coral-soft'}`}
          role={messageKind === 'error' ? 'alert' : 'status'}
        >
          <p>{message}</p>
          {messageKind === 'success' ? (
            <Button
              className="shrink-0"
              onClick={() => window.location.reload()}
              type="button"
              variant="outline"
            >
              最新一覧を読み込む
            </Button>
          ) : null}
        </div>
      ) : null}

      {canReviewEvidence ? (
        <section className="mt-9">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-sapphire">
                INSTRUCTOR CHECK
              </p>
              <h3 className="mt-2 font-mincho text-3xl">講師確認待ち</h3>
            </div>
            <UserRoundCheck
              className="size-6 text-sapphire"
              aria-hidden="true"
            />
          </div>

          {pendingEvidence.length === 0 ? (
            <p className="soft-panel mt-6 border border-rule bg-paper-white p-7 text-sm text-quiet">
              現在、講師確認待ちの成果物はありません。
            </p>
          ) : (
            <div className="mt-6 grid gap-5">
              {pendingEvidence.map((item) => (
                <article
                  className="soft-panel border border-rule bg-paper-white p-6 sm:p-8"
                  key={item.id}
                >
                  {item.memberId === currentUserId ? (
                    <p className="soft-control mb-5 border border-human-coral/40 bg-human-coral-soft p-4 text-xs leading-6 text-brand-dark">
                      自分の成果物は確認できません。別の管理者・講師へ依頼してください。
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="soft-badge bg-sapphire-soft px-3 py-1 text-[11px] font-semibold text-sapphire">
                      {item.taskId ?? '実務・自主制作'}
                    </span>
                    <span className="soft-badge bg-sunrise-soft px-3 py-1 text-[11px] font-semibold text-warning">
                      {instructorStatusLabels[item.instructorStatus]}
                    </span>
                    <span className="ml-auto text-[10px] text-quiet">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_0.65fr]">
                    <div>
                      <h4 className="font-mincho text-3xl">{item.title}</h4>
                      <p className="mt-2 break-words text-xs leading-6 text-quiet">
                        {item.memberDisplayName}
                        {item.memberEmail ? `／${item.memberEmail}` : ''}
                      </p>
                      <p className="mt-1 text-xs leading-6 text-quiet">
                        課題：{item.taskTitle}
                      </p>
                      <p className="mt-5 text-sm leading-7">{item.summary}</p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {item.skillKeys.map((key) => {
                          const skill = getSkillDefinition(key);
                          return skill ? (
                            <span
                              className="soft-badge border border-rule bg-paper px-3 py-1 text-[11px]"
                              key={key}
                            >
                              {skill.label}
                            </span>
                          ) : null;
                        })}
                      </div>
                      {item.evidenceUrl ? (
                        <a
                          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sapphire"
                          href={item.evidenceUrl}
                          referrerPolicy="no-referrer"
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          成果物URLを開く
                          <ArrowUpRight className="size-4" aria-hidden="true" />
                        </a>
                      ) : (
                        <p className="mt-6 text-xs leading-6 text-human-coral">
                          成果物URLなし。対面または画面共有で確認した場合、その方法を確認記録へ明記してください。
                        </p>
                      )}
                    </div>

                    <div className="soft-control border border-rule bg-paper p-5">
                      <label
                        className="grid gap-2 text-xs font-semibold"
                        htmlFor={`instructor-note-${item.id}`}
                      >
                        確認した範囲・未確認事項
                        <Textarea
                          className="min-h-36 bg-white p-4 font-normal leading-6"
                          id={`instructor-note-${item.id}`}
                          maxLength={1_000}
                          onChange={(event) =>
                            setNotes((current) => ({
                              ...current,
                              [item.id]: event.target.value,
                            }))
                          }
                          placeholder="例：共有画面でExcelを開き、数量変更による再計算とA4印刷表示を確認。税区分は未確認。"
                          value={notes[item.id] ?? item.instructorNote ?? ''}
                        />
                      </label>
                      <p className="mt-3 text-[10px] leading-5 text-quiet">
                        共有対象の成果物では、この確認記録と確認者名も応募用ページへ表示されます。個人情報や社外秘は書かないでください。
                      </p>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                        <Button
                          className="min-h-11 bg-future-mint text-brand-dark"
                          disabled={
                            pendingId === item.id ||
                            item.memberId === currentUserId
                          }
                          onClick={() =>
                            runAction({
                              action: 'verify-evidence',
                              id: item.id,
                              note: notes[item.id] ?? item.instructorNote ?? '',
                              expectedUpdatedAt: item.updatedAt,
                            })
                          }
                          type="button"
                        >
                          <BadgeCheck className="size-4" aria-hidden="true" />
                          確認済みにする
                        </Button>
                        <Button
                          className="min-h-11"
                          disabled={
                            pendingId === item.id ||
                            item.memberId === currentUserId
                          }
                          onClick={() =>
                            runAction({
                              action: 'request-changes',
                              id: item.id,
                              note: notes[item.id] ?? item.instructorNote ?? '',
                              expectedUpdatedAt: item.updatedAt,
                            })
                          }
                          type="button"
                          variant="outline"
                        >
                          <RotateCcw className="size-4" aria-hidden="true" />
                          補足を依頼
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {canReviewEvidence && verifiedEvidence.length > 0 ? (
        <details className="soft-panel mt-10 border border-rule bg-paper-white p-6">
          <summary className="cursor-pointer text-sm font-semibold">
            講師確認済みの履歴 {verifiedEvidence.length}件
          </summary>
          <div className="mt-5 grid gap-3">
            {verifiedEvidence.map((item) => (
              <div
                className="soft-control grid gap-2 border border-rule bg-paper p-4 text-xs sm:grid-cols-[1fr_auto]"
                key={item.id}
              >
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-quiet">
                    {item.memberDisplayName}／{item.taskId ?? '実務・自主制作'}
                  </p>
                </div>
                <p className="text-quiet">
                  {item.verifiedAt ? formatDate(item.verifiedAt) : '確認日なし'}
                </p>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}
