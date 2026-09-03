import Image from 'next/image';

import { SectionIntro } from '@/components/home/section-intro';
import ideaFutureImage from '@/sozai/eigyo-tablet-machi.jpg';
import dailyFutureImage from '@/sozai/jimu-akarui.jpg';
import careerFutureImage from '@/sozai/office-smile-woman.jpg';

const futureScenes = [
  {
    label: '仕事に余裕ができる',
    title: '夕方、少し早く帰れる。',
    body: '面倒な作業を早く終えて、大事な仕事に時間を使えます。',
    image: dailyFutureImage,
    alt: '明るい職場で、ゆとりを持って仕事をする女性',
  },
  {
    label: '自分で作れる',
    title: '思いついた日に、形にできる。',
    body: '文章、画像、資料、Web。誰かに頼む前に、自分で一歩進められます。',
    image: ideaFutureImage,
    alt: 'タブレットを持ち、前向きな表情で歩く女性',
  },
  {
    label: '仕事の幅が広がる',
    title: '「それ、作れます」に変わる。',
    body: 'できることが一つずつ増えて、自信を持って仕事に向き合えます。',
    image: careerFutureImage,
    alt: '明るい職場で、自信を持って働く女性',
  },
] as const;

export function FutureSection() {
  return (
    <section className="section-aura px-5 py-20 sm:px-8 sm:py-28" id="goals">
      <div className="mx-auto max-w-[1240px]">
        <SectionIntro
          body={
            <p>
              メールが早くできる。アイデアが形になる。毎日に、少し余裕ができる。そんな身近な変化から始めます。
            </p>
          }
          label="学んだ先"
          title={
            <>
              AIが使えると、
              <br />
              毎日はこう変わる。
            </>
          }
        />

        <div className="desktop-compact-grid-3 mt-12 grid gap-5 lg:grid-cols-3">
          {futureScenes.map((scene) => (
            <article
              className="soft-card soft-interactive image-soft-zoom group overflow-hidden border border-rule bg-paper-white"
              key={scene.label}
            >
              <figure className="relative aspect-[4/3] overflow-hidden bg-rule">
                <Image
                  alt={scene.alt}
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  src={scene.image}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 to-transparent"
                />
                <p className="absolute bottom-5 left-5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-sapphire backdrop-blur-sm">
                  {scene.label}
                </p>
              </figure>
              <div className="p-6 sm:p-7">
                <h3 className="font-mincho text-2xl leading-9">
                  {scene.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-quiet">
                  {scene.body}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="soft-panel soft-dark-glow mt-8 flex flex-col gap-4 bg-brand-dark p-7 text-white sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <p className="font-mincho text-2xl leading-9 sm:text-3xl">
            今日の小さな「できた」が、明日の自信になる。
          </p>
          <p className="max-w-2xl text-sm leading-7 text-white/70">
            必要になったら、次へ。自分のペースで進めます。
          </p>
        </div>
      </div>
    </section>
  );
}
