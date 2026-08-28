'use client';

import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useState } from 'react';

const questions = [
  {
    question: '最新の地域別最低賃金をAIに調べさせる時、最も信頼性を高める指示はどれですか？',
    choices: [
      'できるだけ詳しく教えて、とだけ伝える',
      '基準日、47都道府県、一次情報、参照URL、未確認時の扱いを指定する',
      '一番それらしい金額を推測してもらう',
      'SNSで見かけた数字だけを使うよう指定する',
    ],
    correct: 1,
    explanation: '範囲・基準日・情報源・不明時の扱い・自己点検を指定すると、確認可能な回答に近づきます。',
  },
  {
    question: '勤務先の顧客データをAIで分類したい時、最初に行うべきことはどれですか？',
    choices: [
      '顧客名や電話番号をそのまま貼り付ける',
      'すべてAIに任せ、後から許可を取る',
      '社内ルールと利用条件を確認し、匿名化したサンプルで試す',
      '無料プランなら安全だと考える',
    ],
    correct: 2,
    explanation: '実データ投入前に、組織の承認・利用条件・匿名化・保存方針を確認する必要があります。',
  },
  {
    question: 'AIが出した回答にもっともらしい数字が含まれていました。次の行動として適切なのは？',
    choices: [
      '文章が自然ならそのまま使う',
      '数字を少し丸めて使う',
      '別のAIが同じ回答なら正しいと判断する',
      '一次情報へ戻り、単位・日付・対象範囲と照合する',
    ],
    correct: 3,
    explanation: 'AI同士の一致だけでは根拠になりません。最終的には確認可能な一次情報へ戻ります。',
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
    explanation: 'まず架空データと閉じた環境で試し、本番前に認証・権限・監査・運用を確認します。',
  },
] as const;

