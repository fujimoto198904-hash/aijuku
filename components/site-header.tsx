import { Menu, Sparkles } from 'lucide-react';

export function SiteHeader({ dark = false }: { dark?: boolean }) {
  return (
    <header className={`border-b ${dark ? 'border-white/10 bg-ink text-ivory' : 'border-ink/10 bg-ivory/92 text-ink backdrop-blur'}`}>
      <div className="mx-auto flex min-h-[76px] w-full max-w-[1240px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <a className="group flex items-center gap-3" href="/" aria-label="豊田Ai塾 トップ">
          <span className={`grid size-10 place-items-center rounded-full border ${dark ? 'border-cyan/40 bg-cyan/10 text-cyan' : 'border-ink/10 bg-ink text-cyan'} transition-transform group-hover:rotate-6`}>
            <Sparkles className="size-[18px]" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-base font-bold tracking-[0.08em]">豊田Ai塾</span>
            <span className={`block font-mono text-[9px] tracking-[0.2em] ${dark ? 'text-ivory/45' : 'text-ink/45'}`}>TOYOTA AI SCHOOL</span>
          </span>
        </a>

        <nav className="hidden items-center gap-6 text-sm md:flex" aria-label="メインナビゲーション">
          <a className="transition-colors hover:text-coral" href="/#learning">学び方</a>
          <a className="transition-colors hover:text-coral" href="/#levels">100レベル</a>
          <a className="transition-colors hover:text-coral" href="/#price">料金</a>
          <a className="transition-colors hover:text-coral" href="/mypage">マイページ</a>
        </nav>

        <div className="flex items-center gap-2">
          <a className={`hidden min-h-11 items-center justify-center rounded-full border px-4 text-sm font-bold transition hover:-translate-y-0.5 sm:inline-flex ${dark ? 'border-white/15 hover:border-cyan/50' : 'border-ink/15 hover:border-ink/30'}`} href="/mypage">
            ログイン
          </a>
          <a className="inline-flex min-h-11 items-center justify-center rounded-full bg-coral px-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#f07b5d]" href="/reserve">
            無料体験
          </a>
          <details className="relative md:hidden">
            <summary className={`grid size-11 cursor-pointer list-none place-items-center rounded-full border ${dark ? 'border-white/15' : 'border-ink/15'}`} aria-label="メニューを開く">
              <Menu className="size-4" aria-hidden="true" />
            </summary>
            <nav className="absolute right-0 top-14 z-50 grid w-52 gap-1 rounded-2xl border border-ink/10 bg-ivory p-2 text-sm text-ink shadow-2xl" aria-label="モバイルナビゲーション">
              <a className="rounded-xl px-4 py-3 hover:bg-ink/5" href="/#learning">学び方</a>
              <a className="rounded-xl px-4 py-3 hover:bg-ink/5" href="/#levels">100レベル</a>
              <a className="rounded-xl px-4 py-3 hover:bg-ink/5" href="/#price">料金</a>
              <a className="rounded-xl px-4 py-3 hover:bg-ink/5" href="/mypage">マイページ</a>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
