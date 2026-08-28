import Image from 'next/image';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpenText,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  CodeXml,
  Download,
  Footprints,
  Laptop,
  MapPin,
  MessageCircleQuestion,
  MoonStar,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
  WandSparkles,
} from 'lucide-react';

import { FaqSection } from '@/components/faq-section';
import { MissionExplorer } from '@/components/mission-explorer';
import { SiteFooter } from '@/components/site-footer';
import { learningStages } from '@/lib/site-content';

const levelDots = Array.from({ length: 21 }, (_, index) => index);

const outcomes = [
  {
    level: 'LV.08',
    title: '信頼できる情報を調べる',
    detail: '地域別最低賃金を、出典・発効日つきの表にする',
    tag: 'RESEARCH',
  },
  {
    level: 'LV.42',
    title: 'ホームページを公開する',
    detail: '企画からスマホ対応、公開、動作確認まで進める',
    tag: 'PUBLISH',
  },
  {
    level: 'LV.55',
    title: '自分専用アプリを作る',
    detail: '毎日使えるルーティンチェックを完成させる',
    tag: 'BUILD',
  },
  {
    level: 'LV.68',
    title: '毎朝届く新聞を作る',
    detail: '情報収集、要約、重複排除、定時配信を自動化する',
    tag: 'AUTOMATE',
  },
  {
    level: 'LV.78',
    title: '業務システムを試作する',
    detail: '架空データで、安全な出退勤Webアプリを作る',
    tag: 'SYSTEM',
  },
  {
    level: 'LV.100',
    title: '現場の課題を解決する',
    detail: '設計、公開、計測、改善、引き継ぎまでやり切る',
    tag: 'IMPACT',
  },
] as const;

const featureCards = [
  {
    number: '01',
    Icon: Target,
    title: '100の実務ミッション',
    text: '読むだけでは終わりません。毎回、仕事や暮らしで使える成果物をひとつ完成させます。',
    color: 'cyan',
  },
  {
    number: '02',
    Icon: Footprints,
    title: '自分のペースで進む',
    text: '一斉授業はありません。得意なところは速く、難しいところはじっくり。休んでも続きから。',
    color: 'amber',
  },
  {
    number: '03',
    Icon: MessageCircleQuestion,
    title: '詰まった時だけMONへ',
    text: '答えを代わりに作るのではなく、次の一手が見えるヒントを。自走できる力を育てます。',
    color: 'coral',
  },
  {
    number: '04',
    Icon: MoonStar,
    title: '平日の夜、何度でも',
    text: '18:00〜21:00、予約枠と空席の範囲内で何度でも。仕事帰りに「できた」を増やせます。',
    color: 'lime',
  },
] as const;

function accentClasses(color: string) {
  if (color === 'amber') return 'bg-amber/14 text-[#9a6413]';
  if (color === 'coral') return 'bg-coral/12 text-coral';
  if (color === 'lime') return 'bg-lime/22 text-[#4d7207]';
  return 'bg-cyan/16 text-[#087f91]';
}

