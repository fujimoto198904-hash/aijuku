import {
  ArrowRight,
  BadgeCheck,
  FileCheck2,
  MessageSquareText,
} from "lucide-react";

import { SectionIntro } from "@/components/home/section-intro";
import Link from "@/components/site-link";

const goals = [
  {
    label: "はじめて",
    title: "まず、話しかけてみる",
    body: "画面の開き方や言葉の入れ方から。分からない言葉を置き去りにしません。",
  },
  {
    label: "暮らし",
    title: "毎日の小さな手間を軽くする",
    body: "調べ物、予定、文章づくりなど、自分に必要な場面だけ選んで使います。",
  },
  {
    label: "仕事",
    title: "使える成果物を一つ作る",
    body: "メール、資料、整理、提案。実際に使う前の確認までを一続きで学びます。",
  },
  {
    label: "チーム",
    title: "使い方を、仕組みに変える",
    body: "担当、手順、確認点を残し、誰かが続きから動ける状態を目指します。",
  },
] as const;

const passportParts = [
  {
    Icon: FileCheck2,
    title: "本人の実践記録",
    body: "教科書の課題も、これまでの実務・自主制作も、成果物と一緒に残す。",
  },
  {
    Icon: BadgeCheck,
    title: "講師が確認",
    body: "成果物・操作・未確認事項を、実際に見た範囲だけ記録する。",
  },
  {
    Icon: MessageSquareText,
    title: "第三者の評価",
    body: "上司・同僚・顧客などが、実際に確認した場面を本人の同意付きで残す。",
  },
] as const;

export function GoalSection() {
  return (
    <section className="border-y border-rule bg-paper-white px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-[1240px]">
        <SectionIntro
          body={
            <p>
              英語を旅行で使いたい人と、仕事で交渉したい人の目標が違うように、AIも必要なところまでで十分です。人に番号で序列をつけず、今の目的から入口を選びます。
            </p>
          }
          index="02"
          label="YOUR GOAL"
          title={
            <>
              全員が、同じゴールまで
              <br />
              行かなくていい。
            </>
          }
        />

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {goals.map((goal) => (
            <article
              className="soft-card soft-interactive min-h-[280px] border border-rule bg-paper-white p-7 hover:bg-sapphire-soft/45 sm:p-8"
              key={goal.label}
            >
              <p className="font-mincho text-2xl text-sapphire">{goal.label}</p>
              <h3 className="mt-12 font-mincho text-2xl leading-9">
                {goal.title}
              </h3>
              <p className="mt-5 text-sm leading-7 text-quiet">{goal.body}</p>
            </article>
          ))}
        </div>

        <div className="soft-panel soft-panel-clip soft-dark-glow mt-14 grid bg-brand-dark text-white lg:grid-cols-[0.72fr_1.28fr]">
          <div className="border-b border-white/15 p-7 sm:p-10 lg:border-b-0 lg:border-r lg:p-12">
            <p className="text-xs font-semibold tracking-[0.16em] text-future-mint">
              AI PRACTICE PASSPORT
            </p>
            <h3 className="mt-7 font-mincho text-3xl leading-[1.5] sm:text-4xl">
              学んだことを、
              <br />
              言葉だけで終わらせない。
            </h3>
            <p className="mt-6 text-sm leading-8 text-white/70">
              作ったものと確認できたことを残し、応募時に「何ができるか」を具体的に説明しやすくします。
            </p>
          </div>
          <div className="p-7 sm:p-10 lg:p-12">
            <div className="grid gap-4 sm:grid-cols-3">
              {passportParts.map(({ Icon, title, body }) => (
                <article
                  className="soft-card border border-white/15 bg-white/[0.045] p-5"
                  key={title}
                >
                  <Icon
                    aria-hidden="true"
                    className="size-5 text-future-mint"
                  />
                  <h4 className="mt-5 font-mincho text-xl">{title}</h4>
                  <p className="mt-3 text-xs leading-6 text-white/70">{body}</p>
                </article>
              ))}
            </div>
            <div className="mt-7 flex flex-col gap-4 border-t border-white/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-2xl text-xs leading-6 text-white/70">
                人を点数やレベル番号で順位づけせず、本人記録・講師確認・第三者評価を分けて表示します。公的資格や採用を保証する制度ではありません。
              </p>
              <Link
                className="soft-button inline-flex min-h-11 shrink-0 items-center justify-center gap-3 bg-white px-5 text-xs font-semibold text-brand-dark"
                href="/join"
              >
                無料会員で始める
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
