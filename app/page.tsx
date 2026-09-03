import {
  AppWindow,
  ArrowRight,
  BookOpenText,
  BookmarkCheck,
  CalendarCheck2,
  Check,
  CheckCircle2,
  FileCheck2,
  FileSpreadsheet,
  ShieldCheck,
  Smartphone,
  UsersRound,
  Video,
} from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from '@/components/site-link';

import { BrandMark } from '@/components/brand-mark';
import { FaqSection } from '@/components/faq-section';
import { FutureSection } from '@/components/home/future-section';
import { LearningCycleSection } from '@/components/home/learning-cycle-section';
import { QuickStartSection } from '@/components/home/quick-start-section';
import { SectionIntro } from '@/components/home/section-intro';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { memberServicePlans, sharedFees } from '@/lib/member-service-plans';
import { canonicalPublicPath } from '@/lib/site-paths';
import { faqItems } from '@/lib/site-content';
import { textbookCatalog } from '@/lib/textbook-catalog';
import {
  textbookExplorePath,
  textbookGuidePath,
  textbookLessonPath,
} from '@/lib/textbook-routes';
import heroFutureImage from '@/sozai/kazoku-sougen.jpg';

export const metadata: Metadata = {
  alternates: { canonical: canonicalPublicPath() },
};

const startChoices = [
  {
    index: '01',
    label: '最初から',
    title: 'スマホ・パソコンの基本から',
    body: '文字の入力やChatGPTの開き方から、ゆっくり始めます。',
    Icon: Smartphone,
  },
  {
    index: '02',
    label: '今の仕事から',
    title: '明日使うものを一つ',
    body: 'メール、資料、見積もりなど、今の困りごとから選べます。',
    Icon: FileSpreadsheet,
  },
  {
    index: '03',
    label: '好きなところから',
    title: '作りたいものに挑戦',
    body: '画像、動画、Web、アプリなど、興味のある分野だけでも大丈夫です。',
    Icon: AppWindow,
  },
] as const;

const joinPlans = [
  {
    ...memberServicePlans[0],
    number: '01',
    Icon: UsersRound,
    timing: '60分 / 1コマ',
    badge: '会員ページから申込',
  },
  {
    ...memberServicePlans[1],
    number: '02',
    Icon: Video,
    timing: '50分 / 1コマ',
    badge: '会員ページから申込',
  },
  {
    ...memberServicePlans[2],
    number: '03',
    Icon: BookOpenText,
    timing: '毎日 17:00〜21:00',
    badge: '2026年11月1日開始予定',
  },
] as const;

const featuredTextbookSample = {
  category: '商談・会議',
  title: '商談が終わったら、次の仕事まで片づく。',
  body: '殴り書きの商談メモを、お礼メール、担当と期限つきのToDo、次回予定候補へ。一つの記録から、確認すべきことまでまとめます。',
  input: '商談後の雑なメモ',
  outputs: ['お礼メール', '担当別ToDo', '次回予定候補'],
  href: textbookLessonPath('SLS-05'),
  Icon: CalendarCheck2,
} as const;

const textbookSampleCards = [
  {
    category: '数字・事務',
    title: '商品と数を選ぶだけ。合計が出る見積書Excelを。',
    body: '合計・税・印刷まで整え、あとから自分で直せる見積書を作ります。',
    deliverable: '見積書.xlsx／商品マスター／計算照合表',
    note: '発行前に、金額・税・宛先を人が確認',
    href: textbookLessonPath('XLS-03'),
    Icon: FileSpreadsheet,
  },
  {
    category: '会社・お店',
    title: '会社や店の魅力が伝わる、スマホサイトを。',
    body: 'サービス、料金、FAQ、相談への入口を整理し、お客様が迷わない画面にします。',
    deliverable: 'スマホ対応の会社ホームページ',
    note: 'まず手元で確認。公開は内容確認後の別工程',
    href: textbookLessonPath('Lv.80'),
    Icon: Smartphone,
  },
] as const;

