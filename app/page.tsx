import {
  AppWindow,
  ArrowRight,
  BookOpenText,
  CalendarCheck2,
  CalendarDays,
  Check,
  FileSpreadsheet,
  Images,
  Presentation,
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
import { GoalSection } from '@/components/home/goal-section';
import { LearningCycleSection } from '@/components/home/learning-cycle-section';
import { QuickStartSection } from '@/components/home/quick-start-section';
import { SectionIntro } from '@/components/home/section-intro';
import { OnlinePriceSpotlight } from '@/components/online-price-spotlight';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { memberServicePlans, sharedFees } from '@/lib/member-service-plans';
import { canonicalPublicPath } from '@/lib/site-paths';
import { faqItems } from '@/lib/site-content';
import { textbookCatalog } from '@/lib/textbook-catalog';
import heroFutureImage from '@/sozai/kazoku-sougen.jpg';
import onlineImage from '@/sozai/zaitaku-pc.jpg';

export const metadata: Metadata = {
  alternates: { canonical: canonicalPublicPath() },
};

const curriculumTracks = [
  {
    index: '01',
    role: '技術の幹',
    english: 'COMMON',
    title: 'AIを使う技術',
    body: 'AI秘書、調査、データ、Web、認証、連携、安全運用まで。作りたいものに必要な技術の章を選びます。',
    examples: '文章・調査・データ・Web・安全',
  },
  {
    index: '02',
    role: '仕事の担当',
    english: 'DEPARTMENT',
    title: '担当業務の実践',
    body: '経営、営業、経理、人事、製造、AI推進など。自分の担当業務で使える一つの成果物を育てます。',
    examples: '経営・営業・経理・人事・製造・AI推進',
  },
  {
    index: '03',
    role: '現場の舞台',
    english: 'INDUSTRY',
    title: '業界ごとの実践',
    body: '小売、飲食、美容、宿泊、建設、不動産、製造、教育など。業界固有の仕事を一つの流れにつなぎます。',
    examples: '小売・飲食・美容・宿泊・建設・製造',
  },
  {
    index: '04',
    role: '表現の工房',
    english: 'CREATION',
    title: '作品づくり',
    body: '本、SNS、画像、動画、音声、Web、ゲーム、スマホアプリ、PowerPoint、Excelなど。一作品の表現・体験と、毎日使える仕事ファイルを磨きます。',
    examples: '本・SNS・画像・動画・Web・ゲーム・アプリ・資料・Excel',
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
  href: '/textbook?task=SLS-05',
  Icon: CalendarCheck2,
} as const;

const textbookSampleCards = [
  {
    category: '数字・事務',
    title: '商品と数を選ぶだけ。合計が出る見積書Excelを。',
    body: '合計・税・印刷まで整え、あとから自分で直せる見積書を作ります。',
    deliverable: '見積書.xlsx／商品マスター／計算照合表',
    note: '発行前に、金額・税・宛先を人が確認',
    href: '/textbook?task=XLS-03',
    Icon: FileSpreadsheet,
  },
  {
    category: '会社・お店',
    title: '会社や店の魅力が伝わる、スマホサイトを。',
    body: 'サービス、料金、FAQ、相談への入口を整理し、お客様が迷わない画面にします。',
    deliverable: 'スマホ対応の会社ホームページ',
    note: 'まず手元で確認。公開は内容確認後の別工程',
    href: '/textbook?task=Lv.80',
    Icon: Smartphone,
  },
  {
    category: '説明・提案',
    title: '3分で伝わる、5枚のPowerPointを。',
    body: '課題、解決策、効果、お願いを、あとから編集できる資料へまとめます。',
    deliverable: '編集できるPowerPoint／3分説明原稿',
    note: '開いて文字を直し、保存できる所まで確認',
    href: '/textbook?task=SLD-03',
    Icon: Presentation,
  },
  {
    category: 'SNS・発信',
    title: 'SNSにもサイトにも使える「顔」を4サイズ。',
    body: '一つの企画から、横長・縦長・文字入り・文字なしを作り、発信の見た目をそろえます。',
    deliverable: '主画像4版／レイアウト指示／修正履歴',
    note: '文字・権利・不自然な箇所を人が確認',
    href: '/textbook?task=IMG-03',
    Icon: Images,
  },
  {
    category: '自分専用ツール',
    title: '毎日の面倒を、自分専用アプリへ。',
    body: '登録、保存、編集、完了、削除まで動く、小さなルーティン管理アプリを作ります。',
    deliverable: 'スマホで使えるローカル保存アプリ',
    note: '全ボタンと、閉じた後の保存まで試す',
    href: '/textbook?task=APP-04',
    Icon: AppWindow,
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
                    藤本実学塾｜AI未経験から始める実学
                  </p>
                </div>

                <h1
                  id="hero-title"
                  className="text-soft-glow mt-10 font-mincho text-[clamp(3rem,6.6vw,6.3rem)] font-medium leading-[1.08] tracking-[-0.055em]"
                >
                  AIを、
                  <br />
                  すべての人の
                  <br />
                  <span className="text-highlight text-human-coral">
                    実学へ。
                  </span>
                </h1>

                <p className="mt-9 max-w-[650px] text-base leading-8 text-quiet sm:text-lg sm:leading-9">
                  わからないまま、来てください。はじめて触るところから、暮らし・仕事・チームに必要なところまで。自分のペースで、使えるものを一つずつ作ります。
                </p>

                <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/textbook"
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
                    Web教科書は登録なしで無料。会員登録は記録や相談を使いたい方向け
                  </p>
                  <p className="flex items-center gap-3">
                    <CalendarDays
                      className="size-4 text-sapphire"
                      aria-hidden="true"
                    />
                    対面自習式は2026年11月1日開始予定
                  </p>
                </div>
              </div>
            </div>

            <figure className="relative min-h-[360px] overflow-hidden bg-rule sm:min-h-[440px] lg:min-h-full">
              <Image
                src={heroFutureImage}
                alt="AIを学んだ先の、穏やかな暮らしを表したイメージ写真"
                fill
                priority
                sizes="(min-width: 1024px) 48vw, 100vw"
                className="object-cover object-center saturate-[0.97]"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"
                aria-hidden="true"
              />
              <figcaption className="absolute bottom-4 right-4 rounded-full bg-black/45 px-3 py-1.5 text-xs text-white/85 backdrop-blur-sm">
                素材写真
              </figcaption>
            </figure>
          </div>
        </section>

        <QuickStartSection />

        <FutureSection />

        <GoalSection />

        <section
          id="curriculum"
          className="relative overflow-hidden bg-brand-dark px-5 py-24 text-white sm:px-8 sm:py-32"
        >
          <div
            className="editorial-grid pointer-events-none absolute inset-0"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-[1240px]">
            <SectionIntro
              index="03"
              label="CURRICULUM MAP"
              light
              title={
                <>
                  今つくりたいものが、
                  <br />
                  学びの入口になる。
                </>
              }
              body={
                <>
                  <p>
                    藤本実学塾では、暮らしや仕事で本当に使いたいものから教材を選びます。技術・担当業務・業種・表現の4つの入口から、足りない力だけを組み合わせ、一つの成果物を使える形まで育てます。
                  </p>
                  <p className="mt-3 text-sm text-white/55">
                    最初から最後まで順番に受ける必要はありません。今の目的に合うところから始められます。
                  </p>
                </>
              }
            />

            <div className="soft-panel soft-panel-clip soft-dark-glow mt-16 border border-white/20 bg-[#173743]/75">
              <div className="grid border-b border-white/20 lg:grid-cols-[0.72fr_1.28fr]">
                <div className="flex min-h-[290px] flex-col justify-between border-b border-white/20 p-7 sm:p-10 lg:border-b-0 lg:border-r lg:p-12">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.16em] text-white/65">
                      CURRENT PROJECT
                    </p>
                    <p className="mt-7 font-mincho text-3xl leading-[1.45] sm:text-4xl">
                      つくりたい一つから、
                      <br />
                      未来が動き出す。
                    </p>
                  </div>
                  <p className="mt-10 max-w-md text-sm leading-7 text-white/60">
                    同じものを教材ごとに作り直しません。完成した素材を受け取り、必要な部分だけを加えて、今つくっているものへ戻します。
                  </p>
                </div>

                <div className="grid sm:grid-cols-2">
                  {curriculumTracks.map((track) => (
                    <article
                      key={track.index}
                      className="group border-b border-white/20 p-7 transition-colors hover:bg-white/[0.035] sm:p-8 sm:[&:nth-child(odd)]:border-r sm:[&:nth-last-child(-n+2)]:border-b-0"
                    >
                      <div className="flex items-start justify-between gap-5">
                        <div className="w-full">
                          <p className="text-xs font-semibold tracking-[0.14em] text-future-mint">
                            {track.role} / {track.english}
                          </p>
                          <h3 className="mt-4 font-mincho text-2xl">
                            {track.title}
                          </h3>
                        </div>
                      </div>
                      <p className="mt-6 text-sm leading-7 text-white/65">
                        {track.body}
                      </p>
                      <p className="mt-5 border-t border-white/15 pt-4 text-xs leading-6 text-white/60">
                        {track.examples}
                      </p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
                <div className="border-b border-white/20 p-7 sm:p-10 lg:border-b-0 lg:border-r lg:p-12">
                  <p className="text-xs font-semibold tracking-[0.14em] text-future-mint">
                    全体を支える運用 / LEARNING SYSTEM
                  </p>
                  <p className="mt-5 font-mincho text-2xl leading-9">
                    保存場所・会話・版・証拠・費用・引き継ぎ
                  </p>
                  <p className="mt-4 text-sm leading-7 text-white/55">
                    作ったものを毎回白紙へ戻さず、講師や教材が変わっても続きから進めるための共通ルールです。
                  </p>
                </div>
                <div className="p-7 sm:p-10 lg:p-12">
                  <p className="text-xs font-semibold tracking-[0.14em] text-white/65">
                    たとえば、美容室の予約サイトなら
                  </p>
                  <p className="mt-5 font-mincho text-2xl leading-10 sm:text-3xl sm:leading-[1.55]">
                    「業界ごとの実践」から美容を選び、「AIを使う技術」からWebと受付を加え、見た目を磨く時だけ「作品づくり」を使います。
                  </p>
                  <p className="mt-5 text-sm leading-7 text-white/55">
                    三つのサイトを作るのではなく、一つのサイトを完成させます。
                  </p>
                </div>
              </div>
            </div>

            <div className="soft-panel soft-panel-clip mt-6 grid border border-white/20 bg-white/[0.025] sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['技術が足りない', 'AIを使う技術へ'],
                ['仕事の判断が足りない', '担当業務の実践へ'],
                ['業界の条件が足りない', '業界ごとの実践へ'],
                ['表現の質を上げたい', '作品づくりへ'],
              ].map(([question, answer]) => (
                <div
                  key={question}
                  className="border-b border-white/20 p-5 sm:[&:nth-child(odd)]:border-r lg:border-r lg:last:border-r-0"
                >
                  <p className="text-xs leading-6 text-white/65">{question}</p>
                  <p className="mt-2 font-mincho text-lg text-white/85">
                    {answer}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs leading-6 text-white/65">
              教材内の番号は、人の優劣ではなく、作品の利用者数・データ・接続・権限・復旧など、技術と運用範囲の難易度を表します。
            </p>
            <Link
              className="soft-outline-button mt-8 inline-flex min-h-12 items-center gap-6 border border-white/35 px-5 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-brand-dark"
              href="/textbook"
            >
              作りたいものから教材を探す
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <LearningCycleSection />

        <section
          id="textbook"
          className="bg-brand-dark px-5 py-24 text-white sm:px-8 sm:py-32"
        >
          <div className="mx-auto max-w-[1240px]">
            <SectionIntro
              index="05"
              label="PRACTICAL TEXTBOOK"
              light
              title={
                <>
                  明日、仕事で使うものを
                  <br />
                  つくる。
                </>
              }
              body={
                <p>
                  メールの言い換えだけでは終わりません。商談後の段取り、見積書、ホームページ、PowerPoint、発信用画像、自分用アプリまで。欲しい完成物から教材を選べます。
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
                    <p className="mt-6 max-w-2xl text-sm leading-8 text-quiet sm:text-base">
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
                        className="button-glow group inline-flex min-h-11 shrink-0 items-center justify-center gap-3 px-5 text-xs font-semibold text-white"
                      >
                        この教材を開く
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

              <div className="grid divide-y divide-rule border-t border-rule sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {textbookSampleCards.slice(2).map((sample) => (
                  <Link
                    key={sample.href}
                    href={sample.href}
                    className="group flex min-h-[360px] flex-col p-7 transition-colors hover:bg-paper sm:p-8"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="grid size-10 place-items-center bg-brand-dark text-future-mint transition-colors group-hover:bg-sapphire group-hover:text-white">
                        <sample.Icon className="size-5" aria-hidden="true" />
                      </span>
                      <span className="text-xs font-semibold tracking-[0.06em] text-quiet">
                        {sample.category}
                      </span>
                    </div>
                    <h3 className="mt-7 font-mincho text-2xl leading-9 tracking-[-0.02em]">
                      {sample.title}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-quiet">
                      {sample.body}
                    </p>
                    <div className="mt-auto pt-8">
                      <p className="text-xs font-semibold leading-6">
                        {sample.deliverable}
                      </p>
                      <p className="mt-2 text-xs leading-6 text-quiet">
                        {sample.note}
                      </p>
                      <p className="mt-5 flex items-center gap-2 text-xs font-semibold text-sapphire">
                        この課題を開く
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

            <div className="mt-7 flex flex-col gap-6 border-t border-white/20 pt-7 sm:flex-row sm:items-start sm:justify-between">
              <p className="max-w-3xl text-xs leading-6 text-white/55">
                {allLessonDetailsPublished ? (
                  <>
                    公開中のすべての教材に、使う材料、最初の一言、実際に触る手順、やりがちなミス、完成条件までの固有の本文があります。
                  </>
                ) : (
                  <>
                    詳しい手順を公開している教材と、選べる骨格を先に公開している教材があります。詳しい本文は制作できた課題から順次反映します。
                  </>
                )}
                各章は、前の課題の完成品を育てて一つの成果物へ届く構成です。正式な修了条件・修了証は別途案内します。
              </p>
              <Link
                href="/textbook"
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

        <section
          id="services"
          className="section-aura border-b border-rule bg-paper-white px-5 py-24 sm:px-8 sm:py-32"
        >
          <div className="mx-auto max-w-[1240px]">
            <SectionIntro
              index="06"
              label="HOW TO JOIN"
              title={
                <>
                  3つの学び方から、
                  <br />
                  今に合うものを。
                </>
              }
              body={
                <p>
                  教科書を見て自分で進むか、先生と一緒に進むか。まず無料会員になり、マイページから住んでいる場所、人数、作りたいものに合う方法を選びます。
                </p>
              }
            />

            <ol className="soft-panel soft-panel-clip mt-12 grid border border-rule bg-paper-white sm:grid-cols-5">
              {[
                ['01', '無料会員登録'],
                ['02', '学び方を選ぶ'],
                ['03', '希望を送る'],
                ['04', '条件を確認'],
                ['05', '受講を開始'],
              ].map(([number, label]) => (
                <li
                  className="border-b border-r border-rule bg-paper-white p-5"
                  key={number}
                >
                  <span className="numeric-text text-xs text-sapphire">
                    {number}
                  </span>
                  <p className="mt-3 text-sm font-semibold">{label}</p>
                </li>
              ))}
            </ol>

            <div className="soft-panel soft-panel-clip mt-14 grid border border-rule bg-paper-white px-6 sm:grid-cols-3 sm:px-8">
              <div className="border-b border-rule py-5 sm:border-b-0 sm:border-r sm:pr-6">
                <p className="text-xs text-quiet">共通の入会金</p>
                <p className="numeric-text mt-2 text-2xl">
                  {sharedFees.entrance}
                </p>
                <p className="mt-2 text-xs text-quiet">
                  いずれの受講方法にも必要です
                </p>
              </div>
              <div className="border-b border-rule py-5 sm:border-b-0 sm:border-r sm:px-6">
                <p className="text-xs text-quiet">Web教科書</p>
                <p className="mt-2 font-mincho text-2xl">登録なしで完全無料</p>
                <p className="mt-2 text-xs text-quiet">
                  公開中の教材から今日すぐ始められます
                </p>
              </div>
              <div className="py-5 sm:pl-6">
                <p className="text-xs text-quiet">紙の教科書</p>
                <p className="numeric-text mt-2 text-2xl">1冊 2,000円前後</p>
                <p className="mt-2 text-xs text-quiet">
                  希望する方だけ購入できます
                </p>
              </div>
            </div>

            <OnlinePriceSpotlight className="mt-10" />

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
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
                        通い放題。予約人数に応じて、東京23区内の会場を毎回変更します。
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
                  まず受講希望を受付し、運営が日程と条件を確認します。送信だけで予約・契約・決済は確定しません。
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

            <figure className="soft-panel soft-panel-clip image-soft-zoom mt-10 grid border border-rule md:grid-cols-[0.82fr_1.18fr]">
              <div className="relative min-h-[300px] bg-rule">
                <Image
                  src={onlineImage}
                  alt="Google Meetで画面を共有しながら相談するイメージ写真"
                  fill
                  sizes="(min-width: 768px) 40vw, 100vw"
                  className="object-cover"
                />
                <span className="absolute bottom-4 left-4 rounded-full bg-brand-dark/80 px-3 py-1.5 text-[10px] font-semibold tracking-[0.08em] text-white backdrop-blur-sm">
                  素材写真
                </span>
              </div>
              <figcaption className="flex items-center p-7 sm:p-10">
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] text-sapphire">
                    GOOGLE MEET
                  </p>
                  <p className="mt-5 font-mincho text-3xl leading-tight">
                    場所が離れていても、
                    <br />
                    同じ画面を見ながら進めます。
                  </p>
                  <p className="mt-5 max-w-xl text-sm leading-7 text-quiet">
                    家庭教師型（オンライン）は全国から受講できます。Google
                    Meetで同じ画面を見ながら、50分で一つの成果物を進めます。
                  </p>
                </div>
              </figcaption>
            </figure>
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
                迷いを、
                <br />
                ひとつずつ
                <br />
                ほどく。
              </h2>
              <p className="mt-7 max-w-sm text-sm leading-8 text-quiet sm:text-base">
                学び方、通い方、料金、講師について。はじめる前によく聞かれることをまとめました。
              </p>

              <div className="mt-10 border-y border-rule py-5">
                <p className="flex items-center gap-3 text-sm leading-7 text-quiet">
                  <ArrowRight
                    className="size-4 shrink-0 text-sapphire"
                    aria-hidden="true"
                  />
                  気になる項目を選ぶと、その場で回答を読めます。
                </p>
              </div>
            </div>

            <FaqSection items={faqItems} />
          </div>
        </section>

        <section className="bg-brand-dark px-5 py-20 text-white sm:px-8 sm:py-24">
          <div className="soft-panel soft-dark-glow mx-auto grid max-w-[1240px] gap-10 border border-white/10 bg-white/[0.035] p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-white/65">
                START FREE
              </p>
              <h2 className="mt-6 font-mincho text-[clamp(2.4rem,5.8vw,5.2rem)] font-medium leading-[1.16] tracking-[-0.04em]">
                まずは0円で、自分で進める。
                <br />
                迷ったときだけ、講師に聞く。
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/75">
                Web教科書は登録なしで無料です。公開中の教材から、今日すぐに始められます。
                {!allLessonDetailsPublished
                  ? '詳しい本文は順次公開します。'
                  : null}
                講師へ相談したくなったときだけ、無料会員マイページから希望する受講方法を選べます。
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:min-w-[280px] lg:w-auto">
              <Link
                href="/textbook"
                className="button-glow group inline-flex min-h-14 items-center justify-between px-6 text-sm font-semibold text-white"
              >
                0円で教科書を始める
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href="/join"
                className="soft-outline-button inline-flex min-h-14 items-center justify-between gap-3 border border-white/45 px-6 text-sm font-semibold transition-colors hover:bg-white hover:text-sapphire"
              >
                迷ったときの受講を申し込む
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
