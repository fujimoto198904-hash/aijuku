import { ArrowRight, ClipboardList, ShieldCheck } from 'lucide-react';

import Link from '@/components/site-link';
import { PromptCopyButton } from '@/components/home/prompt-copy-button';

const prompt = `下の「届いたメール」を読んで、返信文の草案を作って。
- 相手の質問へ順番に答える
- メールにない事実は足さない
- わからないことは勝手に決めず「確認して返します」と書く
- 丁寧だけど堅すぎない日本語にする
- 件名も付ける
まだ送らない。

届いたメール（練習用・すべて架空）
件名：来週の予約表について

田中様

先日はありがとうございました。
予約キャンセルを減らす案について、来週火曜日に一度見せていただけますか。
料金と、店舗スタッフ2名でも使えるかも教えてください。
可能であれば、今週金曜日までにご返信いただけると助かります。

ひだまり美容室　佐藤`;

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
              登録も購入も不要です。練習用の受信メールを含む下の例を、丸ごとChatGPTへ貼れば返信案を試せます。
            </p>
          </div>
          <p className="mt-10 flex items-start gap-3 border-t border-rule pt-5 text-xs leading-6 text-quiet">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-sapphire"
            />
            自分のメールで試す時は、届いた本文をコピーし、個人情報・顧客名・社外秘を伏せてから貼ります。送信前に事実と宛先を人が確認します。
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
                  届いたメールを、返信案へ
                </p>
                <p className="mt-1 text-xs text-quiet">
                  練習用の受信メール入り・丸ごとコピーできます
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
              '届いたメール本文をコピーする',
              'ChatGPTへ貼り「返信案を作って」と頼む',
              '事実と宛先を確認して送る',
            ].map((step, index) => (
              <li
                className="soft-control flex items-start gap-3 border border-rule bg-paper p-4 leading-6"
                key={step}
              >
                <span
                  aria-hidden="true"
                  className="grid size-7 shrink-0 place-items-center rounded-full bg-sapphire text-[11px] font-bold leading-none text-white"
                >
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          <div className="mt-7 flex flex-col gap-4 border-t border-rule pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-6 text-quiet">
              教材では、練習用メール・修正例・完成条件まで確認できます。
            </p>
            <Link
              className="button-glow group inline-flex min-h-11 shrink-0 items-center justify-center gap-3 px-5 text-xs font-semibold text-white"
              href="/textbook?task=Lv.05"
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
