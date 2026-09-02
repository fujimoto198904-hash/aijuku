import type { Metadata } from 'next';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ExternalLink,
  FileUp,
  LockKeyhole,
  MessageSquareText,
  Settings2,
  Sparkles,
  TerminalSquare,
} from 'lucide-react';

import { BrandMark } from '@/components/brand-mark';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import Link from '@/components/site-link';
import { TextbookAccessLegend } from '@/components/textbook/access-badges';
import { TextbookSubnav } from '@/components/textbook/textbook-subnav';
import { canonicalPublicPath } from '@/lib/site-paths';
import { textbookExplorePath, textbookLessonPath } from '@/lib/textbook-routes';

export const metadata: Metadata = {
  title: 'ChatGPTの始め方・設定・プラン｜Web教科書｜藤本実学塾',
  description:
    'ChatGPTの無料・有料プランの違い、Chat・Work・Codexの使い分け、最初に確認する設定を初心者向けに案内します。',
  alternates: { canonical: canonicalPublicPath('/textbook/setup') },
};

const setupSteps = [
  {
    number: '01',
    title: '今のプランと残り利用量を見る',
    body: 'プロフィールから設定を開き、Freeか有料かを確認します。Codexを使う時は、利用量や次のリセット表示も確認します。この時点で購入する必要はありません。',
    Icon: Settings2,
  },
  {
    number: '02',
    title: 'データの扱いと会社のルールを確かめる',
    body: '設定のData Controlsを開き、履歴やデータの扱いを自分の方針に合わせます。仕事の資料は会社のルールを優先し、秘密情報は設定にかかわらず入力しません。',
    Icon: LockKeyhole,
  },
  {
    number: '03',
    title: '返事の好みを4つだけ伝える',
    body: 'Settings → Personalization で「呼ばれたい名前」「仕事」「返事の長さ」「避けたい言い方」を入れます。完璧に書く必要はなく、Lv.01で一緒に設定文を作れます。',
    Icon: MessageSquareText,
  },
  {
    number: '04',
    title: '架空データを1つ貼ってみる',
    body: 'いきなり本物の顧客情報を使わず、この教科書の架空メールや練習ファイルを貼ります。クリップ・ファイル選択が見当たらない時は、まず文章の中身だけ貼れば進められます。',
    Icon: FileUp,
  },
] as const;

const workspaces = [
  {
    label: 'Chat',
    title: '聞く・書く・一つずつ直す',
    body: '質問、メール、要約、アイデア、短いデータの確認に向いています。最初の一歩はほとんどChatから始められます。',
    Icon: MessageSquareText,
    className: 'border-success/30 bg-future-mint-soft text-success',
  },
  {
    label: 'Work',
    title: '調べる・複数工程を一つの完成品へ',
    body: '複数の資料を読み、文書・表・スライド・サイトなどを完成まで進める時に便利です。表示されない時はChatで分けて作れます。',
    Icon: Sparkles,
    className: 'border-warning/30 bg-sunrise-soft text-warning',
  },
  {
    label: 'Codex',
    title: '実ファイル・コード・テストを扱う',
    body: 'フォルダやリポジトリを開き、複数ファイルの変更、コマンド、テスト、プレビューを行う時に向いています。料金プランの名前ではありません。',
    Icon: TerminalSquare,
    className: 'border-sapphire/30 bg-sapphire-soft text-sapphire',
  },
] as const;

const officialLinks = [
  {
    label: 'Freeプランで使える機能と上限',
    href: 'https://help.openai.com/en/articles/9275245-using-chatgpt-s-free-tier-faq',
  },
  {
    label: 'Chat・Work・Codexの使い分け',
    href: 'https://learn.chatgpt.com/docs/use-chatgpt',
  },
  {
    label: 'パーソナライズとCustom Instructions',
    href: 'https://learn.chatgpt.com/docs/personalize',
  },
  {
    label: 'CodexとChatGPTプラン',
    href: 'https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan',
  },
] as const;