export default function Home() {
  const allLessonDetailsPublished =
    textbookCatalog.stats.lessonDrafts === textbookCatalog.stats.total;

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="overflow-x-clip bg-paper text-ink">
        <section
          id="philosophy"
          aria-labelledby="hero-title"
          className="section-aura border-b border-rule bg-paper-white px-3 py-3 sm:px-5 sm:py-5 lg:px-8 lg:py-8"
        >
          <div className="soft-panel soft-panel-clip mx-auto grid w-full max-w-[1380px] bg-paper-white lg:min-h-[720px] lg:grid-cols-[1.04fr_0.96fr]">
            <div className="flex items-center px-5 py-16 sm:px-8 sm:py-20 lg:px-14 xl:px-20">
              <div className="max-w-[720px]">
                <div className="flex items-center gap-4">
                  <BrandMark className="size-11" />
                  <p className="text-xs font-semibold tracking-[0.16em] text-quiet">
                    藤本実学塾｜AIが初めてでも大丈夫
                  </p>
                </div>

                <h1
                  id="hero-title"
                  className="text-soft-glow mt-10 font-mincho text-[clamp(2.1rem,6.6vw,6.3rem)] font-medium leading-[1.08] tracking-[-0.055em]"
                >
                  <span className="block whitespace-nowrap">
                    やりたいことが、
                  </span>
                  <span className="text-highlight block whitespace-nowrap text-human-coral">
                    できる毎日へ。
                  </span>
                </h1>

                <p className="mt-9 max-w-[650px] text-base leading-8 text-quiet sm:text-lg sm:leading-9">
                  仕事が早く終わる。思いつきが形になる。AIで、毎日がちょっと楽しくなる。
                </p>

                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={textbookGuidePath}
                    className="button-glow group inline-flex min-h-14 items-center justify-between gap-8 px-6 text-sm font-semibold text-white"
                  >
                    WEB教科書で学ぶ（無料）
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                  <Link
                    href="/join"
                    className="soft-outline-button inline-flex min-h-14 items-center justify-center border border-brand-dark px-6 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-dark hover:text-white"
                  >
                    無料会員登録
                  </Link>
                </div>

                <div className="mt-12 grid gap-4 border-t border-rule pt-5 text-sm text-quiet sm:grid-cols-2">
                  <p className="flex items-center gap-3">
                    <Check
                      className="size-4 text-sapphire"
                      aria-hidden="true"
                    />
                    Web教科書は0円。登録なしですぐ読めます
                  </p>
                  <p className="flex items-center gap-3">
                    <Check
                      className="size-4 text-sapphire"
                      aria-hidden="true"
                    />
                    最初からでも、好きなところからでも
                  </p>
                </div>
              </div>
            </div>

            <figure className="relative min-h-[360px] overflow-hidden bg-rule sm:min-h-[440px] lg:min-h-full">
              <Image
                src={heroFutureImage}
                alt="青空の下で、家族が笑顔で過ごす様子"
                fill
                priority
                sizes="(min-width: 1024px) 48vw, 100vw"
                className="object-cover object-center saturate-[0.97]"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"
                aria-hidden="true"
              />
              <figcaption className="absolute inset-x-4 bottom-4 rounded-3xl border border-white/30 bg-brand-dark/72 p-5 text-white shadow-2xl backdrop-blur-md sm:inset-x-6 sm:bottom-6 sm:p-6">
                <p className="text-xs font-semibold tracking-[0.12em] text-future-mint">
                  AIで時間ができたら
                </p>
                <p className="mt-2 font-mincho text-2xl leading-9 sm:text-3xl">
                  早く終わった分を、
                  <br />
                  大切な時間へ。
                </p>
              </figcaption>
            </figure>
          </div>
        </section>

        <FutureSection />

        <section
          id="curriculum"
          className="border-y border-rule bg-paper-white px-5 py-20 sm:px-8 sm:py-28"
        >
          <div className="mx-auto max-w-[1240px]">
            <SectionIntro
              label="始め方"
              title={
                <>
                  最初から。途中から。
                  <br />
                  好きなところだけ。
                </>
              }
              body={
                <p>
                  全部やる必要はありません。今の自分に合う場所から始められます。
                </p>
              }
            />

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {startChoices.map(({ index, label, title, body, Icon }) => (
                <article
                  key={index}
                  className="soft-card soft-interactive border border-rule bg-paper p-7 hover:bg-sapphire-soft/45 sm:p-8"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="soft-icon grid size-11 place-items-center bg-sapphire-soft text-sapphire">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="numeric-text text-xs text-quiet">
                      {index}
                    </span>
                  </div>
                  <p className="mt-7 text-xs font-semibold text-sapphire">
                    {label}
                  </p>
                  <h3 className="mt-3 font-mincho text-2xl leading-9">
                    {title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-quiet">{body}</p>
                </article>
              ))}
            </div>

            <div className="mt-7 flex justify-end border-t border-rule pt-7">
              <Link
                className="button-glow inline-flex min-h-12 shrink-0 items-center gap-5 px-5 text-sm font-semibold text-white"
                href={textbookExplorePath}
              >
                やりたいことから教材を探す
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <QuickStartSection />

        <LearningCycleSection />

        <section
          id="textbook"
          className="bg-brand-dark px-5 py-24 text-white sm:px-8 sm:py-32"
        >
          <div className="mx-auto max-w-[1240px]">
            <SectionIntro
              label="Web教科書"
              light
              title={
                <>
                  明日使えるものを、
                  <br />
                  ここで作る。
                </>
              }
              body={
                <p>
                  メール、見積書、資料、ホームページ。今ほしいものから選べます。
                </p>
              }
            />

            <div className="soft-panel soft-panel-clip soft-dark-glow mt-16 border border-white/20 bg-paper-white text-ink">
              <div className="grid lg:grid-cols-[1.18fr_0.82fr]">
                <article className="relative overflow-hidden bg-sapphire-soft p-7 sm:p-10 lg:p-12">
                  <div
                    className="absolute -right-28 -top-28 size-72 rounded-full border-[46px] border-white/45"
                    aria-hidden="true"
                  />
                  <div className="relative">
                    <div className="flex items-center justify-between gap-4">
                      <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-sapphire">
                        <featuredTextbookSample.Icon
                          className="size-4"
                          aria-hidden="true"
                        />
                        {featuredTextbookSample.category}
                      </span>
                      <span className="soft-badge border border-sapphire/25 bg-white/65 px-3 py-1.5 text-xs font-semibold text-sapphire">
                        詳しい本文あり
                      </span>
                    </div>

                    <h3 className="mt-9 max-w-2xl font-mincho text-[clamp(2rem,4vw,3.8rem)] font-medium leading-[1.2] tracking-[-0.035em]">
                      {featuredTextbookSample.title}
                    </h3>
                    <p className="mt-5 max-w-2xl text-sm leading-7 text-quiet sm:text-base">
                      {featuredTextbookSample.body}
                    </p>

                    <div className="mt-9 grid gap-px bg-sapphire/15 sm:grid-cols-[0.82fr_1.18fr]">
                      <div className="bg-white/70 p-5 sm:p-6">
                        <p className="text-xs font-semibold tracking-[0.1em] text-sapphire">
                          元になるもの
                        </p>
                        <p className="mt-3 text-sm font-semibold">
                          {featuredTextbookSample.input}
                        </p>
                      </div>
                      <div className="bg-white/70 p-5 sm:p-6">
                        <p className="text-xs font-semibold tracking-[0.1em] text-sapphire">
                          できあがるもの
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {featuredTextbookSample.outputs.map((output) => (
                            <span
                              key={output}
                              className="soft-badge border border-sapphire/20 bg-white px-2.5 py-1.5 text-xs font-semibold"
                            >
                              {output}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-7 flex flex-col gap-5 border-t border-sapphire/20 pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <p className="flex items-start gap-3 text-xs leading-6 text-quiet">
                        <ShieldCheck
                          className="mt-0.5 size-4 shrink-0 text-[#2d746f]"
                          aria-hidden="true"
                        />
                        メール送信や予定登録の前に、人が内容を確認します。
                      </p>
                      <Link
                        href={featuredTextbookSample.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="button-glow group inline-flex min-h-11 shrink-0 items-center justify-center gap-3 px-5 text-xs font-semibold text-white"
                      >
                        この教材を新しいタブで開く
                        <ArrowRight
                          className="size-4 transition-transform group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </Link>
                    </div>
                  </div>
                </article>

                <div className="grid divide-y divide-rule border-t border-rule sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-1 lg:divide-x-0 lg:divide-y lg:border-l lg:border-t-0">
                  {textbookSampleCards.slice(0, 2).map((sample) => (
                    <Link
                      key={sample.href}
                      href={sample.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${sample.title}（新しいタブで開く）`}
                      className="group flex min-h-[310px] flex-col p-7 transition-colors hover:bg-paper sm:p-8"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.08em] text-sapphire">
                          <sample.Icon className="size-4" aria-hidden="true" />
                          {sample.category}
                        </span>
                        <span className="text-xs text-quiet">
                          詳しい本文あり
                        </span>
                      </div>
                      <h3 className="mt-7 font-mincho text-2xl leading-9 tracking-[-0.02em]">
                        {sample.title}
                      </h3>
                      <p className="mt-4 text-sm leading-7 text-quiet">
                        {sample.body}
                      </p>
                      <div className="mt-auto pt-8">
                        <p className="border-l-2 border-future-mint pl-4 text-xs font-semibold leading-6">
                          {sample.deliverable}
                        </p>
                        <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-sapphire">
                          教材を開く
                          <ArrowRight
                            className="size-3.5 transition-transform group-hover:translate-x-1"
                            aria-hidden="true"
                          />
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-6 border-t border-white/20 pt-7 sm:flex-row sm:items-start sm:justify-between">
              <p className="max-w-3xl text-xs leading-6 text-white/55">
                {allLessonDetailsPublished ? (
                  <>
                    どの教材にも、使う材料、手順、よくある失敗、完成の目安があります。
                  </>
                ) : (
                  <>詳しい手順がある教材から、順番に公開しています。</>
                )}
                順番に進めても、作りたいものから始めても大丈夫です。
              </p>
              <Link
                href={textbookExplorePath}
                className="soft-outline-button group inline-flex min-h-11 shrink-0 items-center justify-center gap-3 border border-white/35 px-5 text-xs font-semibold text-white transition-colors hover:border-white hover:bg-white hover:text-brand-dark"
              >
                教材テーマを見る
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </section>

        <section className="section-aura border-b border-rule bg-paper px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-sapphire">
                無料会員
              </p>
              <h2 className="soft-section-heading mt-5 font-mincho text-[clamp(2.5rem,5vw,4.8rem)] font-medium leading-[1.15] tracking-[-0.04em]">
                やりたい課題も、
                <br />
                できた課題も、残せる。
              </h2>
              <p className="mt-6 max-w-xl text-sm leading-8 text-quiet sm:text-base">
                教科書は登録なしで読めます。無料会員になると、やりたい課題や作ったものをマイページに残せます。
              </p>
              <Link
                className="button-glow group mt-8 inline-flex min-h-14 items-center gap-8 px-6 text-sm font-semibold text-white"
                href="/join"
              >
                無料会員になって課題を保存
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
              <p className="mt-3 text-xs text-quiet">
                登録は無料です。有料受講は、必要なときだけ選べます。
              </p>
            </div>

            <div className="soft-panel soft-panel-clip grid border border-rule bg-paper-white md:grid-cols-3">
              {[
                {
                  Icon: BookmarkCheck,
                  title: 'あとでやる',
                  body: '気になる課題を保存できます。',
                },
                {
                  Icon: CheckCircle2,
                  title: 'できた課題',
                  body: '終えた課題が、ひと目でわかります。',
                },
                {
                  Icon: FileCheck2,
                  title: '作ったもの',
                  body: 'あとから見返したり、人に見せたりできます。',
                },
              ].map(({ Icon, title, body }, index) => (
                <article
                  className="border-b border-rule p-6 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 sm:p-8"
                  key={title}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="soft-icon grid size-11 place-items-center bg-sapphire-soft text-sapphire">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="numeric-text text-xs text-quiet">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-6 font-mincho text-2xl">{title}</h3>
                  <p className="mt-4 text-xs leading-6 text-quiet">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="services"
          className="section-aura border-b border-rule bg-paper-white px-5 py-24 sm:px-8 sm:py-32"
        >
          <div className="mx-auto max-w-[1240px]">
            <SectionIntro
              label="受講方法"
              title={
                <>
                  ひとりで迷ったら、
                  <br />
                  講師と進める。
                </>
              }
              body={<p>有料の授業も、すべてWeb教科書に沿って進めます。</p>}
            />

            <div className="soft-panel soft-panel-clip mt-12 grid border border-rule bg-paper-white px-6 sm:grid-cols-3 sm:px-8">
              <div className="border-b border-rule py-5 sm:border-b-0 sm:border-r sm:pr-6">
                <p className="text-xs font-semibold text-human-coral">
                  {sharedFees.entranceCampaign}
                </p>
                <p className="numeric-text mt-2 text-2xl">
                  入会金 {sharedFees.entrance}
                </p>
                <p className="mt-2 text-xs text-quiet">
                  {sharedFees.entranceRegular}。定員に達し次第終了します
                </p>
              </div>
              <div className="border-b border-rule py-5 sm:border-b-0 sm:border-r sm:px-6">
                <p className="text-xs text-quiet">Web教科書</p>
                <p className="mt-2 font-mincho text-2xl">登録なしで完全無料</p>
                <p className="mt-2 text-xs text-quiet">
                  今日から、このサイトで始められます
                </p>
              </div>
              <div className="py-5 sm:pl-6">
                <p className="text-xs text-quiet">紙の教科書</p>
                <p className="numeric-text mt-2 text-2xl">1冊 2,000円前後</p>
                <p className="mt-2 text-xs text-quiet">
                  紙で読みたい方だけ購入できます
                </p>
              </div>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {joinPlans.map(
                ({
                  number,
                  Icon,
                  name,
                  price,
                  area,
                  summary,
                  timing,
                  badge,
                }) => (
                  <article
                    key={name}
                    className="soft-card soft-interactive flex min-h-full flex-col border border-rule bg-paper-white p-6 hover:bg-sapphire-soft/35 sm:p-8"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="numeric-text text-xs text-sapphire">
                        {number}
                      </span>
                      <span className="soft-badge border border-sapphire px-2.5 py-1 text-xs font-semibold text-sapphire">
                        {badge}
                      </span>
                    </div>
                    <Icon
                      className="mt-9 size-6 text-sapphire"
                      aria-hidden="true"
                    />
                    <h3 className="mt-5 font-mincho text-2xl leading-tight">
                      {name}
                    </h3>
                    <p className="numeric-text mt-6 text-2xl">{price}</p>
                    <dl className="mt-6 border-y border-rule py-4 text-xs">
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-quiet">対応地域</dt>
                        <dd className="font-semibold">{area}</dd>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-4">
                        <dt className="text-quiet">時間</dt>
                        <dd className="font-semibold">{timing}</dd>
                      </div>
                    </dl>
                    <p className="mt-5 text-sm leading-7 text-quiet">
                      {summary}
                    </p>
                    {number === '03' ? (
                      <p className="mt-4 border-l-2 border-future-mint pl-3 text-xs leading-6 text-quiet">
                        通い放題。会場は予約人数に合わせて、東京23区内で決めます。
                      </p>
                    ) : null}
                  </article>
                ),
              )}
            </div>

            <div className="soft-card mt-6 flex flex-col gap-5 border border-rule bg-sapphire-soft/55 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div>
                <p className="text-sm font-semibold">
                  無料会員登録後、マイページから申し込めます。
                </p>
                <p className="mt-2 text-xs leading-6 text-quiet">
                  希望を送ったあと、日程と料金を確認します。この時点では予約も支払いも確定しません。
                </p>
              </div>
              <Link
                className="button-glow inline-flex min-h-12 shrink-0 items-center gap-5 px-5 text-sm font-semibold text-white"
                href="/join"
              >
                無料会員登録
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section
          id="faq"
          className="section-aura border-t border-rule bg-paper-white px-5 py-24 sm:px-8 sm:py-32"
        >
          <div className="mx-auto grid max-w-[1240px] gap-12 lg:grid-cols-[minmax(260px,0.72fr)_minmax(0,1.55fr)] lg:gap-20">
            <div className="self-start border-t-2 border-brand-dark pt-6 lg:sticky lg:top-8">
              <p className="text-xs font-semibold tracking-[0.16em] text-sapphire">
                よくある質問
              </p>
              <h2 className="soft-section-heading mt-7 font-mincho text-[clamp(2.5rem,5vw,4.8rem)] font-medium leading-[1.16] tracking-[-0.04em]">
                始める前の、
                <br />
                よくある質問。
              </h2>
              <p className="mt-7 max-w-sm text-sm leading-8 text-quiet sm:text-base">
                初心者の方、料金、通い方について答えます。
              </p>
            </div>

            <FaqSection items={faqItems} />
          </div>
        </section>

        <section className="bg-brand-dark px-5 py-20 text-white sm:px-8 sm:py-24">
          <div className="soft-panel soft-dark-glow mx-auto grid max-w-[1240px] gap-10 border border-white/10 bg-white/[0.035] p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-white/65">
                今すぐ始める
              </p>
              <h2 className="mt-6 font-mincho text-[clamp(2.4rem,5.8vw,5.2rem)] font-medium leading-[1.16] tracking-[-0.04em]">
                今日、「できた」を一つ。
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/75">
                気になる課題を選んで、今から始められます。
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:min-w-[280px] lg:w-auto">
              <Link
                href={textbookGuidePath}
                className="button-glow group inline-flex min-h-14 items-center justify-between px-6 text-sm font-semibold text-white"
              >
                WEB教科書で学ぶ（無料）
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href="/join"
                className="soft-outline-button inline-flex min-h-14 items-center justify-between gap-3 border border-white/45 px-6 text-sm font-semibold transition-colors hover:bg-white hover:text-sapphire"
              >
                無料会員登録
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
