import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import Image from "next/image";

import { SectionIntro } from "@/components/home/section-intro";
import fujimotoProfileImage from "@/sozai/fujimoto-profile.webp";
import teachingImage from "@/sozai/office-teach.jpg";

const learningCycleSteps = [
  {
    number: "01",
    phase: "塾 / IN CLASS",
    title: "今日の一手を決める",
    body: "「何を覚えるか」ではなく、「今日は何を使える形にするか」を一つ決めます。",
    desktopOrder: "md:order-1",
    connector: "right",
  },
  {
    number: "02",
    phase: "塾 / IN CLASS",
    title: "教科書で作り、講師に聞く",
    body: "教科書の手順と完成条件を見ながら自分で進め、止まったところだけ藤本や担当講師に相談します。",
    desktopOrder: "md:order-2",
    connector: "right",
  },
  {
    number: "03",
    phase: "持ち帰る / TAKE HOME",
    title: "成果物ごと、持ち帰る",
    body: "作ったもの、試した頼み方、確認したこと、次に直す一手を、自分のフォルダへ残します。",
    desktopOrder: "md:order-3",
    connector: "down",
  },
  {
    number: "04",
    phase: "自宅・仕事 / SELF STUDY",
    title: "教科書を見て、自習する",
    body: "もう一度開いて実際に使い、うまくいった点と困った点を短く記録します。",
    desktopOrder: "md:order-6",
    connector: "left",
  },
  {
    number: "05",
    phase: "次回の塾 / BACK IN CLASS",
    title: "気づきを持って、塾へ戻る",
    body: "成果物と試した結果を見せ、講師と原因を整理。前回の続きから、一つずつ直します。",
    desktopOrder: "md:order-5",
    connector: "left",
  },
  {
    number: "06",
    phase: "次の一周 / LEVEL UP",
    title: "同じ作品を、一段育てる",
    body: "合格版を次の土台にして、機能や使える場面を一つ広げます。そしてまた、次の「今日の一手」へ。",
    desktopOrder: "md:order-4",
    connector: "up",
  },
] as const;

function CycleConnector({
  direction,
  mobile = false,
}: {
  direction: "right" | "down" | "left" | "up";
  mobile?: boolean;
}) {
  const Icon =
    direction === "right"
      ? ArrowRight
      : direction === "left"
        ? ArrowLeft
        : direction === "up"
          ? ArrowUp
          : ArrowDown;
  const placement = mobile
    ? "-bottom-3 left-7 grid md:hidden"
    : direction === "right"
      ? "-right-3 top-1/2 hidden -translate-y-1/2 md:grid"
      : direction === "down"
        ? "-bottom-3 left-1/2 hidden -translate-x-1/2 md:grid"
        : direction === "left"
          ? "-left-3 top-1/2 hidden -translate-y-1/2 md:grid"
          : "-top-3 left-1/2 hidden -translate-x-1/2 md:grid";

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
    <section id="learning" className="section-aura px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-[1240px]">
        <SectionIntro
          index="04"
          label="HOW TO LEARN"
          title={
            <>
              作る。持ち帰る。試す。
              <br />
              また塾で、磨いていく。
            </>
          }
          body={
            <p>
              教室で一度できたら、終わりではありません。その日の成果物と「次の一手」を持ち帰り、自宅や仕事で教科書を見ながらもう一度試す。うまくいったことも迷ったことも次回の学びへ持ち込み、同じ作品に一つずつ力を足していきます。
            </p>
          }
        />

        <figure className="soft-panel soft-panel-clip image-soft-zoom mt-16 grid border border-rule lg:grid-cols-[1.22fr_0.78fr]">
          <div className="relative min-h-[280px] overflow-hidden bg-rule sm:min-h-[340px]">
            <Image
              src={teachingImage}
              alt="Web教科書を見ながら成果物を作り、止まった所を講師と確認する場面の素材写真"
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover saturate-[0.97]"
            />
            <div
              className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 to-transparent"
              aria-hidden="true"
            />
            <figcaption className="absolute bottom-0 left-0 px-5 py-4 text-xs tracking-[0.06em] text-white/85 sm:px-7">
              素材写真｜教科書で一つ作り、成果物ごと持ち帰る
            </figcaption>
          </div>
          <div className="flex items-center bg-brand-dark p-7 text-white sm:p-10 lg:p-12">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-future-mint">
                IN CLASS ↔ DAILY LIFE
              </p>
              <p className="mt-7 font-mincho text-3xl leading-[1.55] sm:text-4xl">
                教室だけで、
                <br />
                完結させない。
              </p>
              <p className="mt-6 text-sm leading-8 text-white/65">
                持ち帰った後も、教科書で自習して実際に使えます。次回は、できたものと困ったことの続きから始めます。
              </p>
              <div className="mt-8 flex items-center gap-4 border-t border-white/15 pt-6">
                <div className="relative size-28 shrink-0 overflow-hidden rounded-3xl border border-white/15 bg-black/20">
                  <Image
                    src={fujimotoProfileImage}
                    alt="講師の藤本亮志"
                    fill
                    sizes="112px"
                    className="origin-[54%_25%] scale-[2.2] object-cover object-[54%_25%]"
                  />
                </div>
                <p className="text-sm leading-7 text-white/70">
                  藤本亮志を中心に、講座と日程に合わせて担当講師が対応。その日の「分からない所」を一緒に確認します。
                </p>
              </div>
            </div>
          </div>
        </figure>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {learningCycleSteps.map((step, index) => (
            <article
              key={step.number}
              className={`soft-card soft-interactive relative min-h-[245px] border border-rule bg-paper-white p-7 hover:bg-sapphire-soft/35 sm:p-8 ${step.desktopOrder}`}
            >
              <div className="flex items-start justify-between gap-5">
                <p className="text-xs font-semibold tracking-[0.1em] text-sapphire">
                  {step.phase}
                </p>
                <p className="font-mono text-xs tracking-[0.12em] text-quiet">
                  {step.number}
                </p>
              </div>
              <h3 className="mt-10 font-mincho text-2xl leading-9">
                {step.title}
              </h3>
              <p className="mt-5 text-sm leading-7 text-quiet">{step.body}</p>

              {index < learningCycleSteps.length - 1 ? (
                <CycleConnector direction="down" mobile />
              ) : null}
              <CycleConnector direction={step.connector} />
            </article>
          ))}
        </div>

        <div className="soft-panel soft-panel-clip soft-dark-glow mt-6 grid bg-brand-dark text-white md:grid-cols-[0.8fr_1.2fr]">
          <div className="border-b border-white/20 p-7 sm:p-9 md:border-b-0 md:border-r">
            <p className="text-xs font-semibold tracking-[0.16em] text-future-mint">
              REPEAT &amp; LEVEL UP
            </p>
            <p className="mt-5 font-mincho text-2xl leading-10 sm:text-3xl">
              一周するたび、
              <br />
              同じ成果物が一段育つ。
            </p>
          </div>
          <div className="flex items-center p-7 sm:p-9">
            <div>
              <p className="font-mincho text-xl leading-9 sm:text-2xl">
                繰り返すのは、同じ練習ではありません。
              </p>
              <p className="mt-4 text-sm leading-8 text-white/65">
                使えるものを持ち帰り、試し、続きを育てる。ここでいうレベルアップは、人の優劣ではなく、作品にできることや使える場面が一つ増えることです。
              </p>
              <p className="mt-5 flex items-center gap-3 text-xs font-semibold tracking-[0.12em] text-future-mint">
                <ArrowUp className="size-4" aria-hidden="true" />
                そしてまた、次の「今日の一手」へ
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