export default function TextbookSetupPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="min-h-screen bg-paper text-ink">
        <TextbookSubnav current="setup" />

        <section className="section-aura border-b border-rule bg-deep-green px-5 py-14 text-white sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="mx-auto grid w-full max-w-[1240px] gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:items-end lg:gap-16">
            <div>
              <div className="flex items-center gap-4">
                <BrandMark className="size-10" framed />
                <p className="text-xs font-semibold tracking-[0.16em] text-future-mint">
                  CHATGPT START GUIDE
                </p>
              </div>
              <h1 className="text-soft-glow mt-7 max-w-4xl font-mincho text-[clamp(2.8rem,6vw,5.8rem)] font-medium leading-[1.1] tracking-[-0.045em]">
                無料から、
                <br />
                迷わず一つ作る。
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-9 text-white/75">
                ChatGPTの設定、無料と有料の違い、Chat・Work・Codexの使い分けを、始める前に確認できます。
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  className="button-glow inline-flex min-h-14 items-center justify-between gap-8 px-6 text-sm font-semibold text-white"
                  href={textbookExplorePath}
                >
                  無料で始めやすい課題を探す
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  className="soft-outline-button inline-flex min-h-14 items-center justify-center gap-3 border border-white/35 px-6 text-sm font-semibold text-white hover:bg-white hover:text-deep-green"
                  href={textbookLessonPath('Lv.01')}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Lv.01で設定文を作る
                  <ExternalLink className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <aside className="soft-card border border-white/20 bg-white/10 p-7 backdrop-blur-sm sm:p-8">
              <p className="text-xs font-semibold tracking-[0.14em] text-future-mint">
                2026年9月3日 確認
              </p>
              <p className="mt-4 font-mincho text-2xl leading-9">
                ボタンの名前や使える量は、変わることがあります。
              </p>
              <p className="mt-4 text-xs leading-7 text-white/65">
                プラン、端末、地域、会社の設定で表示は変わります。このページと違う時は、いま開いているChatGPTとOpenAI公式画面を優先してください。
              </p>
            </aside>
          </div>
        </section>

        <section className="border-b border-rule bg-paper px-5 py-14 sm:px-8 sm:py-18 lg:px-10">
          <div className="mx-auto w-full max-w-[1240px]">
            <TextbookAccessLegend showLink={false} />
          </div>
        </section>

        <section className="border-b border-rule bg-paper-white px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
          <div className="mx-auto w-full max-w-[1240px]">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold tracking-[0.16em] text-sapphire">
                TWO DIFFERENT CHOICES
              </p>
              <h2 className="soft-section-heading mt-5 font-mincho text-[clamp(2.35rem,5vw,4.7rem)] leading-[1.15]">
                料金と作業画面を、
                <br />
                分けて考える。
              </h2>
              <p className="mt-6 text-sm leading-8 text-quiet">
                Freeか有料かは「使える量や一部機能」の選択。Chat・Work・Codexは「作業の進め方」の選択です。有料にするとCodexになる、という関係ではありません。
              </p>
            </div>

            <div className="soft-panel soft-panel-clip mt-12 grid border border-rule bg-paper lg:grid-cols-2">
              <article className="border-b border-rule p-7 sm:p-9 lg:border-b-0 lg:border-r">
                <p className="text-xs font-semibold tracking-[0.12em] text-success">
                  料金プラン
                </p>
                <h3 className="mt-4 font-mincho text-3xl">無料 / 有料</h3>
                <p className="mt-5 text-sm leading-8 text-quiet">
                  Freeでも通常の会話、Web検索、ファイル添付、データ分析、画像作成を試せます。ファイル・画像・分析などは個別の利用上限があり、有料はその上限が高くなるのが主な違いです。
                </p>
              </article>
              <article className="p-7 sm:p-9">
                <p className="text-xs font-semibold tracking-[0.12em] text-sapphire">
                  作業環境
                </p>
                <h3 className="mt-4 font-mincho text-3xl">
                  Chat / Work / Codex
                </h3>
                <p className="mt-5 text-sm leading-8 text-quiet">
                  質問や短い作業はChat、複数工程の完成品はWork、実コードとテストを直接扱う時はCodexが目安です。この教科書にはChat・Workの代替手順があるため、現時点で「Codexだけでしか完了できない課題」はありません。
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="border-b border-rule bg-paper px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
          <div className="mx-auto w-full max-w-[1240px]">
            <p className="text-xs font-semibold tracking-[0.16em] text-rust">
              FIRST FOUR CHECKS
            </p>
            <h2 className="soft-section-heading mt-5 max-w-4xl font-mincho text-[clamp(2.35rem,5vw,4.7rem)] leading-[1.15]">
              最初の3分。
              <br />
              この4つだけ確かめる。
            </h2>

            <ol className="mt-12 grid gap-4 md:grid-cols-2">
              {setupSteps.map(({ number, title, body, Icon }) => (
                <li
                  key={number}
                  className="soft-card border border-rule bg-paper-white p-7 sm:p-8"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="soft-icon grid size-12 place-items-center bg-sapphire-soft text-sapphire">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="numeric-text text-sm text-quiet">
                      {number}
                    </span>
                  </div>
                  <h3 className="mt-6 font-mincho text-2xl leading-9">
                    {title}
                  </h3>
                  <p className="mt-4 text-sm leading-8 text-quiet">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-b border-rule bg-paper-white px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
          <div className="mx-auto w-full max-w-[1240px]">
            <p className="text-xs font-semibold tracking-[0.16em] text-sapphire">
              CHOOSE YOUR WORKSPACE
            </p>
            <h2 className="soft-section-heading mt-5 max-w-4xl font-mincho text-[clamp(2.35rem,5vw,4.7rem)] leading-[1.15]">
              作りたい物で、
              <br />
              画面を選ぶ。
            </h2>

            <div className="soft-panel soft-panel-clip mt-12 grid border border-rule bg-paper lg:grid-cols-3">
              {workspaces.map(({ label, title, body, Icon, className }) => (
                <article
                  key={label}
                  className="border-b border-rule p-7 last:border-b-0 sm:p-9 lg:border-b-0 lg:border-r lg:last:border-r-0"
                >
                  <span
                    className={`soft-icon grid size-12 place-items-center border ${className}`}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <p className="mt-7 text-xs font-semibold tracking-[0.14em] text-rust">
                    {label}
                  </p>
                  <h3 className="mt-3 font-mincho text-2xl leading-9">
                    {title}
                  </h3>
                  <p className="mt-5 text-sm leading-8 text-quiet">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-rule bg-deep-green px-5 py-16 text-white sm:px-8 sm:py-22 lg:px-10">
          <div className="mx-auto grid w-full max-w-[1240px] gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div>
              <LockKeyhole
                className="size-8 text-future-mint"
                aria-hidden="true"
              />
              <h2 className="mt-6 font-mincho text-4xl leading-[1.25]">
                最初は、本物のデータを入れない。
              </h2>
              <p className="mt-5 text-sm leading-8 text-white/65">
                個人情報、顧客情報、会社の秘密、パスワード、APIキーはそのまま貼りません。まずは教科書の架空データで練習します。
              </p>
            </div>
            <ul className="soft-card grid gap-4 border border-white/15 bg-white/8 p-7 sm:p-9">
              {[
                '仕事の資料は、会社のAI利用ルールと使用許可を先に確認する',
                '実在する人の名前、電話、メール、口座、診断情報などは架空に置き換える',
                '外部接続、送信、予約、決済、公開は、必ず本人が内容と宛先を確認する',
                '機能が見当たらない時は、設定を無理に変えず、Chatの代替手順で続ける',
              ].map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-sm leading-8 text-white/75"
                >
                  <Check
                    className="mt-1.5 size-4 shrink-0 text-future-mint"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-b border-rule bg-paper px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
          <div className="mx-auto grid w-full max-w-[1240px] gap-10 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-rust">
                WHEN YOU HIT A LIMIT
              </p>
              <h2 className="mt-5 font-mincho text-4xl leading-[1.25]">
                無料の上限に達しても、失敗ではありません。
              </h2>
            </div>
            <div className="soft-card border border-rule bg-paper-white p-7 sm:p-9">
              <ul className="grid gap-4 text-sm leading-8 text-quiet">
                {[
                  '画面に出たリセット時間まで待つ',
                  '複数ファイルを1つずつに分ける',
                  'ファイルを添付せず、必要な文章だけ貼る',
                  'Workの代わりにChatで作り、完成品を自分で保存する',
                  '緑の「無料で始めやすい」が付いた別の課題へ先に進む',
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <CheckCircle2
                      className="mt-1.5 size-4 shrink-0 text-success"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-b border-rule bg-paper-white px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
          <div className="mx-auto w-full max-w-[1240px]">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-sapphire">
                  OPENAI OFFICIAL
                </p>
                <h2 className="mt-5 font-mincho text-4xl leading-[1.25]">
                  変わる情報は、公式で確かめる。
                </h2>
                <p className="mt-5 text-sm leading-8 text-quiet">
                  料金、回数、対象プランをこの教科書で固定しません。購入や設定変更の前に、必ず現在の公式画面を見ます。
                </p>
              </div>
              <ul className="soft-card divide-y divide-rule border border-rule bg-paper">
                {officialLinks.map((item) => (
                  <li key={item.href}>
                    <a
                      className="group flex min-h-16 items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-deep-green hover:bg-sapphire-soft"
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.label}
                      <ExternalLink
                        className="size-4 shrink-0 text-sapphire transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-paper-white px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
          <div className="soft-panel soft-panel-clip mx-auto grid w-full max-w-[1240px] gap-8 overflow-hidden border border-sapphire bg-sapphire-soft p-8 sm:p-12 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-sapphire">
                READY TO START
              </p>
              <h2 className="mt-5 max-w-3xl font-mincho text-[clamp(2.2rem,4vw,4rem)] leading-[1.2]">
                設定を完璧にしてから、始めなくていい。
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-8 text-quiet">
                無料プランで一つ作り、足りなくなった機能だけ後から選べば大丈夫です。
              </p>
            </div>
            <Link
              className="button-glow inline-flex min-h-14 items-center justify-between gap-8 px-6 text-sm font-semibold text-white"
              href={textbookExplorePath}
            >
              学ぶことを探す
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
