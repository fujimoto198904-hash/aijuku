import { ArrowRight, ClipboardList, ShieldCheck } from 'lucide-react';

import Link from '@/components/site-link';
import { PromptCopyButton } from '@/components/home/prompt-copy-button';
import { textbookLessonPath } from '@/lib/textbook-routes';

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
      <div className="soft-panel soft-panel-clip mx-auto grid max-w-[1240px] border border-rule bg-paper-white lg:grid-cols-[0.8fr_1.2fr]">
        <div className="flex flex-col justify-between border-b border-rule p-7 sm:p-9 lg:border-b-0 lg:border-r lg:p-10">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-sapphire">
              今日、ひとつ試す
            </p>
            <h2
              className="mt-5 font-mincho text-4xl leading-[1.3] tracking-[-0.035em] sm:text-5xl"
              id="quick-start-title"
            >
              メールの返信を、
              <br />
              AIと作ってみる。
            </h2>
            <p className="mt-5 text-sm leading-7 text-quiet sm:text-base">
              登録はいりません。プロンプトをコピーして、ChatGPTへ貼るだけです。
            </p>
          </div>
          <p className="mt-8 flex items-start gap-3 border-t border-rule pt-5 text-xs leading-6 text-quiet">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-sapphire"
            />
            自分のメールを使う時は、名前や秘密を隠してください。送る前に、内容と宛先を自分で確認します。
          </p>
        </div>

        <div className="p-7 sm:p-9 lg:p-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-sapphire-soft text-sapphire">
                <ClipboardList aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold tracking-[0.1em] text-sapphire">
                  練習用メールから、返信案を作る
                </p>
                <p className="mt-1 text-xs text-quiet">
                  そのままコピーして試せます
                </p>
              </div>
            </div>
            <PromptCopyButton prompt={prompt} />
          </div>

          <ol className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
            {['プロンプトをコピー', 'ChatGPTへ貼る', '内容を確認して送る'].map(
              (step, index) => (
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
              ),
            )}
          </ol>

          <details className="soft-control group mt-5 border border-rule bg-paper px-5 py-4">
            <summary className="cursor-pointer text-sm font-semibold text-sapphire">
              使うプロンプトを見る
            </summary>
            <pre className="mt-4 overflow-x-auto whitespace-pre-wrap border-t border-rule pt-4 font-sans text-xs leading-6 text-brand-dark">
              {prompt}
            </pre>
            <p className="mt-4 border-l-2 border-future-mint pl-3 text-xs leading-6 text-quiet">
              メールにない事実を勝手に足さず、送る前に止まるよう頼んでいます。自分のメールでは「届いたメール」の部分だけ入れ替えます。
            </p>
          </details>

          <div className="mt-5 flex flex-col gap-4 border-t border-rule pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-6 text-quiet">
              詳しい手順や直し方は、教材で見られます。
            </p>
            <Link
              className="button-glow group inline-flex min-h-11 shrink-0 items-center justify-center gap-3 px-5 text-xs font-semibold text-white"
              href={textbookLessonPath('Lv.05')}
              target="_blank"
              rel="noopener noreferrer"
            >
              この教材を新しいタブで開く
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
