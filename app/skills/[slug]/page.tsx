import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import {
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  ShieldCheck,
} from 'lucide-react';

import { BrandMark } from '@/components/brand-mark';
import Link from '@/components/site-link';
import { getPublicSkillPassport } from '@/db/skill-passport';
import { getSkillDefinition, skillDefinitions } from '@/lib/skill-taxonomy';
import { canonicalMemberUrl, isVercelRuntime } from '@/lib/site-runtime';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AI実学パスポート｜AIstock',
  description:
    '作った成果物と、運営が確認した範囲を分けて示すURL共有プロフィールです。',
  robots: { index: false, follow: false },
};

type SkillPageProps = {
  params: Promise<{ slug: string }>;
};

function formatDate(value: number) {
  return new Intl.DateTimeFormat('ja-JP', {
    dateStyle: 'medium',
    timeZone: 'Asia/Tokyo',
  }).format(new Date(value));
}

function publicVerifierName(value: string | null) {
  if (!value || value.includes('@')) return 'MON-ai 運営';
  return value;
}

function hostnameFromUrl(value: string) {
  try {
    return new URL(value).hostname;
  } catch {
    return '外部サイト';
  }
}

function UnavailablePassport() {
  return (
    <main
      id="main-content"
      className="grid min-h-screen place-items-center bg-paper px-5 text-ink"
    >
      <section className="soft-panel w-full max-w-xl border border-rule bg-paper-white p-8 sm:p-10">
        <ShieldCheck className="size-7 text-sapphire" aria-hidden="true" />
        <h1 className="mt-6 font-mincho text-3xl">
          このパスポートは共有されていません
        </h1>
        <p className="mt-4 text-sm leading-7 text-quiet">
          本人が共有を停止したか、URLが違う可能性があります。本人から案内された最新のURLをご確認ください。
        </p>
        <Link
          className="mt-7 inline-flex text-sm font-semibold text-sapphire"
          href="/"
        >
          AIstockへ
        </Link>
      </section>
    </main>
  );
}

