import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowUpRight, BadgeCheck, LockKeyhole } from "lucide-react";

import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { BrandMark } from "@/components/brand-mark";
import { ExternalReviewForm } from "@/components/external-review-form";
import Link from "@/components/site-link";
import { getExternalReviewRequest } from "@/db/skill-passport";
import { getSkillDefinition } from "@/lib/skill-taxonomy";
import { canonicalMemberUrl, isVercelRuntime } from "@/lib/site-runtime";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "第三者評価｜藤本実学塾",
  description: "受講生の成果物について、実際に確認した事実を記録します。",
  robots: { index: false, follow: false },
};

type ReviewPageProps = {
  params: Promise<{ token: string }>;
};

function UnavailableReview() {
  return (
    <main
      id="main-content"
      className="grid min-h-screen place-items-center bg-paper px-5 text-ink"
    >
      <section className="soft-panel w-full max-w-xl border border-rule bg-paper-white p-8 sm:p-10">
        <LockKeyhole className="size-7 text-human-coral" aria-hidden="true" />
        <h1 className="mt-6 font-mincho text-3xl">
          この評価リンクは使えません
        </h1>
        <p className="mt-4 text-sm leading-7 text-quiet">
          使用済み、有効期限切れ、または無効になった可能性があります。依頼した受講生へ新しいリンクをご確認ください。
        </p>
        <Link
          className="mt-7 inline-flex text-sm font-semibold text-sapphire"
          href="/"
        >
          藤本実学塾へ
        </Link>
      </section>
    </main>
  );
}

async function ReviewContent({ token }: { token: string }) {
  const user = await requireChatGPTUser(`/review/${token}`);
  const reviewRequest = await getExternalReviewRequest(token);
  if (!reviewRequest) return <UnavailableReview />;

  if (reviewRequest.memberId === user.userId) {
    return (
      <main
        id="main-content"
        className="grid min-h-screen place-items-center bg-paper px-5 text-ink"
      >
        <section className="soft-panel w-full max-w-xl border border-rule bg-paper-white p-8 sm:p-10">
          <LockKeyhole className="size-7 text-human-coral" aria-hidden="true" />
          <h1 className="mt-6 font-mincho text-3xl">
            自己評価は登録できません
          </h1>
          <p className="mt-4 text-sm leading-7 text-quiet">
            第三者評価は、成果物を見た上司・同僚・顧客・共同制作者などへ依頼してください。
          </p>
          <Link
            className="mt-7 inline-flex text-sm font-semibold text-sapphire"
            href="/mypage#skills"
          >
            マイページへ戻る
          </Link>
        </section>
      </main>
    );
  }

  const skillLabels = reviewRequest.skillKeys
    .map((key) => getSkillDefinition(key)?.label)
    .filter((label): label is string => Boolean(label));

  return (
    <main id="main-content" className="min-h-screen bg-paper text-ink">
      <header className="border-b border-rule bg-paper-white px-5 py-5 sm:px-8">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3">
          <BrandMark className="size-10" />
          <div>
            <p className="font-mincho text-lg">藤本実学塾</p>
            <p className="text-[10px] tracking-[0.12em] text-quiet">
              EXTERNAL REVIEW
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-5xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
        <section>
          <p className="text-xs font-semibold tracking-[0.14em] text-sapphire">
            確認をお願いする成果物
          </p>
          <h1 className="mt-4 font-mincho text-4xl leading-tight">
            実際に見たことだけを、
            <br />
            記録してください。
          </h1>
          <p className="mt-5 text-sm leading-7 text-quiet">
            {reviewRequest.learnerDisplayName}
            さんから届いた評価依頼です。能力全体や資格を判定するのではなく、この成果物をどの場面で確認したかを残します。
          </p>

          <article className="soft-panel mt-8 border border-rule bg-paper-white p-6">
            <div className="flex items-center justify-between gap-4">
              <span className="soft-badge bg-sapphire-soft px-3 py-1 text-[11px] font-semibold text-sapphire">
                {reviewRequest.taskId ?? "PRIOR WORK"}
              </span>
              <BadgeCheck
                className="size-5 text-future-mint"
                aria-hidden="true"
              />
            </div>
            <h2 className="mt-5 font-mincho text-2xl">
              {reviewRequest.evidenceTitle}
            </h2>
            <p className="mt-3 text-xs leading-6 text-quiet">
              {reviewRequest.taskTitle}
            </p>
            <p className="mt-5 text-sm leading-7">
              {reviewRequest.evidenceSummary}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {skillLabels.map((label) => (
                <span
                  className="soft-badge border border-rule bg-paper px-3 py-1 text-[11px]"
                  key={label}
                >
                  {label}
                </span>
              ))}
            </div>
            {reviewRequest.evidenceUrl ? (
              <a
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sapphire"
                href={reviewRequest.evidenceUrl}
                referrerPolicy="no-referrer"
                rel="noopener noreferrer"
                target="_blank"
              >
                成果物のリンクを開く
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
            ) : (
              <p className="mt-6 text-xs leading-6 text-quiet">
                成果物URLはありません。実際に見たことがある場合だけ評価してください。
              </p>
            )}
          </article>
        </section>

        <section className="soft-panel border border-rule bg-paper-white p-6 sm:p-8">
          <ExternalReviewForm defaultName={user.fullName ?? ""} token={token} />
        </section>
      </div>
    </main>
  );
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { token } = await params;
  if (!/^[a-f0-9]{64}$/.test(token)) return <UnavailableReview />;
  if (isVercelRuntime()) redirect(canonicalMemberUrl(`/review/${token}`));
  return <ReviewContent token={token} />;
}
