import { CheckCircle2, Sparkles, TerminalSquare } from 'lucide-react';

import Link from '@/components/site-link';
import type { TextbookAccessProfile } from '@/lib/textbook-access';
import { textbookSetupPath } from '@/lib/textbook-routes';

export function textbookAccessLabel(profile: TextbookAccessProfile): string {
  const planLabel = profile.plan === 'free' ? '無料で始めやすい' : '有料版推奨';
  return profile.codexRecommended ? `${planLabel}、Codex向き` : planLabel;
}

export function TextbookAccessBadges({
  profile,
  compact = false,
}: {
  profile: TextbookAccessProfile;
  compact?: boolean;
}) {
  const badgeClass = compact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs';

  return (
    <span className="flex flex-wrap gap-1.5">
      {profile.plan === 'free' ? (
        <span
          className={`soft-badge inline-flex items-center gap-1.5 border border-success/35 bg-future-mint-soft font-semibold text-success ${badgeClass}`}
        >
          <CheckCircle2 className="size-3.5" aria-hidden="true" />
          無料で始めやすい
        </span>
      ) : (
        <span
          className={`soft-badge inline-flex items-center gap-1.5 border border-warning/35 bg-sunrise-soft font-semibold text-warning ${badgeClass}`}
        >
          <Sparkles className="size-3.5" aria-hidden="true" />
          有料版推奨
        </span>
      )}
      {profile.codexRecommended ? (
        <span
          className={`soft-badge inline-flex items-center gap-1.5 border border-sapphire/40 bg-sapphire-soft font-semibold text-sapphire ${badgeClass}`}
        >
          <TerminalSquare className="size-3.5" aria-hidden="true" />
          Codex向き
        </span>
      ) : null}
    </span>
  );
}

export function TextbookAccessLegend({
  showLink = true,
  className = '',
}: {
  showLink?: boolean;
  className?: string;
}) {
  return (
    <aside
      className={`soft-card border border-rule bg-paper-white p-5 sm:p-6 ${className}`}
      aria-labelledby="access-legend-title"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p
            id="access-legend-title"
            className="text-xs font-semibold tracking-[0.12em] text-rust"
          >
            マークの見方
          </p>
          <p className="mt-2 text-sm leading-7 text-quiet">
            料金の目安と作業画面は別です。Codexは有料プラン名ではありません。
          </p>
        </div>
        {showLink ? (
          <Link
            className="shrink-0 text-xs font-semibold text-sapphire underline decoration-sapphire/30 underline-offset-4 hover:decoration-sapphire"
            href={textbookSetupPath}
          >
            ChatGPTの準備・プランを見る
          </Link>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <div className="soft-control border border-success/25 bg-future-mint-soft p-4">
          <p className="inline-flex items-center gap-2 text-xs font-semibold text-success">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            無料で始めやすい
          </p>
          <p className="mt-2 text-xs leading-6 text-quiet">
            Freeの標準機能で始めやすい課題。機能ごとの上限に届いたら時間を置きます。
          </p>
        </div>
        <div className="soft-control border border-warning/25 bg-sunrise-soft p-4">
          <p className="inline-flex items-center gap-2 text-xs font-semibold text-warning">
            <Sparkles className="size-4" aria-hidden="true" />
            有料版推奨
          </p>
          <p className="mt-2 text-xs leading-6 text-quiet">
            反復生成、複数ファイルのコード制作、外部接続など。利用可否と残り利用量を先に確認します。
          </p>
        </div>
        <div className="soft-control border border-sapphire/25 bg-sapphire-soft p-4">
          <p className="inline-flex items-center gap-2 text-xs font-semibold text-sapphire">
            <TerminalSquare className="size-4" aria-hidden="true" />
            Codex向き
          </p>
          <p className="mt-2 text-xs leading-6 text-quiet">
            Workでも進められます。実ファイル・コード・テストを直接扱う時に向いています。
          </p>
        </div>
      </div>
    </aside>
  );
}