export function LevelTest() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(-1));
  const [finished, setFinished] = useState(false);
  const question = questions[current];
  const score = answers.reduce((total, answer, index) => total + (answer === questions[index].correct ? 1 : 0), 0);
  const passed = score >= 3;

  function selectAnswer(index: number) {
    setAnswers((previous) => previous.map((answer, questionIndex) => questionIndex === current ? index : answer));
  }

  function reset() {
    setCurrent(0);
    setAnswers(Array(questions.length).fill(-1));
    setFinished(false);
  }

  if (finished) {
    return (
      <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
        <section className="rounded-[30px] border border-ink/10 bg-white p-6 shadow-[0_24px_80px_rgba(8,16,25,0.07)] sm:p-9">
          <div className={`grid size-16 place-items-center rounded-full ${passed ? 'bg-lime/35 text-[#4d7207]' : 'bg-amber/25 text-[#92600e]'}`}>
            {passed ? <Award className="size-8" aria-hidden="true" /> : <RotateCcw className="size-7" aria-hidden="true" />}
          </div>
          <p className="mt-7 font-mono text-[10px] font-bold tracking-[0.18em] text-coral">TEST RESULT / DEMO</p>
          <h2 className="mt-3 text-4xl font-black text-ink">{passed ? 'サンプル合格です。' : 'あと一歩です。'}</h2>
          <div className="mt-7 flex items-end gap-2"><span className="font-mono text-7xl font-black tracking-[-0.09em] text-ink">{score}</span><span className="pb-2 text-sm font-bold text-ink/45">/ {questions.length} 問</span></div>
          <p className="mt-5 max-w-xl text-sm leading-7 text-ink/58">{passed ? '情報の確認と安全性について、基本的な判断ができています。正式試験では問題数・範囲・制限時間・再受験条件を明示します。' : '間違えた問題の解説を読み、もう一度試してみましょう。AIを使う力には、出力を疑い、止める判断も含まれます。'}</p>

          <div className="mt-8 grid gap-3">
            {questions.map((item, index) => {
              const correct = answers[index] === item.correct;
              return (
                <details key={item.question} className="rounded-2xl border border-ink/10 bg-ivory/35 p-4">
                  <summary className="flex cursor-pointer list-none items-center gap-3 text-sm font-bold text-ink">
                    <span className={`grid size-6 shrink-0 place-items-center rounded-full ${correct ? 'bg-lime/35 text-[#4d7207]' : 'bg-coral/12 text-coral'}`}>{correct ? <Check className="size-3.5" aria-hidden="true" /> : <X className="size-3.5" aria-hidden="true" />}</span>
                    問題 {index + 1}
                  </summary>
                  <p className="mt-4 pl-9 text-xs leading-6 text-ink/58">{item.explanation}</p>
                </details>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={reset} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink/15 px-6 text-sm font-bold text-ink transition hover:bg-ink/5"><RotateCcw className="size-4" aria-hidden="true" />もう一度受ける</button>
            <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-6 text-sm font-bold text-ivory transition hover:-translate-y-0.5" href="/mypage">マイページへ<ArrowRight className="size-4" aria-hidden="true" /></a>
          </div>
        </section>

        <aside className="rounded-[30px] bg-ink p-6 text-ivory shadow-[0_24px_80px_rgba(8,16,25,0.18)] sm:p-8">
          <p className="font-mono text-[9px] tracking-[0.2em] text-cyan">TOYOTA AI SCHOOL</p>
          <p className="mt-2 text-base font-black tracking-[0.08em]">豊田Ai塾</p>
          <div className="my-12 text-center"><Award className="mx-auto size-10 text-amber" aria-hidden="true" /><p className="mt-5 text-xs font-bold tracking-[0.2em] text-ivory/40">SAMPLE ACHIEVEMENT</p><p className="mt-3 font-mono text-5xl font-black text-cyan">BASIC</p><p className="mt-3 text-sm font-bold">AI安全活用・知識確認</p></div>
          <div className="border-t border-white/10 pt-5 text-[10px] leading-5 text-ivory/38"><p>DEMO ID</p><p className="mt-1 font-mono text-ivory/70">TAI-DEMO-{String(score).padStart(2, '0')}</p><p className="mt-5">この画面は体験用で、正式な証明書として発行・保存されません。</p></div>
        </aside>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-[850px] overflow-hidden rounded-[30px] border border-ink/10 bg-white shadow-[0_24px_80px_rgba(8,16,25,0.08)]">
      <div className="bg-ink px-6 py-6 text-ivory sm:px-9">
        <div className="flex items-center justify-between"><p className="font-mono text-[10px] tracking-[0.18em] text-cyan">QUESTION {current + 1} / {questions.length}</p><p className="text-xs text-ivory/45">知識・判断・安全性</p></div>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan to-lime transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} /></div>
      </div>

      <div className="p-6 sm:p-9">
        <h2 className="text-xl font-black leading-8 text-ink sm:text-2xl">{question.question}</h2>
        <div className="mt-7 grid gap-3">
          {question.choices.map((choice, index) => (
            <button key={choice} type="button" onClick={() => selectAnswer(index)} className={`flex min-h-[64px] items-center gap-4 rounded-2xl border p-4 text-left text-sm leading-6 transition ${answers[current] === index ? 'border-ink bg-ink text-ivory shadow-lg' : 'border-ink/10 bg-ivory/30 text-ink hover:border-ink/30 hover:bg-ivory/60'}`} aria-pressed={answers[current] === index}>
              <span className={`grid size-7 shrink-0 place-items-center rounded-full border font-mono text-xs ${answers[current] === index ? 'border-cyan/40 bg-cyan/10 text-cyan' : 'border-ink/15 text-ink/45'}`}>{String.fromCharCode(65 + index)}</span>
              {choice}
            </button>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button type="button" disabled={current === 0} onClick={() => setCurrent((value) => value - 1)} className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold text-ink/55 transition hover:bg-ink/5 disabled:opacity-25"><ArrowLeft className="size-4" aria-hidden="true" />戻る</button>
          {current < questions.length - 1 ? (
            <button type="button" disabled={answers[current] < 0} onClick={() => setCurrent((value) => value + 1)} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-bold text-ivory transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-30">次の問題<ArrowRight className="size-4" aria-hidden="true" /></button>
          ) : (
            <button type="button" disabled={answers[current] < 0} onClick={() => setFinished(true)} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-coral px-6 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-30"><ShieldCheck className="size-4" aria-hidden="true" />採点する</button>
          )}
        </div>
      </div>
    </section>
  );
}
