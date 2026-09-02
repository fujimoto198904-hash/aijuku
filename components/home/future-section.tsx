import Image from "next/image";

import { SectionIntro } from "@/components/home/section-intro";
import fieldImage from "@/sozai/melon-house.jpg";
import dailyFutureImage from "@/sozai/jimu-akarui.jpg";
import teamFutureImage from "@/sozai/shodan-tablet.jpg";

const futureScenes = [
  {
    number: "01",
    label: "朝から、暮らしへ",
    english: "A CLEAR START",
    titleLines: ["朝、やることが見える。", "大事なことから", "始められる。"],
    body: "予定、ToDo、確認待ちを一枚にまとめ、自分に必要な情報だけを読む。何から手をつけようと迷っていた朝を、最初の一歩が見える朝へ変えていきます。",
    outcome: "朝3分ブリーフ・予定の整理",
    image: dailyFutureImage,
    alt: "朝の仕事を整理し、最初の一つに取りかかる場面の素材写真",
    caption: "予定とToDoを一枚にまとめ、大事な一つから始める",
  },
  {
    number: "02",
    label: "仕事の真ん中で",
    english: "MOVE WORK FORWARD",
    titleLines: ["頭の中の案が、", "送れる・見せられる", "形になる。"],
    body: "散らかったメモをメールや資料へ。会議の内容を、担当と期限が分かる次の仕事へ。AIの答えを鵜呑みにせず、事実や相手への配慮を自分で確かめて、現場で使える形まで仕上げます。",
    outcome: "メール草案・会議後ToDo・提案のたたき台",
    image: fieldImage,
    alt: "現場のメモを資料と次の行動へ整える場面の素材写真",
    caption: "散らかったメモを、送れる文章と次の行動へ変える",
  },
  {
    number: "03",
    label: "周りの人と、その先へ",
    english: "PASS IT ON",
    titleLines: ["自分の「できた」が、", "誰かの「助かった」へ。"],
    body: "うまくいった会話、判断の理由、人が確認する場所を手順として残す。進みたい人は、毎日の仕事を小さなWebの仕組みへ育て、家族や職場の仲間が続きから使える状態を目指します。",
    outcome: "手順書・確認表・小さなWebの仕組み",
    image: teamFutureImage,
    alt: "作った手順を共有し、チームで続きを進める場面の素材写真",
    caption: "うまくいった手順を残し、次の人が続きから進められるようにする",
  },
] as const;

export function FutureSection() {
  return (
    <section className="section-aura px-5 py-24 sm:px-8 sm:py-32" id="goals">
      <div className="mx-auto max-w-[1240px]">
        <SectionIntro
          body={
            <p>
              学ぶのは、AIの機能の名前ではなく、明日の過ごし方を変えるため。朝の迷いが減り、止まっていた仕事が一つ進み、できた工夫を誰かへ渡せる。そんな未来を、朝の3分や一通のメールから形にします。
            </p>
          }
          index="01"
          label="AFTER LEARNING"
          title={
            <>
              AIを学んだ先に、
              <br />
              変わる毎日がある。
            </>
          }
        />

        <div className="mt-16 space-y-16 sm:space-y-20 lg:space-y-24">
          {futureScenes.map((scene, index) => (
            <article
              className="soft-panel soft-panel-clip soft-interactive image-soft-zoom group scroll-reveal grid border border-rule bg-paper-white lg:grid-cols-12"
              key={scene.number}
            >
              <figure
                className={`relative min-h-[290px] overflow-hidden bg-rule sm:min-h-[420px] lg:col-span-7 lg:min-h-[520px] ${index % 2 === 1 ? "lg:order-2" : ""}`}
              >
                <Image
                  alt={scene.alt}
                  className="object-cover saturate-[0.97] transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                  fill
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  src={scene.image}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 to-transparent"
                />
                <figcaption className="absolute bottom-0 left-0 px-5 py-4 text-xs tracking-[0.06em] text-white/85 sm:px-7">
                  素材写真｜{scene.caption}
                </figcaption>
              </figure>

              <div
                className={`relative flex min-h-[430px] flex-col justify-between p-7 sm:p-10 lg:col-span-5 lg:min-h-[520px] lg:p-12 xl:p-14 ${index % 2 === 1 ? "lg:order-1" : ""}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-5 border-b border-rule pb-5">
                    <p className="text-xs font-semibold tracking-[0.14em] text-sapphire">
                      {scene.label}
                    </p>
                    <p className="font-mono text-xs tracking-[0.12em] text-quiet">
                      {scene.number}
                    </p>
                  </div>
                  <p className="mt-8 text-xs font-semibold tracking-[0.14em] text-quiet">
                    {scene.english}
                  </p>
                  <h3 className="mt-4 font-mincho text-[clamp(1.75rem,3vw,2.25rem)] leading-[1.45] tracking-[-0.025em]">
                    {scene.titleLines.map((line) => (
                      <span className="block" key={line}>
                        {line}
                      </span>
                    ))}
                  </h3>
                  <p className="mt-6 text-sm leading-8 text-quiet sm:text-base">
                    {scene.body}
                  </p>
                </div>

                <div className="mt-10 border-l-2 border-future-mint pl-5">
                  <p className="text-xs font-semibold tracking-[0.1em] text-quiet">
                    教科書で形にするもの
                  </p>
                  <p className="mt-2 font-mincho text-lg leading-8">
                    {scene.outcome}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="soft-panel soft-panel-clip soft-dark-glow mt-16 grid bg-brand-dark text-white sm:mt-20 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="border-b border-white/20 p-7 sm:p-10 lg:border-b-0 lg:border-r lg:p-12">
            <p className="text-xs font-semibold tracking-[0.16em] text-future-mint">
              CHOOSE YOUR FUTURE
            </p>
            <p className="mt-8 font-mincho text-3xl leading-[1.5] sm:text-4xl">
              一つ使えたら、
              <br />
              それで十分。
            </p>
          </div>
          <div className="flex items-center p-7 sm:p-10 lg:p-12">
            <div className="max-w-3xl">
              <p className="font-mincho text-2xl leading-[1.6] sm:text-3xl">
                もっと進みたくなったら、次へ。
              </p>
              <p className="mt-5 text-sm leading-8 text-white/70 sm:text-base">
                暮らしに一つ役立てたい人も、仕事を変えたい人も、周りの人へ広げたい人も。全員が同じ上級者になる必要はありません。いま欲しい未来から学びます。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
