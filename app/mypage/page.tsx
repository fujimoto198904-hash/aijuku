import type { Metadata } from 'next';
import {
  ArrowRight,
  Award,
  Bell,
  BookOpenText,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Download,
  FileText,
  Gauge,
  Home,
  Laptop,
  LockKeyhole,
  MessageCircleQuestion,
  ReceiptText,
  Sparkles,
  UserRound,
} from 'lucide-react';

import { Progress } from '@/components/ui/progress';

export const metadata: Metadata = {
  title: '受講生マイページ｜豊田Ai塾',
  description: '豊田Ai塾の受講予約、教材、進捗、決済、レベル証明をまとめて確認できるマイページです。',
};

const navItems = [
  { label: 'ホーム', Icon: Home, href: '#', active: true },
  { label: '予約', Icon: CalendarDays, href: '/reserve', active: false },
  { label: '学習・教材', Icon: BookOpenText, href: '#learning', active: false },
  { label: 'テスト・認定', Icon: Award, href: '/level-test', active: false },
  { label: 'お支払い', Icon: CircleDollarSign, href: '#billing', active: false },
  { label: 'アカウント', Icon: UserRound, href: '#account', active: false },
] as const;

export default function MyPage() {
  return (
    <main className="min-h-screen bg-[#f1ede5] text-ink">
      <div className="border-b border-cyan/20 bg-ink px-4 py-2 text-center text-[11px] font-bold leading-5 text-cyan">
        受講生体験用のデモ画面です。表示中の予約・進捗・決済はサンプルデータです。
      </div>

      <div className="grid min-h-[calc(100vh-36px)] lg:grid-cols-[250px_1fr]">
        <aside className="hidden flex-col bg-ink p-6 text-ivory lg:flex">
          <a className="flex items-center gap-3" href="/" aria-label="豊田Ai塾 トップ">
            <span className="grid size-10 place-items-center rounded-full border border-cyan/40 bg-cyan/10 text-cyan"><Sparkles className="size-[18px]" aria-hidden="true" /></span>
            <span><span className="block text-base font-bold tracking-[0.08em]">豊田Ai塾</span><span className="block font-mono text-[9px] tracking-[0.2em] text-ivory/40">MEMBER PORTAL</span></span>
          </a>

          <nav className="mt-12 grid gap-1" aria-label="マイページナビゲーション">
            {navItems.map(({ label, Icon, active, href }) => (
              <a key={label} href={href} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition ${active ? 'bg-cyan/12 text-cyan' : 'text-ivory/48 hover:bg-white/5 hover:text-ivory'}`}>
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </a>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-coral text-xs font-black text-white">DEMO</span><div><p className="text-sm font-bold">受講生サンプル</p><p className="mt-0.5 text-[10px] text-ivory/35">Lv.27 / Member</p></div></div>
            <a className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-ivory/45 hover:text-cyan" href="/"><LockKeyhole className="size-3.5" aria-hidden="true" />公開サイトへ戻る</a>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="flex min-h-[76px] items-center justify-between border-b border-ink/8 bg-white/65 px-5 backdrop-blur sm:px-8">
            <a className="flex items-center gap-2 font-bold lg:hidden" href="/"><Sparkles className="size-4 text-coral" aria-hidden="true" />豊田Ai塾</a>
            <div className="hidden lg:block"><p className="text-xs text-ink/38">2026年8月28日 金曜日</p><p className="mt-1 text-sm font-bold">マイページ</p></div>
            <div className="flex items-center gap-2"><button type="button" aria-label="お知らせ" className="relative grid size-10 place-items-center rounded-full border border-ink/10 bg-white text-ink/60"><Bell className="size-4" aria-hidden="true" /><span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-coral" aria-hidden="true" /></button><span className="grid size-10 place-items-center rounded-full bg-ink text-xs font-black text-cyan">DE</span></div>
          </header>

          <div className="mx-auto w-full max-w-[1220px] px-4 pb-28 pt-8 sm:px-8 sm:pt-10 lg:pb-12">
            <div className="flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
              <div><p className="font-mono text-[10px] font-bold tracking-[0.18em] text-coral">GOOD EVENING</p><h1 className="mt-3 text-[clamp(2rem,5vw,3.8rem)] font-black leading-[1.02] tracking-[-0.05em]">今夜はLv.27の<br className="sm:hidden" />続きから。</h1><p className="mt-4 text-sm leading-7 text-ink/50">45分で、ひとつ完成できます。</p></div>
              <a className="group inline-flex min-h-13 items-center justify-between gap-8 rounded-full bg-coral px-6 text-sm font-bold text-white shadow-[0_15px_40px_rgba(230,109,81,0.2)] transition hover:-translate-y-0.5" href="#learning"><span>前回の続きから始める</span><ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></a>
            </div>

            <div className="mt-9 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
              <section id="learning" className="relative overflow-hidden rounded-[28px] bg-ink p-6 text-ivory shadow-[0_22px_65px_rgba(8,16,25,0.16)] sm:p-8">
                <div className="absolute -right-16 -top-16 size-60 rounded-full bg-cyan/10 blur-3xl" aria-hidden="true" />
                <div className="relative">
                  <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-[10px] tracking-[0.18em] text-cyan">CURRENT PATH</p><h2 className="mt-2 text-xl font-black">Lv.21–30｜仕事を整える</h2></div><span className="rounded-full border border-cyan/20 bg-cyan/10 px-3 py-1.5 text-[10px] font-bold text-cyan">27 / 100</span></div>
                  <Progress value={27} className="mt-7 [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-track]]:bg-white/10 [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-cyan [&_[data-slot=progress-indicator]]:to-lime" />
                  <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.045] p-5"><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber/14 font-mono text-xs font-black text-amber">27</span><div><p className="text-[10px] font-bold text-ivory/38">NEXT MISSION</p><h3 className="mt-1 text-base font-black">3つのシナリオで、来月の数字を予測しよう</h3><p className="mt-2 text-xs leading-6 text-ivory/45">楽観・標準・慎重を分け、前提と不確実性まで説明します。</p></div></div></div>
                  <div className="mt-5 grid grid-cols-3 divide-x divide-white/10 text-center"><div><p className="font-mono text-lg font-bold text-cyan">26</p><p className="mt-1 text-[9px] text-ivory/35">完成</p></div><div><p className="font-mono text-lg font-bold text-amber">7</p><p className="mt-1 text-[9px] text-ivory/35">今月</p></div><div><p className="font-mono text-lg font-bold text-lime">3</p><p className="mt-1 text-[9px] text-ivory/35">成果物</p></div></div>
                </div>
              </section>

              <section className="rounded-[28px] border border-ink/8 bg-white p-6 sm:p-8">
                <div className="flex items-start justify-between"><div><p className="font-mono text-[10px] tracking-[0.16em] text-coral">NEXT VISIT</p><h2 className="mt-2 text-lg font-black">次回の予約</h2></div><CalendarDays className="size-5 text-coral" aria-hidden="true" /></div>
                <div className="mt-8 flex items-end gap-4"><span className="font-mono text-5xl font-black tracking-[-0.08em]">9/2</span><span className="pb-1 text-sm font-bold text-ink/45">水曜日</span></div><p className="mt-3 flex items-center gap-2 text-sm font-bold"><Clock3 className="size-4 text-amber" aria-hidden="true" />18:00–21:00</p><div className="mt-6 rounded-xl bg-ivory p-3 text-xs leading-6 text-ink/55"><Laptop className="mr-1.5 inline size-3.5 text-coral" aria-hidden="true" />自分のPC・AIアカウント</div><div className="mt-5 flex gap-2"><a className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full bg-ink px-4 text-xs font-bold text-ivory" href="/reserve">変更する</a><button type="button" className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full border border-ink/12 px-4 text-xs font-bold text-ink">キャンセル</button></div>
              </section>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
              <section className="rounded-[28px] border border-ink/8 bg-white p-6 sm:p-8">
                <div className="flex items-start justify-between"><div><p className="font-mono text-[10px] tracking-[0.16em] text-[#4d7207]">ASK MON</p><h2 className="mt-2 text-lg font-black">詰まった瞬間だけ、質問。</h2></div><MessageCircleQuestion className="size-5 text-[#4d7207]" aria-hidden="true" /></div><p className="mt-4 text-sm leading-7 text-ink/52">作りたいもの、試したプロンプト、困っている出力をまとめると、MONがより早く次の一手を見つけられます。</p><button type="button" className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-lime/45 px-5 text-sm font-black text-[#385503]"><MessageCircleQuestion className="size-4" aria-hidden="true" />MONへ質問メモを作る</button><p className="mt-3 text-center text-[10px] text-ink/35">現在の待ち人数：0人</p>
              </section>

              <section className="rounded-[28px] border border-ink/8 bg-white p-6 sm:p-8">
                <div className="flex items-center justify-between"><div><p className="font-mono text-[10px] tracking-[0.16em] text-coral">MATERIALS</p><h2 className="mt-2 text-lg font-black">補助資料</h2></div><a className="text-xs font-bold text-ink/45 hover:text-coral" href="#">すべて見る</a></div>
                <div className="mt-6 grid gap-3">
                  <a className="group flex items-center gap-4 rounded-2xl bg-ivory/65 p-4 transition hover:bg-ivory" href="/downloads/toyota-ai-school-start-guide.pdf" download><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-coral/12 text-coral"><FileText className="size-4" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">豊田Ai塾 スタートガイド</span><span className="mt-1 block text-[10px] text-ink/38">PDF・はじめに読む資料</span></span><Download className="size-4 text-ink/30 transition group-hover:translate-y-0.5 group-hover:text-coral" aria-hidden="true" /></a>
                  <a className="group flex items-center gap-4 rounded-2xl bg-ivory/65 p-4 transition hover:bg-ivory" href="/downloads/prompt-quality-checklist.txt" download><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-cyan/15 text-[#087f91]"><Check className="size-4" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">プロンプト品質チェックリスト</span><span className="mt-1 block text-[10px] text-ink/38">TXT・すぐ使える10項目</span></span><Download className="size-4 text-ink/30 transition group-hover:translate-y-0.5 group-hover:text-coral" aria-hidden="true" /></a>
                </div>
              </section>
            </div>

            <section id="billing" className="mt-4 rounded-[28px] border border-ink/8 bg-white p-6 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-mono text-[10px] tracking-[0.16em] text-coral">BILLING</p><h2 className="mt-2 text-lg font-black">お支払い</h2></div><div className="inline-flex items-center gap-2 rounded-full bg-lime/28 px-3 py-1.5 text-[10px] font-bold text-[#4d7207]"><Check className="size-3" aria-hidden="true" />会員ステータス：有効（デモ）</div></div>
              <div className="mt-6 grid gap-3 md:grid-cols-3"><div className="rounded-2xl bg-ivory/65 p-4"><p className="text-[10px] text-ink/38">月会費</p><p className="mt-2 font-mono text-2xl font-black">5,000円</p><p className="mt-2 text-[10px] text-ink/38">次回決済 2026/9/1</p></div><div className="rounded-2xl bg-ivory/65 p-4"><p className="text-[10px] text-ink/38">今月のレンタル</p><p className="mt-2 font-mono text-2xl font-black">0円</p><p className="mt-2 text-[10px] text-ink/38">利用 0回</p></div><div className="rounded-2xl bg-ivory/65 p-4"><p className="text-[10px] text-ink/38">支払方法</p><p className="mt-2 flex items-center gap-2 text-sm font-black"><ReceiptText className="size-4 text-coral" aria-hidden="true" />カード未接続</p><button type="button" disabled className="mt-3 text-[10px] font-bold text-ink/30">本番決済接続後に管理可能</button></div></div>
            </section>

            <section className="mt-4 grid gap-4 lg:grid-cols-2">
              <a className="group flex items-center gap-5 rounded-[26px] border border-ink/8 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lg" href="/level-test"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber/25 text-[#92600e]"><Award className="size-5" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block text-[10px] font-bold text-ink/38">ONLINE LEVEL TEST</span><span className="mt-1 block text-base font-black">HPでレベルテストを受ける</span><span className="mt-1 block text-xs text-ink/42">次の到達チェック：Lv.50</span></span><ChevronRight className="size-4 text-ink/25 transition group-hover:translate-x-1" aria-hidden="true" /></a>
              <a className="group flex items-center gap-5 rounded-[26px] border border-ink/8 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lg" href="/#levels"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-cyan/15 text-[#087f91]"><Gauge className="size-5" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block text-[10px] font-bold text-ink/38">FULL PATH</span><span className="mt-1 block text-base font-black">100レベルを見直す</span><span className="mt-1 block text-xs text-ink/42">現在 Lv.27 / 100</span></span><ChevronRight className="size-4 text-ink/25 transition group-hover:translate-x-1" aria-hidden="true" /></a>
            </section>
          </div>
        </div>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-2xl border border-white/10 bg-ink/95 p-2 text-ivory shadow-[0_18px_55px_rgba(0,0,0,0.3)] backdrop-blur lg:hidden" aria-label="マイページモバイルナビゲーション">
        {navItems.slice(0, 5).map(({ label, Icon, active, href }) => <a key={label} href={href} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[9px] font-bold ${active ? 'bg-cyan/12 text-cyan' : 'text-ivory/40'}`}><Icon className="size-4" aria-hidden="true" />{label.replace('・教材', '').replace('・認定', '')}</a>)}
      </nav>
    </main>
  );
}
