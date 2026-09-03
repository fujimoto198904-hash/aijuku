import { ArrowDown, ArrowRight } from 'lucide-react';
import Image from 'next/image';

import { SectionIntro } from '@/components/home/section-intro';
import fujimotoProfileImage from '@/sozai/fujimoto-profile.webp';
import teachingImage from '@/sozai/office-teach.jpg';

const learningCycleSteps = [
  {
    number: '01',
    title: '今日作るものを決める',
    body: 'メール、資料、画像など、今日ほしいものを一つ選びます。',
  },
  {
    number: '02',
    title: '教科書を見て作る',
    body: '自分で手を動かします。止まった所だけ、講師に聞けます。',
  },
  {
    number: '03',
    title: '持ち帰って使う',
    body: '作ったものを、家や仕事で実際に使ってみます。',
  },
  {
    number: '04',
    title: '困った所を聞いて、続きから',
    body: '次は、うまくいかなかった所を直します。少しずつできることが増えます。',
  },
] as const;

function CycleConnector({ mobile = false }: { mobile?: boolean }) {
  const Icon = mobile ? ArrowDown : ArrowRight;
  const placement = mobile
    ? 'desktop-compact-cycle-arrow -bottom-3 left-7 grid lg:hidden'
    : '-right-3 top-1/2 hidden -translate-y-1/2 lg:grid';

  return (
    <span
      className={`absolute z-10 size-6 place-items-center rounded-full bg-paper text-sapphire shadow-[0_7px_18px_rgba(52,95,231,0.14)] ${placement}`}
      aria-hidden="true"
    >
      <Icon className="size-4" />
    </span>
  );
}

export function LearningCycleSection() {
  return (
    <section id="learning" className="section-aura px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-[1240px]">
        <SectionIntro
          label="学び方"
          title={
            <>
              作る。使う。
              <br />
              また、少し良くする。
            </>
          }
          body={
            <p>
              教科書で一つ作り、家や仕事で使ってみる。困った所は、次の授業で聞く。このくり返しです。
            </p>
          }
        />

        <div className="desktop-compact-grid-4 mt-10 grid gap-5 lg:grid-cols-4">
          {learningCycleSteps.map((step, index) => (
            <article
              key={step.number}
              className="soft-card soft-interactive relative min-h-[200px] border border-rule bg-paper-white p-6 hover:bg-sapphire-soft/35 sm:p-7"
            >
              <div className="flex items-start justify-between gap-5">
                <p className="text-xs font-semibold tracking-[0.1em] text-sapphire">
                  STEP
                </p>
                <p className="font-mono text-xs tracking-[0.12em] text-quiet">
                  {step.number}
                </p>
              </div>
              <h3 className="mt-7 font-mincho text-xl leading-8 sm:text-2xl">
                {step.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-quiet">{step.body}</p>

              {index < learningCycleSteps.length - 1 ? (
                <>
                  <CycleConnector mobile />
                  <CycleConnector />
                </>
              ) : null}
            </article>
          ))}
        </div>

        <figure className="desktop-compact-split-wide soft-panel soft-panel-clip image-soft-zoom mt-8 grid border border-rule lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative min-h-[220px] overflow-hidden bg-rule sm:min-h-[260px]">
            <Image
              src={teachingImage}
              alt="Web教科書を見ながら、講師と一緒に学ぶ様子"
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover saturate-[0.97]"
            />
            <div
              className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 to-transparent"
              aria-hidden="true"
            />
          </div>
          <div className="flex items-center bg-brand-dark p-7 text-white sm:p-10 lg:p-12">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-future-mint">
                授業もWeb教科書どおり
              </p>
              <p className="mt-5 font-mincho text-3xl leading-[1.45] sm:text-4xl">
                自分で進めて、止まった所だけ聞く。
              </p>
              <div className="mt-6 flex items-center gap-4 border-t border-white/15 pt-5">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-3xl border border-white/15 bg-black/20">
                  <Image
                    src={fujimotoProfileImage}
                    alt="講師の藤本亮志"
                    fill
                    sizes="80px"
                    className="origin-[54%_25%] scale-[2.2] object-cover object-[54%_25%]"
                  />
                </div>
                <p className="text-sm leading-7 text-white/70">
                  藤本亮志を中心に、内容に合う講師が一緒に確認します。
                </p>
              </div>
            </div>
          </div>
        </figure>
      </div>
    </section>
  );
}
