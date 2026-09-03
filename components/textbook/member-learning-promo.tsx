import {
  ArrowRight,
  BookmarkCheck,
  CheckCircle2,
  FileCheck2,
} from 'lucide-react';

import Link from '@/components/site-link';

const memberBenefits = [
  {
    Icon: BookmarkCheck,
    title: 'あとでやる',
    body: '気になる課題を保存',
  },
  {
    Icon: CheckCircle2,
    title: 'できた課題',
    body: '完了した課題を一覧',
  },
  {
    Icon: FileCheck2,
    title: '作ったもの',
    body: '作品や仕事の成果を記録',
  },
] as const;

export function MemberLearningPromo({
  className = '',
}: {
  className?: string;
}) {
  return (
    <section
      className={`soft-panel soft-panel-clip overflow-hidden border border-sapphire/30 bg-sapphire-soft ${className}`}
      aria-labelledby="member-learning-promo-heading"
    >
      <div className="grid lg:grid-cols-[1fr_0.9fr]">
        <div className="p-7 sm:p-9 lg:p-10">
          <p className="text-xs font-semibold tracking-[0.14em] text-sapphire">
            FREE MEMBER
          </p>
          <h2
            id="member-learning-promo-heading"
            className="mt-4 font-mincho text-3xl leading-[1.35] sm:text-4xl"
          >
            やりたい課題も、できた課題も、
            <br />
            一つのマイページへ。
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-quiet">
            教科書は登録なしで読めます。無料会員になると、課題の保存や学習記録が使えます。
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              className="button-glow group inline-flex min-h-12 items-center justify-between gap-6 px-5 text-sm font-semibold text-white"
              href="/join"
            >
              無料会員登録
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
            <p className="text-xs leading-6 text-quiet">
              登録だけで料金は発生しません
            </p>
          </div>
        </div>

        <div className="grid border-t border-sapphire/20 bg-white/70 sm:grid-cols-3 lg:grid-cols-1 lg:border-l lg:border-t-0">
          {memberBenefits.map(({ Icon, title, body }) => (
            <div
              className="flex items-center gap-4 border-b border-sapphire/15 p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 lg:border-b lg:border-r-0 lg:last:border-b-0"
              key={title}
            >
              <span className="soft-icon grid size-10 shrink-0 place-items-center bg-white text-sapphire">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-1 text-xs text-quiet">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
