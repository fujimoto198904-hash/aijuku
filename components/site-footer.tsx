import { ArrowUpRight, Sparkles } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="bg-ink px-5 pb-28 pt-14 text-ivory sm:px-8 md:pb-14 lg:px-10">
      <div className="mx-auto grid w-full max-w-[1160px] gap-10 border-b border-white/10 pb-12 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <a className="flex items-center gap-3" href="/">
            <span className="grid size-10 place-items-center rounded-full border border-cyan/40 bg-cyan/10 text-cyan">
              <Sparkles className="size-[18px]" aria-hidden="true" />
            </span>
            <span className="text-lg font-black tracking-[0.08em]">豊田Ai塾</span>
          </a>
          <p className="mt-5 max-w-sm text-sm leading-7 text-ivory/55">
            AIを知っている人から、AIで仕事を完成させられる人へ。豊田の夜にひらく、大人のための対面AI工房です。
          </p>
        </div>

        <div>
          <p className="font-mono text-[10px] tracking-[0.18em] text-cyan">EXPLORE</p>
          <nav className="mt-4 grid gap-3 text-sm text-ivory/65" aria-label="フッターナビゲーション">
            <a className="hover:text-cyan" href="/#learning">学び方</a>
            <a className="hover:text-cyan" href="/#levels">100レベル</a>
            <a className="hover:text-cyan" href="/#price">料金</a>
            <a className="hover:text-cyan" href="/mypage">マイページ</a>
          </nav>
        </div>

        <div>
          <p className="font-mono text-[10px] tracking-[0.18em] text-amber">START TONIGHT</p>
          <a className="group mt-4 inline-flex items-center gap-2 text-base font-bold hover:text-coral" href="/reserve">
            無料体験を予約する
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </a>
          <p className="mt-3 text-xs leading-6 text-ivory/40">平日18:00–21:00<br />ブリッジスタッフサービス</p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-3 pt-6 text-[11px] leading-5 text-ivory/35 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 豊田Ai塾</p>
        <p>豊田Ai塾のレベル証明は独自基準であり、公的・各AI提供会社の公式資格ではありません。</p>
      </div>
    </footer>
  );
}
