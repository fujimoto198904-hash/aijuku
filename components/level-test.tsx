'use client';

import {
  ArrowLeft,
  ArrowRight,
  Check,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react';
import Link from '@/components/site-link';
import { useEffect, useRef, useState } from 'react';

const questions = [
  {
    question:
      '最新の地域別最低賃金をAIに調べさせる時、最も信頼性を高める指示はどれですか？',
    choices: [
      'できるだけ詳しく教えて、とだけ伝える',
      '基準日、47都道府県、一次情報、参照URL、未確認時の扱いを指定する',
      '一番それらしい金額を推測してもらう',
      'SNSで見かけた数字だけを使うよう指定する',
    ],
    correct: 1,
    explanation:
      '範囲・基準日・情報源・不明時の扱い・自己点検を指定すると、確認可能な回答に近づきます。',
  },
  {
    question:
      '勤務先の顧客データをAIで分類したい時、最初に行うべきことはどれですか？',
    choices: [
      '顧客名や電話番号をそのまま貼り付ける',
      'すべてAIに任せ、後から許可を取る',
      '社内ルールと利用条件を確認し、匿名化したサンプルで試す',
      '無料プランなら安全だと考える',
    ],
    correct: 2,
    explanation:
      '実データ投入前に、組織の承認・利用条件・匿名化・保存方針を確認する必要があります。',
  },
  {
    question:
      'AIが出した回答にもっともらしい数字が含まれていました。次の行動として適切なのは？',
    choices: [
      '文章が自然ならそのまま使う',
      '数字を少し丸めて使う',
      '別のAIが同じ回答なら正しいと判断する',
      '一次情報へ戻り、単位・日付・対象範囲と照合する',
    ],
    correct: 3,
    explanation:
      'AI同士の一致だけでは根拠になりません。最終的には確認可能な一次情報へ戻ります。',
  },
  {
    question: 'AIで出退勤Webアプリを作る課題の、最も安全な始め方はどれですか？',
    choices: [
      '架空データで試作し、権限・監査ログ・脅威を確認する',
      'すぐに実在社員へ使ってもらう',
      'ログイン機能を後回しにして公開する',
      '個人情報を表計算で共有してテストする',
    ],
    correct: 0,
    explanation:
      'まず架空データと閉じた環境で試し、本番前に認証・権限・監査・運用を確認します。',
  },
  {
    question:
      '欲しい回答と違う出力が返ってきました。最も効果的な改善方法はどれですか？',
    choices: [
      '同じ指示を何度もそのまま送る',
      'AIは向いていないと判断してすぐ諦める',
      '目的・対象・条件・出力形式のうち、足りない情報を具体的に追加する',
      '理由を確認せず、最初に出た回答を使う',
    ],
    correct: 2,
    explanation:
      '出力を見て不足条件を特定し、一つずつ追加することがプロンプト改善の基本です。',
  },
  {
    question:
      '表形式の回答が必要な時、AIへの依頼に含めるとよい内容はどれですか？',
    choices: [
      '「いい感じの表にして」だけを伝える',
      '必要な列名、並び順、単位、空欄時の表示を指定する',
      '列名をAIに完全に任せる',
      '文章で回答してから人がすべて作り直す',
    ],
    correct: 1,
    explanation:
      '列名・順序・単位・欠損時の扱いまで決めると、そのまま使いやすい表になります。',
  },
  {
    question:
      'AIで生成した画像を事業のチラシに使う前に、確認すべきことはどれですか？',
    choices: [
      '見た目がきれいかだけ確認する',
      '無料で作った画像なら無条件で使う',
      '似ている人物やロゴがあっても気にしない',
      '利用サービスの規約、第三者の権利、ロゴ・人物・素材の問題を確認する',
    ],
    correct: 3,
    explanation:
      '生成物でも、利用規約や第三者の著作権・商標・肖像などを確認する必要があります。',
  },
  {
    question:
      'AIstockの「AIだけを使って課題を解く」で、人が担う役割として最も適切なのは？',
    choices: [
      '目的を決め、AIの出力を評価し、採用する内容を判断する',
      'AIの回答を確認せず、そのまま提出する',
      '目的も評価もすべてAIに決めさせる',
      '間違いがあってもAIの責任にする',
    ],
    correct: 0,
    explanation:
      '主作業にAIを使っても、目的設定・評価・意思決定の責任は人が担います。',
  },
  {
    question:
      'AIで作ったホームページを公開する前の確認として、最も適切なのはどれですか？',
    choices: [
      '自分のパソコンで表示できれば公開する',
      'スマホ表示、リンク、入力状態、読みやすさ、未提供情報の創作がないかを確認する',
      'AIが完成と言ったら確認しない',
      '住所や実績が足りなければAIに創作させる',
    ],
    correct: 1,
    explanation:
      '端末別表示、操作、アクセシビリティ、内容の正確性まで確認してから公開します。',
  },
  {
    question:
      'AIの無料プランだけで課題に取り組む時の考え方として、正しいものはどれですか？',
    choices: [
      '無料プランの機能や利用上限は今後も絶対に変わらない',
      '無料なら入力データの扱いを確認しなくてよい',
      '現在の機能・利用上限を確認し、必要なら待つか別の方法を選ぶ',
      '有料プランでなければAIは一切使えない',
    ],
    correct: 2,
    explanation:
      '機能や上限は変わる可能性があります。課題開始時に現在の条件を確認して進めます。',
  },
] as const;

export function FoundationCheck() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>(
    Array(questions.length).fill(-1),
  );
  const [finished, setFinished] = useState(false);
  const questionHeadingRef = useRef<HTMLLegendElement>(null);
  const previousQuestionRef = useRef(current);
  const question = questions[current];
  const score = answers.reduce(
    (total, answer, index) =>
      total + (answer === questions[index].correct ? 1 : 0),
    0,
  );
  const passed = score >= 8;

  useEffect(() => {
    if (previousQuestionRef.current === current) return;
    previousQuestionRef.current = current;
    questionHeadingRef.current?.focus();
  }, [current]);

  function selectAnswer(index: number) {
    setAnswers((previous) =>
      previous.map((answer, questionIndex) =>
        questionIndex === current ? index : answer,
      ),
    );
  }

  function reset() {
    setCurrent(0);
    setAnswers(Array(questions.length).fill(-1));
    setFinished(false);
  }

  if (finished) {
    return (
      <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
        <section
          aria-live="polite"
          className="rounded-[30px] border border-ink/10 bg-white p-6 shadow-[0_24px_80px_rgba(8,16,25,0.07)] sm:p-9"
        >
          <div
            className={`grid size-16 place-items-center rounded-full ${passed ? 'bg-future-mint-soft text-success' : 'bg-sunrise-soft text-warning'}`}
          >
            {passed ? (
              <ShieldCheck className="size-8" aria-hidden="true" />
            ) : (
              <RotateCcw className="size-7" aria-hidden="true" />
            )}
          </div>
          <p className="mt-7 text-xs font-bold tracking-[0.08em] text-coral">
            10問チェック｜体験版
          </p>
          <h2 className="mt-3 text-4xl font-bold text-ink">
            {score}問、正解でした。
          </h2>
          <div className="mt-7 flex items-end gap-2">
            <span className="numeric-text text-7xl font-bold text-ink">
              {score}
            </span>
            <span className="pb-2 text-sm font-bold text-quiet">
              / {questions.length} 問
            </span>
          </div>
          <p className="mt-5 max-w-xl text-sm leading-7 text-quiet">
            {passed
              ? '間違えた問題だけ見直して、次へ進めます。'
              : '間違えた問題の解説を見て、もう一度試せます。'}
          </p>

          <div className="mt-8 grid gap-3">
            {questions.map((item, index) => {
              const selectedIndex = answers[index] ?? -1;
              const correct = selectedIndex === item.correct;
              const selectedAnswer =
                selectedIndex >= 0
                  ? item.choices[selectedIndex]
                  : '回答していません';
              const correctAnswer = item.choices[item.correct];
              return (
                <details
                  key={item.question}
                  className="rounded-2xl border border-ink/10 bg-ivory/35 p-4"
                >
                  <summary className="flex cursor-pointer list-none items-center gap-3 text-sm font-bold text-ink">
                    <span
                      className={`grid size-6 shrink-0 place-items-center rounded-full ${correct ? 'bg-future-mint-soft text-success' : 'bg-human-coral-soft text-human-coral'}`}
                    >
                      {correct ? (
                        <Check className="size-3.5" aria-hidden="true" />
                      ) : (
                        <X className="size-3.5" aria-hidden="true" />
                      )}
                    </span>
                    問題 {index + 1}
                  </summary>
                  <p className="mt-4 pl-9 text-sm font-semibold leading-7 text-ink">
                    {item.question}
                  </p>
                  <dl className="mt-4 grid gap-3 pl-9 text-xs leading-6">
                    <div>
                      <dt className="font-semibold text-quiet">あなたの回答</dt>
                      <dd
                        className={`mt-1 ${correct ? 'text-success' : 'text-human-coral'}`}
                      >
                        {selectedIndex >= 0
                          ? `${String.fromCharCode(65 + selectedIndex)}. ${selectedAnswer}`
                          : selectedAnswer}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-quiet">正解</dt>
                      <dd className="mt-1 text-success">
                        {String.fromCharCode(65 + item.correct)}.{' '}
                        {correctAnswer}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-4 border-l-2 border-future-mint pl-4 text-xs leading-6 text-quiet sm:ml-9">
                    {item.explanation}
                  </p>
                </details>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink/15 px-6 text-sm font-bold text-ink transition hover:bg-ink/5"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              もう一度確認する
            </button>
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-6 text-sm font-bold text-ivory transition hover:-translate-y-0.5"
              href="/mypage"
            >
              マイページへ
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <aside className="rounded-[30px] bg-ink p-6 text-ivory shadow-[0_24px_80px_rgba(8,16,25,0.18)] sm:p-8">
          <p className="text-xs font-bold tracking-[0.08em] text-future-mint">
            今回の結果
          </p>
          <div className="my-12 text-center">
            <ShieldCheck
              className="mx-auto size-10 text-amber"
              aria-hidden="true"
            />
            <p className="mt-3 font-mono text-5xl font-black text-future-mint">
              {score} / {questions.length}
            </p>
            <p className="mt-4 text-sm font-bold">
              {passed ? '8問以上正解' : '解説を見て、もう一度'}
            </p>
          </div>
          <div className="border-t border-white/10 pt-5 text-xs leading-6 text-white/75">
            <p>体験結果のため、正式な修了記録や証明書にはなりません。</p>
          </div>
        </aside>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-[850px] overflow-hidden rounded-[30px] border border-ink/10 bg-white shadow-[0_24px_80px_rgba(8,16,25,0.08)]">
      <div className="bg-ink px-6 py-6 text-ivory sm:px-9">
        <div className="flex items-center justify-between">
          <p
            aria-live="polite"
            className="numeric-text text-xs font-bold tracking-[0.06em] text-future-mint"
          >
            問題 {current + 1} / {questions.length}
          </p>
          <p className="text-xs text-white/75">知識・判断・安全性</p>
        </div>
        <progress
          aria-label={`全${questions.length}問中${current + 1}問目`}
          className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-white/15 accent-future-mint"
          max={questions.length}
          value={current + 1}
        />
      </div>

      <div className="p-6 sm:p-9">
        <fieldset>
          <legend
            className="text-xl font-bold leading-8 text-ink outline-none sm:text-2xl"
            ref={questionHeadingRef}
            tabIndex={-1}
          >
            {question.question}
          </legend>
          <div className="mt-7 grid gap-3">
            {question.choices.map((choice, index) => (
              <label
                key={choice}
                className={`flex min-h-[64px] cursor-pointer items-center gap-4 rounded-2xl border p-4 text-left text-sm leading-6 transition focus-within:ring-4 focus-within:ring-sapphire/25 ${answers[current] === index ? 'border-ink bg-ink text-ivory shadow-lg' : 'border-ink/15 bg-ivory/30 text-ink hover:border-ink/40 hover:bg-ivory/60'}`}
              >
                <input
                  checked={answers[current] === index}
                  className="sr-only"
                  name={`foundation-question-${current}`}
                  onChange={() => selectAnswer(index)}
                  type="radio"
                  value={index}
                />
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full border font-mono text-xs ${answers[current] === index ? 'border-future-mint/70 bg-future-mint/15 text-future-mint' : 'border-ink/20 text-quiet'}`}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                {choice}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            disabled={current === 0}
            onClick={() => setCurrent((value) => value - 1)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold text-quiet transition hover:bg-ink/5 disabled:opacity-40"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            戻る
          </button>
          {current < questions.length - 1 ? (
            <button
              type="button"
              disabled={answers[current] < 0}
              onClick={() => setCurrent((value) => value + 1)}
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-bold text-ivory transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-30"
            >
              次の問題
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              disabled={answers[current] < 0}
              onClick={() => setFinished(true)}
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-coral px-6 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-30"
            >
              <ShieldCheck className="size-4" aria-hidden="true" />
              採点する
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
