'use client';

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CircleCheck,
  Clock3,
  Laptop,
  Mail,
  MapPin,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { FormEvent, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';

const dates = [
  { id: '2026-09-01', weekday: '火', date: '9/1', status: '空席あり' },
  { id: '2026-09-02', weekday: '水', date: '9/2', status: '残りわずか' },
  { id: '2026-09-03', weekday: '木', date: '9/3', status: '空席あり' },
  { id: '2026-09-04', weekday: '金', date: '9/4', status: '空席あり' },
] as const;

export function ReservationForm() {
  const [date, setDate] = useState<(typeof dates)[number]['id']>('2026-09-01');
  const [rental, setRental] = useState<'own' | 'rental'>('own');
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (submitted) {
    const selectedDate = dates.find((item) => item.id === date) ?? dates[0];
    return (
      <div className="rounded-[30px] border border-ink/10 bg-white p-6 shadow-[0_24px_80px_rgba(8,16,25,0.08)] sm:p-10">
        <div className="mx-auto max-w-[620px] text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-lime/35 text-[#4d7207]">
            <CircleCheck className="size-8" aria-hidden="true" />
          </span>
          <p className="mt-6 font-mono text-[10px] font-bold tracking-[0.18em] text-coral">DEMO CONFIRMATION</p>
          <h2 className="mt-3 text-3xl font-black text-ink">入力内容を確認できました。</h2>
          <p className="mt-4 text-sm leading-7 text-ink/55">
            これは予約体験のデモです。現在はまだ運営へ送信されていません。
            本番接続後は、確認メールと変更リンクが届きます。
          </p>

          <div className="mt-8 rounded-2xl bg-ivory p-5 text-left">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-ink/40">お名前</dt><dd className="mt-1 font-bold text-ink">{name || '未入力'}</dd></div>
              <div><dt className="text-xs text-ink/40">メール</dt><dd className="mt-1 break-all font-bold text-ink">{email || '未入力'}</dd></div>
              <div><dt className="text-xs text-ink/40">体験日</dt><dd className="mt-1 font-bold text-ink">2026年{selectedDate.date}（{selectedDate.weekday}）18:00–21:00</dd></div>
              <div><dt className="text-xs text-ink/40">利用環境</dt><dd className="mt-1 font-bold text-ink">{rental === 'rental' ? 'PC＋AI環境をレンタル' : '自分のPC・AIアカウント'}</dd></div>
            </dl>
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" onClick={() => setSubmitted(false)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink/15 px-6 text-sm font-bold text-ink transition hover:bg-ink/5">
              <ArrowLeft className="size-4" aria-hidden="true" />
              入力に戻る
            </button>
            <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-6 text-sm font-bold text-ivory transition hover:-translate-y-0.5" href="/mypage">
              マイページを見る
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
      <div className="rounded-[30px] border border-ink/10 bg-white p-5 shadow-[0_24px_80px_rgba(8,16,25,0.07)] sm:p-8">
        <div className="flex items-center gap-3 border-b border-ink/8 pb-5">
          <span className="grid size-9 place-items-center rounded-full bg-coral text-sm font-black text-white">1</span>
          <div><h2 className="text-lg font-black text-ink">体験日を選ぶ</h2><p className="mt-0.5 text-xs text-ink/42">日程はデモ用の表示です</p></div>
        </div>

        <fieldset className="mt-6">
          <legend className="sr-only">体験日</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {dates.map((item) => (
              <button key={item.id} type="button" onClick={() => setDate(item.id)} className={`min-h-[112px] rounded-2xl border p-3 text-left transition ${date === item.id ? 'border-ink bg-ink text-ivory shadow-lg' : 'border-ink/10 bg-ivory/45 text-ink hover:border-ink/25'}`} aria-pressed={date === item.id}>
                <span className={`text-[10px] font-bold ${date === item.id ? 'text-cyan' : item.status === '残りわずか' ? 'text-coral' : 'text-[#4d7207]'}`}>{item.status}</span>
                <span className="mt-4 block font-mono text-2xl font-black">{item.date}</span>
                <span className={`mt-1 block text-xs ${date === item.id ? 'text-ivory/45' : 'text-ink/45'}`}>（{item.weekday}）18:00–21:00</span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-9 flex items-center gap-3 border-b border-ink/8 pb-5">
          <span className="grid size-9 place-items-center rounded-full bg-amber text-sm font-black text-ink">2</span>
          <div><h2 className="text-lg font-black text-ink">利用する環境</h2><p className="mt-0.5 text-xs text-ink/42">初回体験のレンタル条件は正式公開時に確定します</p></div>
        </div>

        <fieldset className="mt-6 grid gap-3 sm:grid-cols-2">
          <legend className="sr-only">利用する環境</legend>
          <button type="button" onClick={() => setRental('own')} className={`flex min-h-[122px] items-start gap-4 rounded-2xl border p-4 text-left transition ${rental === 'own' ? 'border-ink bg-ink/[0.04]' : 'border-ink/10 hover:border-ink/25'}`} aria-pressed={rental === 'own'}>
            <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border ${rental === 'own' ? 'border-ink bg-ink text-white' : 'border-ink/20'}`}>{rental === 'own' && <Check className="size-3" aria-hidden="true" />}</span>
            <span><span className="block text-sm font-black text-ink">自分のPC・アカウント</span><span className="mt-2 block text-xs leading-6 text-ink/48">使い慣れた環境をお持ちください。料金の追加はありません。</span></span>
          </button>
          <button type="button" onClick={() => setRental('rental')} className={`flex min-h-[122px] items-start gap-4 rounded-2xl border p-4 text-left transition ${rental === 'rental' ? 'border-ink bg-ink/[0.04]' : 'border-ink/10 hover:border-ink/25'}`} aria-pressed={rental === 'rental'}>
            <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border ${rental === 'rental' ? 'border-ink bg-ink text-white' : 'border-ink/20'}`}>{rental === 'rental' && <Check className="size-3" aria-hidden="true" />}</span>
            <span><span className="flex items-center gap-2 text-sm font-black text-ink">PC＋受講用AI環境<span className="rounded-full bg-amber/25 px-2 py-0.5 text-[9px] text-[#92600e]">1,000円</span></span><span className="mt-2 block text-xs leading-6 text-ink/48">1回最大3時間。利用者ごとに分離した環境を予定しています。</span></span>
          </button>
        </fieldset>

        <div className="mt-9 flex items-center gap-3 border-b border-ink/8 pb-5">
          <span className="grid size-9 place-items-center rounded-full bg-cyan text-sm font-black text-ink">3</span>
          <div><h2 className="text-lg font-black text-ink">あなたについて</h2><p className="mt-0.5 text-xs text-ink/42">体験内容を合わせるために使います</p></div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div><Label htmlFor="name" className="mb-2 text-sm font-bold">お名前 <span className="text-coral">必須</span></Label><Input id="name" name="name" value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" placeholder="豊田 花子" className="min-h-12 rounded-xl bg-ivory/40 px-4" /></div>
          <div><Label htmlFor="email" className="mb-2 text-sm font-bold">メールアドレス <span className="text-coral">必須</span></Label><Input id="email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} required type="email" autoComplete="email" placeholder="you@example.com" className="min-h-12 rounded-xl bg-ivory/40 px-4" /></div>
          <div><Label htmlFor="phone" className="mb-2 text-sm font-bold">電話番号</Label><Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="090-0000-0000" className="min-h-12 rounded-xl bg-ivory/40 px-4" /></div>
          <div><Label htmlFor="experience" className="mb-2 text-sm font-bold">AIの経験</Label><NativeSelect id="experience" name="experience" className="w-full [&_[data-slot=native-select]]:min-h-12 [&_[data-slot=native-select]]:rounded-xl [&_[data-slot=native-select]]:bg-ivory/40 [&_[data-slot=native-select]]:px-4"><NativeSelectOption value="first">ほぼ初めて</NativeSelectOption><NativeSelectOption value="sometimes">時々使う</NativeSelectOption><NativeSelectOption value="daily">仕事や生活で毎日使う</NativeSelectOption><NativeSelectOption value="build">AIで制作・開発経験あり</NativeSelectOption></NativeSelect></div>
          <div className="sm:col-span-2"><Label htmlFor="goal" className="mb-2 text-sm font-bold">AIでできるようになりたいこと</Label><Textarea id="goal" name="goal" placeholder="例：仕事の資料作成を速くしたい／自分のホームページを作りたい" className="min-h-28 rounded-xl bg-ivory/40 p-4" /></div>
        </div>
      </div>

      <aside className="sticky top-5 rounded-[26px] bg-ink p-6 text-ivory shadow-[0_24px_80px_rgba(8,16,25,0.18)]">
        <p className="font-mono text-[10px] font-bold tracking-[0.18em] text-cyan">YOUR TRIAL</p>
        <h2 className="mt-3 text-xl font-black">予約内容</h2>
        <dl className="mt-6 grid gap-5 border-y border-white/10 py-6 text-sm">
          <div className="flex gap-3"><CalendarDays className="mt-0.5 size-4 shrink-0 text-cyan" aria-hidden="true" /><div><dt className="text-xs text-ivory/38">日程</dt><dd className="mt-1 font-bold">2026年{dates.find((item) => item.id === date)?.date} 18:00–21:00</dd></div></div>
          <div className="flex gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-coral" aria-hidden="true" /><div><dt className="text-xs text-ivory/38">会場</dt><dd className="mt-1 font-bold">ブリッジスタッフサービス</dd></div></div>
          <div className="flex gap-3"><Laptop className="mt-0.5 size-4 shrink-0 text-amber" aria-hidden="true" /><div><dt className="text-xs text-ivory/38">利用環境</dt><dd className="mt-1 font-bold">{rental === 'rental' ? 'PC＋AI環境レンタル' : '自分のPC・アカウント'}</dd></div></div>
          <div className="flex gap-3"><Clock3 className="mt-0.5 size-4 shrink-0 text-lime" aria-hidden="true" /><div><dt className="text-xs text-ivory/38">体験料金</dt><dd className="mt-1 text-xl font-black text-lime">0円</dd></div></div>
        </dl>
        <div className="mt-5 flex items-start gap-2 rounded-xl bg-amber/10 p-3 text-[11px] leading-5 text-amber"><ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />現在はUIデモです。送信・決済・席数確保は行いません。</div>
        <button type="submit" className="group mt-5 inline-flex min-h-14 w-full items-center justify-between rounded-full bg-coral px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#f07b5d]"><span>入力内容を確認する</span><span className="grid size-8 place-items-center rounded-full bg-white/14"><ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span></button>
        <p className="mt-4 text-center text-[10px] leading-5 text-ivory/35">本番では、送信前に利用規約とプライバシーポリシーへの同意を確認します。</p>
      </aside>
    </form>
  );
}