export default async function PublicSkillPassportPage({
  params,
}: SkillPageProps) {
  const { slug } = await params;
  if (!/^p_[a-f0-9]{32}$/.test(slug)) return <UnavailablePassport />;
  if (isVercelRuntime()) redirect(canonicalMemberUrl(`/skills/${slug}`));

  const passport = await getPublicSkillPassport(slug);
  if (!passport) return <UnavailablePassport />;

  const skillCounts = new Map<string, { evidence: number }>();
  for (const evidence of passport.evidence) {
    for (const key of evidence.skillKeys) {
      const current = skillCounts.get(key) ?? { evidence: 0 };
      current.evidence += 1;
      skillCounts.set(key, current);
    }
  }
  const visibleSkills = skillDefinitions
    .filter((skill) => skillCounts.has(skill.key))
    .map((skill) => ({ ...skill, ...skillCounts.get(skill.key)! }));

  return (
    <main id="main-content" className="min-h-screen bg-paper text-ink">
      <div className="border-b border-sapphire/20 bg-brand-dark px-5 py-2.5 text-center text-[11px] leading-5 text-white/70">
        本人が選んだ成果物のURL共有ページです。URLを知る人は閲覧できます。公的資格・OpenAI公式認定・採用保証ではありません。
      </div>
      <header className="border-b border-rule bg-paper-white px-5 py-5 sm:px-8">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <Link className="flex items-center gap-3" href="/">
            <BrandMark className="size-10" />
            <span>
              <span className="block font-mincho text-lg">AIstock</span>
              <span className="block text-[10px] tracking-[0.12em] text-quiet">
                AI PRACTICE PASSPORT
              </span>
            </span>
          </Link>
          <span className="soft-badge border border-future-mint bg-future-mint-soft px-3 py-1.5 text-[11px] font-semibold text-brand-dark">
            運営確認済みのみ表示
          </span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 lg:py-18">
        <section className="grid gap-8 lg:grid-cols-[1fr_0.58fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-sapphire">
              AI実学パスポート
            </p>
            <h1 className="mt-4 break-words font-mincho text-[clamp(3rem,7vw,6.5rem)] font-medium leading-[1.06] tracking-[-0.045em]">
              {passport.displayName}
            </h1>
            <p className="mt-5 max-w-3xl break-words font-mincho text-2xl leading-relaxed text-brand-dark sm:text-3xl">
              {passport.profile.headline}
            </p>
          </div>
          <div className="soft-panel border border-rule bg-paper-white p-6">
            <BriefcaseBusiness
              className="size-5 text-sapphire"
              aria-hidden="true"
            />
            <p className="mt-4 text-[11px] text-quiet">目指す仕事・役割</p>
            <p className="mt-2 break-words font-semibold">
              {passport.profile.targetRole || '本人から面談時に説明します'}
            </p>
            <p className="mt-5 break-words text-sm leading-7 text-quiet">
              {passport.profile.bio}
            </p>
          </div>
        </section>

        <section className="mt-16 border-t-2 border-brand-dark pt-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-sapphire">
                SKILLS WITH EVIDENCE
              </p>
              <h2 className="mt-3 font-mincho text-3xl sm:text-4xl">
                証拠から見えるスキル
              </h2>
            </div>
            <p className="max-w-lg text-xs leading-6 text-quiet">
              棒グラフの点数ではなく、運営が確認した成果物数を示します。
            </p>
          </div>

          {visibleSkills.length === 0 ? (
            <p className="soft-panel mt-8 border border-rule bg-paper-white p-7 text-sm text-quiet">
              共有できる運営確認済み成果物は、まだありません。
            </p>
          ) : (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {visibleSkills.map((skill) => (
                <article
                  className="soft-card border border-rule bg-paper-white p-6"
                  key={skill.key}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-mincho text-2xl">{skill.label}</h3>
                      <p className="mt-2 text-xs leading-6 text-quiet">
                        {skill.description}
                      </p>
                    </div>
                    <BadgeCheck
                      className="size-5 shrink-0 text-future-mint"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-5 text-xs">
                    <div className="soft-control bg-sapphire-soft p-4">
                      <p className="text-quiet">運営確認済み</p>
                      <p className="numeric-text mt-1 text-2xl text-sapphire">
                        {skill.evidence}件
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-16 border-t-2 border-brand-dark pt-8">
          <p className="text-xs font-semibold tracking-[0.14em] text-sapphire">
            VERIFIED WORK
          </p>
          <h2 className="mt-3 font-mincho text-3xl sm:text-4xl">
            作ったものと、確認された範囲
          </h2>

          {passport.evidence.length === 0 ? (
            <p className="soft-panel mt-8 border border-rule bg-paper-white p-7 text-sm leading-7 text-quiet">
              本人が共有できる運営確認済み成果物は、まだありません。記録が確認・共有された後に、この場所へ表示されます。
            </p>
          ) : null}

          <div className="mt-8 grid gap-6">
            {passport.evidence.map((evidence) => {
              return (
                <article
                  className="soft-panel border border-rule bg-paper-white p-6 sm:p-8"
                  key={evidence.id}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="soft-badge bg-sapphire-soft px-3 py-1 text-[11px] font-semibold text-sapphire">
                      {evidence.taskId ?? '実務・自主制作'}
                    </span>
                    <span className="soft-badge bg-future-mint-soft px-3 py-1 text-[11px] font-semibold text-brand-dark">
                      運営確認済み {formatDate(evidence.verifiedAt!)}
                    </span>
                  </div>
                  <h3 className="mt-5 font-mincho text-3xl">
                    {evidence.title}
                  </h3>
                  <p className="mt-2 text-xs leading-6 text-quiet">
                    {evidence.taskTitle}
                  </p>
                  <p className="mt-5 text-sm leading-7">{evidence.summary}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {evidence.skillKeys.map((key) => {
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

                  <div className="mt-6 grid gap-5 border-t border-rule pt-6 md:grid-cols-[1fr_auto]">
                    <div>
                      <p className="text-[11px] font-semibold text-sapphire">
                        運営が確認した範囲
                      </p>
                      <p className="mt-2 text-sm leading-7 text-quiet">
                        {evidence.instructorNote}
                      </p>
                      <p className="mt-2 text-[11px] text-quiet">
                        確認者：{publicVerifierName(evidence.verifiedByName)}
                      </p>
                    </div>
                    {evidence.evidenceUrl ? (
                      <a
                        className="soft-button inline-flex min-h-11 items-center gap-2 self-start border border-sapphire px-4 text-xs font-semibold text-sapphire"
                        href={evidence.evidenceUrl}
                        referrerPolicy="no-referrer"
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        外部成果物を見る（
                        {hostnameFromUrl(evidence.evidenceUrl)}）
                        <ArrowUpRight className="size-4" aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="soft-panel mt-16 border border-sapphire/25 bg-sapphire-soft p-6 sm:p-8">
          <ShieldCheck className="size-6 text-sapphire" aria-hidden="true" />
          <h2 className="mt-4 font-mincho text-2xl">このページの読み方</h2>
          <p className="mt-3 text-sm leading-7 text-brand-dark/75">
            「運営確認済み」は、AIstockの運営が記載範囲を確認した記録です。能力全体、勤務先、資格、雇用関係そのものを証明するものではありません。
          </p>
        </section>
      </div>
    </main>
  );
}