function SectionLabel({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <div className={`mb-5 flex items-center gap-3 font-mono text-[10px] font-bold tracking-[0.2em] ${light ? 'text-cyan' : 'text-coral'}`}>
      <span className={`h-px w-7 ${light ? 'bg-cyan' : 'bg-coral'}`} aria-hidden="true" />
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="hero-grid relative min-h-[760px] bg-ink text-ivory">
        <div className="level-glow absolute inset-0" aria-hidden="true" />

        <header className="relative z-20 mx-auto flex w-full max-w-[1240px] items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
          <a className="group flex items-center gap-3" href="#top" aria-label="豊田Ai塾 トップ">
            <span className="grid size-10 place-items-center rounded-full border border-cyan/40 bg-cyan/10 text-cyan transition-transform group-hover:rotate-6">
              <Sparkles className="size-[18px]" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-base font-bold tracking-[0.08em]">豊田Ai塾</span>
              <span className="block font-mono text-[9px] tracking-[0.2em] text-ivory/50">TOYOTA AI SCHOOL</span>
            </span>
          </a>

          <nav className="hidden items-center gap-7 text-sm text-ivory/70 md:flex" aria-label="メインナビゲーション">
            <a className="transition-colors hover:text-cyan" href="#learning">学び方</a>
            <a className="transition-colors hover:text-cyan" href="#levels">100レベル</a>
            <a className="transition-colors hover:text-cyan" href="#price">料金</a>
            <a className="transition-colors hover:text-cyan" href="#access">アクセス</a>
            <a className="transition-colors hover:text-cyan" href="/mypage">マイページ</a>
          </nav>

          <a className="rounded-full bg-coral px-4 py-2.5 text-sm font-bold text-white shadow-[0_0_30px_rgba(230,109,81,0.18)] transition hover:-translate-y-0.5 hover:bg-[#f07b5d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan" href="/reserve">
            無料体験を予約
          </a>
        </header>

        <div id="top" className="relative z-10 mx-auto grid w-full max-w-[1240px] gap-12 px-5 pb-10 pt-14 sm:px-8 md:pt-20 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-10 lg:pt-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber/35 bg-amber/10 px-3.5 py-2 text-xs font-bold tracking-[0.08em] text-amber">
              <span className="size-1.5 animate-pulse rounded-full bg-amber" aria-hidden="true" />
              豊田の夜にひらく、大人のAI工房
            </div>

            <h1 className="max-w-[760px] text-[clamp(3.15rem,7.4vw,6.9rem)] font-black leading-[0.94] tracking-[-0.065em]">
              AIを、
              <br />
              <span className="text-cyan">使える</span>から、
              <br />
              <span className="relative inline-block">
                つくれる
                <span className="absolute -bottom-1 left-0 h-[3px] w-full bg-gradient-to-r from-coral via-amber to-transparent" aria-hidden="true" />
              </span>
              へ。
            </h1>

            <p className="mt-8 max-w-[590px] text-base leading-8 text-ivory/72 sm:text-lg">
              100の実践課題を、自分のペースで。ひとりで進める。
              <br className="hidden sm:block" />
              困った時は、隣にMONがいる。
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-coral px-7 text-base font-bold text-white shadow-[0_16px_45px_rgba(230,109,81,0.25)] transition hover:-translate-y-1 hover:bg-[#f07b5d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan" href="/reserve">
                無料体験で最初の1問を完成
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </a>
              <a className="inline-flex min-h-14 items-center justify-center rounded-full border border-ivory/20 bg-white/[0.04] px-7 text-base font-bold text-ivory transition hover:border-cyan/60 hover:bg-cyan/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan" href="#levels">
                100レベルを見る
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[530px] lg:justify-self-end">
            <div className="absolute -inset-7 rounded-[42px] bg-cyan/[0.035] blur-2xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[30px] border border-white/12 bg-[#0d1721]/88 p-4 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.19em] text-cyan">YOUR LEARNING PATH</p>
                  <p className="mt-1 text-sm font-bold">できることが、目に見えて増えていく。</p>
                </div>
                <span className="rounded-full border border-lime/30 bg-lime/10 px-2.5 py-1 font-mono text-[10px] text-lime">LIVE</span>
              </div>

              <div className="relative my-6 min-h-[280px] overflow-hidden rounded-[22px] bg-white/[0.025] px-4 py-5 sm:min-h-[320px] sm:px-6">
                <div className="absolute left-1/2 top-4 h-[280px] w-px bg-gradient-to-b from-cyan/0 via-cyan/25 to-cyan/0" aria-hidden="true" />
                <div className="relative flex h-full min-h-[240px] flex-col justify-between sm:min-h-[280px]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] text-ivory/40">START / FREE</p>
                      <p className="mt-1 text-2xl font-black">LEVEL 01</p>
                    </div>
                    <div className="max-w-[180px] rounded-2xl rounded-tr-sm bg-ivory px-4 py-3 text-ink shadow-lg">
                      <p className="text-[10px] font-bold text-coral">PROMPT MISSION</p>
                      <p className="mt-1 text-xs font-bold leading-5">AIだけで、地域の最低賃金を調べよう</p>
                    </div>
                  </div>

                  <div className="py-5" aria-hidden="true">
                    <div className="grid grid-cols-7 items-center gap-2">
                      {levelDots.map((dot) => (
                        <span
                          key={dot}
                          className={`mx-auto rounded-full ${dot === 10 ? 'size-4 bg-coral shadow-[0_0_24px_rgba(230,109,81,0.8)]' : dot < 10 ? 'size-1.5 bg-cyan/70' : 'size-1.5 border border-white/20'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <div className="rounded-2xl rounded-bl-sm border border-cyan/20 bg-cyan/8 px-4 py-3">
                      <p className="text-[10px] font-bold text-cyan">BUILD MISSION</p>
                      <p className="mt-1 text-xs font-bold leading-5">自分専用のWebアプリを公開</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[10px] text-ivory/40">GOAL / CREATOR</p>
                      <p className="mt-1 text-2xl font-black text-amber">LEVEL 100</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 divide-x divide-white/10 text-center">
                <div className="px-2"><p className="font-mono text-lg font-bold text-cyan">100</p><p className="mt-0.5 text-[10px] text-ivory/45">実践課題</p></div>
                <div className="px-2"><p className="font-mono text-lg font-bold text-amber">2</p><p className="mt-0.5 text-[10px] text-ivory/45">別々の教材</p></div>
                <div className="px-2"><p className="font-mono text-lg font-bold text-lime">1→100</p><p className="mt-0.5 text-[10px] text-ivory/45">成長の証明</p></div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto grid w-full max-w-[1240px] grid-cols-2 border-y border-white/10 bg-white/[0.025] lg:grid-cols-4" aria-label="受講情報">
          <div className="flex min-h-24 items-center gap-3 border-b border-r border-white/10 px-5 lg:border-b-0 lg:px-7"><CalendarDays className="size-5 text-cyan" aria-hidden="true" /><div><p className="text-xs text-ivory/45">月会費</p><p className="mt-1 text-base font-bold">5,000円</p></div></div>
          <div className="flex min-h-24 items-center gap-3 border-b border-white/10 px-5 lg:border-b-0 lg:border-r lg:px-7"><Clock3 className="size-5 text-amber" aria-hidden="true" /><div><p className="text-xs text-ivory/45">開講時間</p><p className="mt-1 text-base font-bold">平日 18:00–21:00</p></div></div>
          <div className="flex min-h-24 items-center gap-3 border-r border-white/10 px-5 lg:px-7"><MapPin className="size-5 text-coral" aria-hidden="true" /><div><p className="text-xs text-ivory/45">通い方</p><p className="mt-1 text-base font-bold">予約枠内で何度でも</p></div></div>
          <div className="flex min-h-24 items-center gap-3 px-5 lg:px-7"><Laptop className="size-5 text-lime" aria-hidden="true" /><div><p className="text-xs text-ivory/45">手ぶらでもOK</p><p className="mt-1 text-base font-bold">PCレンタルあり</p></div></div>
        </div>

        <a href="#learning" aria-label="次のセクションへ" className="absolute bottom-7 left-1/2 z-20 hidden -translate-x-1/2 rounded-full border border-white/15 p-3 text-ivory/45 transition hover:border-cyan/50 hover:text-cyan xl:block">
          <ArrowDown className="size-4" aria-hidden="true" />
        </a>
      </section>

      <section id="learning" className="bg-ivory px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
        <div className="mx-auto w-full max-w-[1160px]">
          <div className="grid gap-7 lg:grid-cols-[0.84fr_1.16fr] lg:items-end">
            <div>
              <SectionLabel>HOW IT WORKS</SectionLabel>
              <h2 className="text-[clamp(2.35rem,5vw,4.7rem)] font-black leading-[1.02] tracking-[-0.055em] text-ink">
                講義を待たない。<br />正解を待たない。
              </h2>
            </div>
            <p className="max-w-[620px] text-base leading-8 text-ink/60 lg:justify-self-end lg:text-lg">
              先生の説明を聞いて終わる場所ではありません。AIだけを相棒に、調べ、考え、作り、公開する。MONは、あなたが止まったその瞬間だけ隣に来ます。
            </p>
          </div>

          <div className="mt-14 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {featureCards.map(({ number, Icon, title, text, color }) => (
              <article key={number} className="group relative min-h-[310px] overflow-hidden rounded-[26px] border border-ink/10 bg-white/60 p-6 transition hover:-translate-y-1 hover:bg-white hover:shadow-[0_22px_60px_rgba(8,16,25,0.08)]">
                <div className="flex items-start justify-between">
                  <span className={`grid size-12 place-items-center rounded-2xl ${accentClasses(color)}`}><Icon className="size-5" aria-hidden="true" /></span>
                  <span className="font-mono text-xs text-ink/30">{number}</span>
                </div>
                <h3 className="mt-16 text-xl font-black text-ink">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-ink/58">{text}</p>
                <div className="absolute inset-x-6 bottom-5 h-px origin-left scale-x-0 bg-gradient-to-r from-coral to-cyan transition-transform duration-500 group-hover:scale-x-100" aria-hidden="true" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink px-5 py-24 text-ivory sm:px-8 sm:py-32 lg:px-10">
        <div className="mx-auto w-full max-w-[1160px]">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <SectionLabel light>WHAT YOU WILL MAKE</SectionLabel>
              <h2 className="text-[clamp(2.25rem,5vw,4.5rem)] font-black leading-[1.03] tracking-[-0.055em]">
                100問ではなく、<br /><span className="text-cyan">100の仕事</span>を完成させる。
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-ivory/55">小さな調査から、Web公開、自動化、現場実装まで。レベルが上がるたび、見せられる成果が増えていきます。</p>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-[28px] border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-3">
            {outcomes.map((item, index) => (
              <article key={item.level} className="group min-h-[250px] bg-[#0b151f] p-6 transition hover:bg-[#101e2a] sm:p-8">
                <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.16em]">
                  <span className={index < 2 ? 'text-cyan' : index < 4 ? 'text-amber' : 'text-lime'}>{item.level}</span>
                  <span className="text-ivory/25">{item.tag}</span>
                </div>
                <h3 className="mt-16 text-xl font-black">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-ivory/50">{item.detail}</p>
                <ChevronRight className="mt-5 size-4 -translate-x-1 text-coral opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" aria-hidden="true" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="levels" className="bg-[#fbf8f1] px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
        <div className="mx-auto w-full max-w-[1160px]">
          <div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <SectionLabel>LEVEL 01 → 100</SectionLabel>
              <h2 className="text-[clamp(2.4rem,5vw,4.7rem)] font-black leading-[1.02] tracking-[-0.055em] text-ink">
                無料から始めて、<br />現場実装まで。
              </h2>
            </div>
            <div className="lg:justify-self-end">
              <p className="max-w-[550px] text-base leading-8 text-ink/60">
                最初の30レベルは原則無料枠中心。作りたいものが高度になる段階で、必要な有料プランや外部費用を先に明示します。
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-bold">
                <span className="rounded-full bg-cyan/15 px-3 py-1.5 text-[#087f91]">無料枠中心</span>
                <span className="rounded-full bg-amber/20 px-3 py-1.5 text-[#92600e]">有料AI推奨</span>
                <span className="rounded-full bg-coral/15 px-3 py-1.5 text-coral">開発・外部費用の場合あり</span>
                <span className="rounded-full bg-lime/28 px-3 py-1.5 text-[#4d7207]">高度実践</span>
              </div>
            </div>
          </div>

          <div className="relative mt-16">
            <div className="absolute bottom-4 left-[26px] top-4 hidden w-px bg-gradient-to-b from-cyan via-coral to-lime md:block" aria-hidden="true" />
            <div className="grid gap-3">
              {learningStages.map(({ range, title, description, plan, color, Icon }, index) => (
                <article key={range} className="group relative grid gap-4 rounded-[22px] border border-ink/9 bg-white/70 p-5 transition hover:border-ink/20 hover:bg-white hover:shadow-[0_16px_45px_rgba(8,16,25,0.06)] md:grid-cols-[55px_150px_1fr_auto] md:items-center md:gap-6 md:p-4 md:pr-6">
                  <div className={`relative z-10 grid size-[52px] place-items-center rounded-2xl border-4 border-[#fbf8f1] ${accentClasses(color)}`}><Icon className="size-5" aria-hidden="true" /></div>
                  <div>
                    <p className="font-mono text-[10px] text-ink/35">LEVEL</p>
                    <p className="mt-0.5 font-mono text-base font-bold text-ink">{range}</p>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-ink">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-ink/52">{description}</p>
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1.5 text-[10px] font-bold ${accentClasses(color)}`}>{plan}</span>
                  <span className="absolute right-5 top-5 font-mono text-[9px] text-ink/15 md:hidden">{String(index + 1).padStart(2, '0')}</span>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ivory px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
        <div className="mx-auto w-full max-w-[1160px]">
          <div className="mb-12 max-w-[760px]">
            <SectionLabel>MISSION PREVIEW</SectionLabel>
            <h2 className="text-[clamp(2.25rem,5vw,4.25rem)] font-black leading-[1.04] tracking-[-0.05em] text-ink">問題だけで終わらない。<br />プロンプト、改善、応用まで。</h2>
            <p className="mt-5 text-base leading-8 text-ink/58">代表ミッションを選び、教材でどう学ぶかを体験してください。</p>
          </div>
          <MissionExplorer />
        </div>
      </section>

      <section className="bg-[#eee7da] px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
        <div className="mx-auto w-full max-w-[1160px]">
          <div className="text-center">
            <SectionLabel>TEXTBOOKS</SectionLabel>
            <h2 className="text-[clamp(2.3rem,5vw,4.6rem)] font-black leading-[1.04] tracking-[-0.055em] text-ink">同じ問題を、<br className="sm:hidden" />別のAIで解くだけじゃない。</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-ink/58">ChatGPT編とClaude編は、入口も課題も異なる二つの100ミッション。Amazon KDPで順次刊行予定です。</p>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-2">
            <article className="relative overflow-hidden rounded-[30px] bg-ink p-7 text-ivory shadow-[0_24px_70px_rgba(8,16,25,0.14)] sm:p-10">
              <div className="absolute -right-16 -top-16 size-56 rounded-full bg-cyan/10 blur-2xl" aria-hidden="true" />
              <div className="relative">
                <div className="flex items-center justify-between"><span className="font-mono text-[10px] tracking-[0.18em] text-cyan">CHATGPT EDITION</span><span className="grid size-11 place-items-center rounded-2xl bg-cyan/10 text-cyan"><WandSparkles className="size-5" aria-hidden="true" /></span></div>
                <p className="mt-12 text-sm font-bold text-ivory/45">AIスキルを確実にアップするための問題集</p>
                <h3 className="mt-3 text-3xl font-black leading-tight">仕事を前へ進める<br />100ミッション</h3>
                <p className="mt-6 text-sm leading-7 text-ivory/55">調査・分析・生成・自動化・制作。アイデアをすばやく試し、成果物へ変える力を鍛えます。</p>
                <div className="mt-8 flex flex-wrap gap-2 text-[10px] font-bold text-cyan"><span className="rounded-full border border-cyan/20 px-3 py-1.5">調査</span><span className="rounded-full border border-cyan/20 px-3 py-1.5">生成</span><span className="rounded-full border border-cyan/20 px-3 py-1.5">自動化</span><span className="rounded-full border border-cyan/20 px-3 py-1.5">Web制作</span></div>
              </div>
            </article>

            <article className="relative overflow-hidden rounded-[30px] bg-[#fdfaf3] p-7 text-ink shadow-[0_24px_70px_rgba(8,16,25,0.08)] sm:p-10">
              <div className="absolute -right-16 -top-16 size-56 rounded-full bg-coral/10 blur-2xl" aria-hidden="true" />
              <div className="relative">
                <div className="flex items-center justify-between"><span className="font-mono text-[10px] tracking-[0.18em] text-coral">CLAUDE EDITION</span><span className="grid size-11 place-items-center rounded-2xl bg-coral/10 text-coral"><BookOpenText className="size-5" aria-hidden="true" /></span></div>
                <p className="mt-12 text-sm font-bold text-ink/38">AIスキルを確実にアップするための問題集</p>
                <h3 className="mt-3 text-3xl font-black leading-tight">考えを構造に変える<br />100ミッション</h3>
                <p className="mt-6 text-sm leading-7 text-ink/55">長文理解・設計・仕様化・推敲・共同開発。複雑な考えを、他者が使える形へ整える力を鍛えます。</p>
                <div className="mt-8 flex flex-wrap gap-2 text-[10px] font-bold text-coral"><span className="rounded-full border border-coral/20 px-3 py-1.5">長文理解</span><span className="rounded-full border border-coral/20 px-3 py-1.5">構造化</span><span className="rounded-full border border-coral/20 px-3 py-1.5">仕様化</span><span className="rounded-full border border-coral/20 px-3 py-1.5">共同開発</span></div>
              </div>
            </article>
          </div>
          <p className="mt-6 text-center text-[11px] leading-6 text-ink/42">豊田Ai塾の独自教材です。OpenAI社・Anthropic社の公式教材または提携教材ではありません。</p>
        </div>
      </section>

      <section className="bg-ink px-5 py-24 text-ivory sm:px-8 sm:py-32 lg:px-10">
        <div className="mx-auto grid w-full max-w-[1160px] gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/5 shadow-[0_30px_90px_rgba(0,0,0,0.32)]">
            <Image src="/og.png" alt="夜の教室で、MONと大人の受講者が並んでAIを学ぶ豊田Ai塾のイメージ" width={1672} height={941} className="h-auto w-full" sizes="(min-width: 1024px) 52vw, 100vw" />
            <div className="absolute bottom-4 right-4 rounded-full border border-white/15 bg-ink/65 px-3 py-1.5 text-[10px] font-bold text-ivory/65 backdrop-blur">対面だから、ひとりにならない</div>
          </div>

          <div>
            <SectionLabel light>THE EVENING LAB</SectionLabel>
            <h2 className="text-[clamp(2.45rem,5vw,4.7rem)] font-black leading-[1.03] tracking-[-0.055em]">ひとりで進める。<br />でも、<span className="text-amber">ひとりで悩まない。</span></h2>
            <p className="mt-6 max-w-[540px] text-base leading-8 text-ivory/58">自分の画面に集中しながら、困れば声をかけられる。完成したものは、話したい人だけ見せ合える。強制されない、でも孤独ではない大人の学び場です。</p>

            <ol className="mt-9 grid gap-3">
              {['予約して、仕事帰りに教室へ', '今日のミッションを自分で選ぶ', 'AIだけを使って、まず試してみる', '詰まった瞬間だけMONに質問', '成果物を保存し、次のレベルへ'].map((step, index) => (
                <li key={step} className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.035] px-4 py-3.5 text-sm font-bold text-ivory/75">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-cyan/10 font-mono text-[10px] text-cyan">{index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="bg-ivory px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
        <div className="mx-auto grid w-full max-w-[1160px] gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <SectionLabel>LEVEL CERTIFICATE</SectionLabel>
            <h2 className="text-[clamp(2.3rem,5vw,4.5rem)] font-black leading-[1.04] tracking-[-0.055em] text-ink">テストはHPで。<br />合格の記録はマイページへ。</h2>
            <p className="mt-6 max-w-[520px] text-base leading-8 text-ink/58">Lv10・25・50・75・100の4択テストは、このHPからオンライン受験。自動採点後、合否と受験履歴をマイページで確認し、成果物レビューと合わせて到達証を発行します。</p>
            <div className="mt-7 flex flex-wrap gap-2 text-xs font-bold text-ink/60"><span className="rounded-full border border-ink/10 bg-white px-3 py-2">HPで受験</span><span className="rounded-full border border-ink/10 bg-white px-3 py-2">自動採点</span><span className="rounded-full border border-ink/10 bg-white px-3 py-2">受験履歴</span><span className="rounded-full border border-ink/10 bg-white px-3 py-2">デジタル到達証</span></div>
            <a className="group mt-8 inline-flex min-h-13 items-center gap-3 rounded-full bg-ink px-6 text-sm font-bold text-ivory transition hover:-translate-y-0.5 hover:bg-[#162431]" href="/level-test">
              HPでレベルテストを受ける
              <Play className="size-4 fill-current" aria-hidden="true" />
            </a>
            <p className="mt-5 max-w-lg text-[11px] leading-6 text-ink/40">豊田Ai塾カリキュラム内の到達度を示す独自基準です。国家資格・公的資格、OpenAI社・Anthropic社の公式認定ではありません。</p>
          </div>

          <div className="relative mx-auto w-full max-w-[560px] rounded-[30px] border border-ink/10 bg-white p-6 shadow-[0_30px_90px_rgba(8,16,25,0.1)] sm:p-9">
            <div className="absolute -right-4 -top-4 grid size-16 rotate-6 place-items-center rounded-2xl bg-amber text-ink shadow-xl"><Award className="size-7" aria-hidden="true" /></div>
            <div className="border border-ink/10 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[9px] tracking-[0.2em] text-coral">TOYOTA AI SCHOOL</p><p className="mt-2 text-lg font-black tracking-[0.08em]">豊田Ai塾</p></div><ShieldCheck className="size-8 text-[#4d7207]" aria-hidden="true" /></div>
              <div className="my-9 text-center"><p className="text-xs font-bold tracking-[0.24em] text-ink/40">知識・実践 到達証</p><p className="mt-5 font-mono text-6xl font-black tracking-[-0.08em] text-ink">LV.50</p><p className="mt-3 text-sm font-bold">Webで公開する／自分用アプリを作る</p></div>
              <div className="grid grid-cols-2 gap-4 border-t border-ink/10 pt-5 text-[10px] text-ink/45"><div><p>ASSESSMENT</p><p className="mt-1 font-bold text-ink">4択 86 / 100</p></div><div><p>ISSUE ID</p><p className="mt-1 font-mono font-bold text-ink">TAI-50-000128</p></div></div>
            </div>
          </div>
        </div>
      </section>

      <section id="price" className="bg-[#eee7da] px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
        <div className="mx-auto w-full max-w-[1160px]">
          <div className="text-center"><SectionLabel>PRICE</SectionLabel><h2 className="text-[clamp(2.45rem,5vw,4.7rem)] font-black leading-[1.03] tracking-[-0.055em] text-ink">続けやすく、<br className="sm:hidden" />わかりやすく。</h2><p className="mx-auto mt-5 max-w-xl text-base leading-8 text-ink/58">自分の端末なら月会費だけ。必要な日だけPCとAI環境をレンタルできます。</p></div>

          <div className="mx-auto mt-14 grid max-w-[940px] gap-5 md:grid-cols-[1.2fr_0.8fr]">
            <article className="relative overflow-hidden rounded-[32px] bg-ink p-7 text-ivory shadow-[0_28px_80px_rgba(8,16,25,0.16)] sm:p-10">
              <div className="absolute -right-20 -top-20 size-64 rounded-full bg-cyan/10 blur-3xl" aria-hidden="true" />
              <div className="relative"><div className="flex items-center justify-between"><span className="rounded-full bg-cyan/10 px-3 py-1.5 text-[10px] font-bold text-cyan">MONTHLY MEMBER</span><UsersRound className="size-5 text-ivory/35" aria-hidden="true" /></div><div className="mt-10 flex items-end gap-2"><span className="font-mono text-[clamp(3.8rem,8vw,6rem)] font-black leading-none tracking-[-0.09em]">5,000</span><span className="pb-2 text-sm font-bold text-ivory/55">円 / 月</span></div><p className="mt-5 text-sm leading-7 text-ivory/58">平日18:00〜21:00。予約枠・空席の範囲内で何度でも利用できます。</p><ul className="mt-8 grid gap-3 text-sm font-bold text-ivory/75 sm:grid-cols-2">{['教室利用', 'MONへの質問', 'マイページ', '補助資料ダウンロード', '受講予約・進捗管理', 'コミュニティ参加（任意）'].map((item) => <li key={item} className="flex items-center gap-2"><Check className="size-4 text-lime" aria-hidden="true" />{item}</li>)}</ul><a className="mt-9 inline-flex min-h-13 w-full items-center justify-center rounded-full bg-coral px-6 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#f07b5d]" href="/reserve">初回体験 0円で始める</a></div>
            </article>

            <div className="grid gap-5">
              <article className="rounded-[28px] border border-ink/10 bg-white/80 p-7"><div className="flex items-center justify-between"><span className="rounded-full bg-amber/20 px-3 py-1.5 text-[10px] font-bold text-[#92600e]">OPTION</span><Laptop className="size-5 text-ink/35" aria-hidden="true" /></div><p className="mt-8 text-sm font-bold text-ink/45">PC＋受講用AI環境</p><p className="mt-2 font-mono text-4xl font-black tracking-[-0.06em] text-ink">1,000<span className="ml-2 text-sm tracking-normal">円 / 回</span></p><p className="mt-4 text-sm leading-7 text-ink/52">1回最大3時間。受講者ごとに分離した安全な環境を準備します。</p></article>
              <article className="rounded-[28px] border border-ink/10 bg-transparent p-7"><p className="font-mono text-[10px] tracking-[0.16em] text-coral">NOT INCLUDED</p><ul className="mt-4 grid gap-2 text-xs leading-6 text-ink/55"><li>・Amazon KDPで販売する書籍代</li><li>・個人のAI有料プラン</li><li>・API、ドメイン、ホスティング等の外部費用</li></ul></article>
            </div>
          </div>
          <p className="mx-auto mt-6 max-w-[850px] text-center text-[11px] leading-6 text-ink/42">表示価格の税込・税別、課金日、日割り、休会・退会、キャンセル条件は、正式申込画面と利用規約で確定表示します。外部サービス費が発生する課題は、開始前に明示します。</p>
        </div>
      </section>

      <section id="access" className="bg-ivory px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
        <div className="mx-auto grid w-full max-w-[1160px] gap-10 lg:grid-cols-2">
          <article className="rounded-[30px] border border-ink/10 bg-white p-7 sm:p-10"><SectionLabel>YOUR GUIDE</SectionLabel><div className="flex flex-col gap-7 sm:flex-row sm:items-center"><div className="grid size-28 shrink-0 place-items-center rounded-[28px] bg-gradient-to-br from-coral to-amber text-4xl font-black text-white">MON</div><div><p className="text-sm font-bold text-coral">先生ではなく、伴走者。</p><h2 className="mt-2 text-3xl font-black text-ink">質問が生まれた時、<br />すぐ隣に。</h2></div></div><p className="mt-7 text-sm leading-7 text-ink/58">MONは答えを代わりに作る人ではありません。あなたが試したプロンプトと出力を一緒に見て、次に何を変えればよいかを支援します。プロフィール・実績は正式公開時に掲載します。</p></article>
          <article className="relative overflow-hidden rounded-[30px] bg-ink p-7 text-ivory sm:p-10"><div className="absolute inset-0 opacity-30 hero-grid" aria-hidden="true" /><div className="relative"><SectionLabel light>ACCESS</SectionLabel><p className="font-mono text-[10px] tracking-[0.16em] text-ivory/35">VENUE</p><h2 className="mt-3 text-3xl font-black">ブリッジスタッフ<br />サービス</h2><div className="mt-8 grid gap-4 text-sm"><div className="flex items-center gap-3"><MapPin className="size-4 text-coral" aria-hidden="true" /><span>愛知県豊田市</span></div><div className="flex items-center gap-3"><Clock3 className="size-4 text-amber" aria-hidden="true" /><span>平日 18:00–21:00</span></div><div className="flex items-center gap-3"><CalendarDays className="size-4 text-cyan" aria-hidden="true" /><span>予約制・初回体験無料</span></div></div><p className="mt-8 text-xs leading-6 text-ivory/42">詳細住所、駐車場、入館方法、祝日・休業日は、運営確認後に予約画面へ掲載します。</p><a className="group mt-7 inline-flex items-center gap-2 text-sm font-bold text-cyan" href="/reserve">体験可能日を見る<ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" /></a></div></article>
        </div>
      </section>

      <section className="bg-[#fbf8f1] px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
        <div className="mx-auto grid w-full max-w-[1160px] gap-10 lg:grid-cols-[0.62fr_1.38fr]">
          <div><SectionLabel>FAQ</SectionLabel><h2 className="text-[clamp(2.4rem,5vw,4.4rem)] font-black leading-[1.03] tracking-[-0.055em] text-ink">始める前の、<br />気になること。</h2><div className="mt-8 flex items-start gap-3 rounded-2xl bg-cyan/10 p-4 text-sm leading-6 text-ink/60"><CircleHelp className="mt-0.5 size-4 shrink-0 text-[#087f91]" aria-hidden="true" />ここにない質問は、無料体験の予約時にお知らせください。</div></div>
          <FaqSection />
        </div>
      </section>

      <section className="bg-coral px-5 py-20 text-white sm:px-8 sm:py-24 lg:px-10">
        <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-9 lg:flex-row lg:items-center lg:justify-between">
          <div><p className="font-mono text-[10px] font-bold tracking-[0.2em] text-white/65">YOUR FIRST MISSION IS FREE</p><h2 className="mt-4 text-[clamp(2.4rem,5vw,4.8rem)] font-black leading-[1.02] tracking-[-0.055em]">今夜、AIと<br />ひとつ完成させよう。</h2></div>
          <div className="w-full max-w-[410px]"><a className="group inline-flex min-h-16 w-full items-center justify-between rounded-full bg-ink px-7 text-base font-bold text-ivory shadow-[0_20px_55px_rgba(8,16,25,0.22)] transition hover:-translate-y-1" href="/reserve"><span>無料体験を予約する</span><span className="grid size-9 place-items-center rounded-full bg-cyan text-ink"><ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span></a><a className="mt-4 inline-flex w-full items-center justify-center gap-2 text-sm font-bold text-white/75 hover:text-white" href="/mypage"><Download className="size-4" aria-hidden="true" />受講生マイページを見る</a></div>
        </div>
      </section>

      <SiteFooter />

      <div className="fixed inset-x-3 bottom-3 z-50 flex items-center gap-3 rounded-2xl border border-white/10 bg-ink/94 p-2.5 pl-4 text-ivory shadow-[0_18px_55px_rgba(0,0,0,0.3)] backdrop-blur md:hidden"><div className="min-w-0 flex-1"><p className="text-xs font-bold">初回体験 0円</p><p className="truncate text-[10px] text-ivory/45">平日18:00–21:00｜豊田市</p></div><a className="inline-flex min-h-11 items-center justify-center rounded-xl bg-coral px-4 text-xs font-bold text-white" href="/reserve">予約する</a></div>
    </main>
  );
}
