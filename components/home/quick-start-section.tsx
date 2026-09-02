import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  ShieldCheck,
} from 'lucide-react';

import Link from '@/components/site-link';
import { PromptCopyButton } from '@/components/home/prompt-copy-button';

const prompt = `これ、商談のあと片づけたい。下のメモだけ見て、
1. お礼メールの草案
2. 担当者と期限を分けたToDo
3. 確認が必要な不明点
にして。メモにない話は足さないで。メールはまだ送らない。

商談メモ（全部架空）
ひだまり美容室の佐藤さん。予約キャンセルを減らしたい。
まず今月の予約表を田中が見て、来週火曜に案を持っていく。
料金と誰が店で使うかはまだ聞けてない。金曜までに一度連絡。`;

export function QuickStartSection() {
  return (
    <section
      aria-labelledby="quick-start-title"
      className="section-aura border-b border-rule bg-paper px-5 py-16 sm:px-8 sm:py-20"
      id="quick-start"
    >
      <div className="soft-panel soft-panel-clip mx-auto grid max-w-[1240px] border border-rule bg-paper-white lg:grid-cols-[0.72fr_1.28fr]">
        <div className="flex flex-col justify-between border-b border-rule p-7 sm:p-10 lg:border-b-0 lg:border-r lg:p-12">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-sapphire">
              START HERE / 最初の返答まで3分
            </p>
            <h2
              className="mt-6 font-mincho text-4xl leading-[1.35] tracking-[-0.035em] sm:text-5xl"
              id="quick-start-title"
            >
              まず一つ、
              <br />
              ここで試せます。
            </h2>
            <p className="mt-6 text-sm leading-8 text-quiet sm:text-base">
              登録も購入も不要です。下を丸ごとChatGPTへ貼るだけで、最初の返答を試せます。
            </p>
          </div>
          <p className="mt-10 flex items-start gap-3 border-t border-rule pt-5 text-xs leading-6 text-quiet">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-sapphire"
            />
            顧客名や社外秘は架空の内容へ置き換え、送信前に事実・宛先・期限を人が確認します。
          </p>
        </div>

        <div className="p-7 sm:p-10 lg:p-12">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-sapphire-soft text-sapphire">
                <ClipboardList aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold tracking-[0.1em] text-sapphire">
                  商談メモを、次の仕事へ
                </p>
                <p className="mt-1 text-xs text-quiet">
                  架空メモ入り・丸ごとコピーできます
                </p>
              </div>
            </div>
            <PromptCopyButton prompt={prompt} />
          </div>

          <pre className="soft-control mt-6 overflow-x-auto whitespace-pre-wrap border border-sapphire/20 bg-sapphire-soft/45 p-5 font-sans text-sm leading-7 text-brand-dark sm:p-6">
            {prompt}
          </pre>

          <ol className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
            {[
              '下を全部コピーして貼る',
              '不明点へ答えて直す',
              '送信前に人が確認する',
            ].map((step, index) => (
              <li
                className="soft-control flex items-start gap-3 border border-rule bg-paper p-4 leading-6"
                key={step}
              >
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-[#2d746f]"
                />
                <span>
                  <span className="sr-only">手順{index + 1}：</span>
                  {step}
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-7 flex flex-col gap-4 border-t border-rule pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-6 text-quiet">
              教材では、練習用メモ・修正例・完成条件まで確認できます。
            </p>
            <Link
              className="button-glow group inline-flex min-h-11 shrink-0 items-center justify-center gap-3 px-5 text-xs font-semibold text-white"
              href="/textbook?task=SLS-05"
            >
              この教材を開く
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
