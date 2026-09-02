import { BookOpenText, Video } from "lucide-react";

import { cn } from "@/lib/utils";

export function OnlinePriceSpotlight({ className }: { className?: string }) {
  return (
    <aside
      aria-label="無料Web教科書と全国オンライン受講の案内"
      className={cn(
        "soft-card soft-dark-glow relative isolate overflow-hidden border border-white/15 bg-brand-dark p-5 text-white sm:p-6",
        className,
      )}
    >
      <div
        className="ambient-orb pointer-events-none absolute -top-24 -right-20 size-64 rounded-full bg-sapphire/35 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="ambient-orb ambient-orb-delayed pointer-events-none absolute -bottom-24 -left-16 size-56 rounded-full bg-future-mint/25 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="soft-badge inline-flex items-center gap-2 border border-future-mint/50 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-[0.08em] text-future-mint backdrop-blur-sm">
            <BookOpenText className="size-3.5" aria-hidden="true" />
            Web教科書は、登録なしで完全無料
          </span>
          <span className="text-xs font-semibold tracking-[0.08em] text-white/70">
            購入不要
          </span>
        </div>

        <p className="mt-4 font-mincho text-xl leading-8 text-white sm:text-2xl">
          このサイトを教科書に、
          <br />
          今日からAIを学び始められます。
        </p>

        <div className="mt-5 border-t border-white/15 pt-4">
          <p className="flex items-center gap-2 text-xs font-semibold text-white/85">
            <Video className="size-4 text-future-mint" aria-hidden="true" />
            自分で進めて、迷ったときだけ講師へ。
          </p>
          <p className="mt-2 text-xs tracking-[0.06em] text-white/70">
            全国オンライン・Google Meet
          </p>
          <p className="numeric-text mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <strong className="text-[clamp(2.7rem,6vw,4.7rem)] leading-none font-medium tracking-[-0.065em] text-white">
              4,000円
            </strong>
            <span className="text-base font-semibold text-future-mint sm:text-lg">
              / 50分
            </span>
          </p>
        </div>

        <p className="mt-4 text-xs leading-6 text-white/70">
          実践にはPC・ChatGPT等を使用します。講師受講は別途入会金10,000円と受講料が必要です。税区分等は申込前に案内します。
        </p>
      </div>
    </aside>
  );
}
