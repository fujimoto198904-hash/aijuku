'use client';

import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CircleHelp,
  Compass,
  Heart,
  Laptop,
  Lightbulb,
  LoaderCircle,
  Palette,
  Rocket,
  ShieldCheck,
  Sparkles,
  UsersRound,
  WandSparkles,
} from 'lucide-react';
import {
  type ComponentType,
  type Ref,
  type SubmitEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

import Link from '@/components/site-link';
import { sharedFees } from '@/lib/member-service-plans';
import { withSiteBasePath } from '@/lib/site-paths';

type LearningGoal =
  | 'daily-life'
  | 'work-efficiency'
  | 'creative'
  | 'build'
  | 'team'
  | 'explore';

type StartMode =
  | 'level-zero'
  | 'quick-win'
  | 'build-now'
  | 'focus-area'
  | 'recommend';

type Option<T extends string> = {
  value: T;
  title: string;
  body: string;
  Icon: ComponentType<{
    className?: string;
    'aria-hidden'?: boolean | 'true' | 'false';
  }>;
};

const goals: readonly Option<LearningGoal>[] = [
  {
    value: 'daily-life',
    title: '暮らしをちょっと楽に',
    body: '調べもの、予定、文章など、日常の面倒を減らしたい',
    Icon: Heart,
  },
  {
    value: 'work-efficiency',
    title: '仕事を早く、わかりやすく',
    body: 'メール、資料、集計などの時間を短くしたい',
    Icon: BriefcaseBusiness,
  },
  {
    value: 'creative',
    title: '画像や文章を作りたい',
    body: '頭の中のイメージを形にしたい',
    Icon: Palette,
  },
  {
    value: 'build',
    title: 'Webサイトや自動化を作りたい',
    body: '自分で使えるものを完成させたい',
    Icon: Laptop,
  },
  {
    value: 'team',
    title: '周りの人と一緒に使いたい',
    body: '会社やチームで、安全に役立つ使い方を広げたい',
    Icon: UsersRound,
  },
  {
    value: 'explore',
    title: 'まずAIを試してみたい',
    body: '何ができるか、使いながら知りたい',
    Icon: Compass,
  },
] as const;

const startModes: readonly Option<StartMode>[] = [
  {
    value: 'level-zero',
    title: 'スマホ・パソコンの基本から',
    body: '不安を残さず、Level 0から1段ずつ進む',
    Icon: Lightbulb,
  },
  {
    value: 'quick-win',
    title: 'すぐ役立つ小さな課題から',
    body: 'まずは短時間で「できた」を一つ作る',
    Icon: Sparkles,
  },
  {
    value: 'build-now',
    title: '今つくりたいものから',
    body: '目的の成果物を決め、必要な知識を途中で学ぶ',
    Icon: Rocket,
  },
  {
    value: 'focus-area',
    title: '学びたい分野だけ',
    body: '画像、資料、Webなど、気になる領域に絞る',
    Icon: WandSparkles,
  },
  {
    value: 'recommend',
    title: '自分に合う課題を提案してほしい',
    body: '目的を見ながら、無理なく始められる一つを選ぶ',
    Icon: CircleHelp,
  },
] as const;

const interests = [
  { value: 'writing', label: '文章・メール' },
  { value: 'research', label: '検索・調査' },
  { value: 'spreadsheets', label: '表計算・データ' },
  { value: 'slides', label: '資料・スライド' },
  { value: 'images', label: '画像・デザイン' },
  { value: 'web', label: 'Webサイト' },
  { value: 'automation', label: '自動化・仕組み化' },
] as const;

const outcomeExamples = [
  'メール返信を早くしたい',
  '会議の資料を作りたい',
  '自分のWebページを作りたい',
  'まだ決めていない',
] as const;

const stepLabels = ['お名前', '目的', '始め方', '興味', '確認'] as const;

type MembershipResponse = {
  code?: string;
  error?: string;
  next?: string;
};

export function MemberOnboardingForm({
  authMethod,
  defaultName,
  email,
  initialFirstOutcome = '',
  initialInterestKeys = [],
  initialLearningGoal = '',
  initialStartMode = '',
  isConsentUpdate = false,
  isProfileEdit = false,
  needsInitialCredential = true,
  returnTo = '/mypage',
}: {
  authMethod: 'chatgpt' | 'password';
  defaultName: string;
  email: string;
  initialFirstOutcome?: string;
  initialInterestKeys?: string[];
  initialLearningGoal?: LearningGoal | '';
  initialStartMode?: StartMode | '';
  isConsentUpdate?: boolean;
  isProfileEdit?: boolean;
  needsInitialCredential?: boolean;
  returnTo?: string;
}) {
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState(defaultName);
  const [learningGoal, setLearningGoal] = useState<LearningGoal | ''>(
    initialLearningGoal,
  );
  const [startMode, setStartMode] = useState<StartMode | ''>(initialStartMode);
  const [interestKeys, setInterestKeys] =
    useState<string[]>(initialInterestKeys);
  const [firstOutcome, setFirstOutcome] = useState(initialFirstOutcome);
  const [birthDate, setBirthDate] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [needsLogin, setNeedsLogin] = useState(false);
  const [needsExistingLogin, setNeedsExistingLogin] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousStepRef = useRef(step);

  const canContinue =
    (step === 0 && displayName.trim().length > 0) ||
    (step === 1 && learningGoal !== '') ||
    (step === 2 && startMode !== '') ||
    (step === 3 && interestKeys.length > 0 && firstOutcome.trim().length > 0) ||
    (step === 4 &&
      (isProfileEdit ||
        (termsAccepted &&
          privacyAccepted &&
          (!needsInitialCredential || birthDate.length === 10))));

  useEffect(() => {
    if (previousStepRef.current === step) return;
    previousStepRef.current = step;
    const frame = window.requestAnimationFrame(() => {
      const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      formRef.current?.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
      headingRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [step]);

  function toggleInterest(value: string) {
    setInterestKeys((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  function goForward() {
    if (!canContinue || step >= stepLabels.length - 1) return;
    setStatus('idle');
    setMessage('');
    setNeedsLogin(false);
    setNeedsExistingLogin(false);
    setStep((current) => current + 1);
  }

  function goBack() {
    if (step === 0 || status === 'sending') return;
    setStatus('idle');
    setMessage('');
    setNeedsLogin(false);
    setNeedsExistingLogin(false);
    setStep((current) => current - 1);
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step !== stepLabels.length - 1 || !canContinue) return;
    setStatus('sending');
    setMessage('');
    setNeedsLogin(false);
    setNeedsExistingLogin(false);

    try {
      const response = await fetch(withSiteBasePath('/api/membership'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim(),
          learningGoal,
          startMode,
          interestKeys,
          firstOutcome: firstOutcome.trim(),
          ...(needsInitialCredential ? { birthDate } : {}),
          ...(isProfileEdit
            ? { profileOnly: true }
            : { termsAccepted, privacyAccepted }),
          returnTo,
        }),
      });
      const body = (await response.json()) as MembershipResponse;
      if (!response.ok) {
        if (response.status === 401) setNeedsLogin(true);
        if (body.code === 'existing-login') setNeedsExistingLogin(true);
        throw new Error(body.error ?? '登録内容を保存できませんでした。');
      }

      window.location.assign(
        withSiteBasePath(body.next ?? returnTo ?? '/mypage'),
      );
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : '登録内容を保存できませんでした。',
      );
    }
  }

  return (
    <form className="mt-8 scroll-mt-5" onSubmit={handleSubmit} ref={formRef}>
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between text-[11px] font-semibold tracking-[0.08em] text-quiet">
          <span>
            STEP {step + 1} / {stepLabels.length}
          </span>
          <span>{stepLabels[step]}</span>
        </div>
        <progress
          aria-label="登録の進み具合"
          aria-valuetext={`${stepLabels[step]}、${step + 1}/${stepLabels.length}`}
          className="block h-1.5 w-full overflow-hidden rounded-full accent-sapphire"
          max={stepLabels.length}
          value={step + 1}
        />
        <ol className="mt-3 flex justify-between" aria-hidden="true">
          {stepLabels.map((label, index) => (
            <li
              className={`numeric-text grid size-7 place-items-center rounded-full border text-[10px] font-semibold transition ${
                index <= step
                  ? 'border-sapphire bg-sapphire text-white'
                  : 'border-rule bg-white text-quiet'
              }`}
              key={label}
            >
              {index < step ? <Check className="size-3" /> : index + 1}
            </li>
          ))}
        </ol>
        <p className="sr-only" aria-live="polite">
          {stepLabels[step]}のステップ、{step + 1}/{stepLabels.length}
        </p>
      </div>

      <div className="min-h-[380px]">
        {step === 0 ? (
          <section>
            <StepHeading
              eyebrow="YOUR PAGE"
              headingRef={headingRef}
              title="マイページで、何と呼びますか？"
              body="学習記録と申込画面に表示するお名前です。本名でなくてもかまいません。"
            />
            <label
              className="mt-7 grid gap-2 text-sm font-semibold"
              htmlFor="display-name"
            >
              表示するお名前
              <input
                autoComplete="name"
                className="soft-control min-h-14 border border-rule bg-white px-4 text-base font-normal outline-none transition focus:border-sapphire"
                id="display-name"
                maxLength={80}
                minLength={1}
                onChange={(event) => setDisplayName(event.target.value)}
                required
                value={displayName}
              />
            </label>
            <div className="soft-control mt-5 border border-rule bg-paper p-4">
              <p className="text-[11px] font-semibold tracking-[0.1em] text-quiet">
                {authMethod === 'chatgpt'
                  ? 'ChatGPTで確認済み'
                  : 'ログインIDとして登録済み'}
              </p>
              <p className="mt-1 break-all text-sm font-semibold">{email}</p>
              <p className="mt-2 text-xs leading-6 text-quiet">
                {authMethod === 'chatgpt'
                  ? 'このアドレスをログインIDと連絡先に使います。電話番号は取得しません。'
                  : 'このアドレスをログインIDと連絡先に使います。本人確認が必要な場合は、このアドレスからご連絡ください。電話番号は取得しません。'}
              </p>
            </div>
          </section>
        ) : null}

        {step === 1 ? (
          <fieldset>
            <legend className="sr-only">AIで作りたい変化</legend>
            <StepHeading
              eyebrow="YOUR GOAL"
              headingRef={headingRef}
              title="AIで、何を楽にしたい？"
              body="今の気持ちに一番近いものを一つ。あとから変えても大丈夫です。"
            />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {goals.map((option) => (
                <ChoiceCard
                  checked={learningGoal === option.value}
                  key={option.value}
                  name="learning-goal"
                  onSelect={() => setLearningGoal(option.value)}
                  option={option}
                />
              ))}
            </div>
          </fieldset>
        ) : null}

        {step === 2 ? (
          <fieldset>
            <legend className="sr-only">学習を始めたい場所</legend>
            <StepHeading
              eyebrow="START YOUR WAY"
              headingRef={headingRef}
              title="どこから始めたい？"
              body="最初からでも、やりたいことからでも大丈夫です。"
            />
            <div className="mt-6 grid gap-3">
              {startModes.map((option) => (
                <ChoiceCard
                  checked={startMode === option.value}
                  compact
                  key={option.value}
                  name="start-mode"
                  onSelect={() => setStartMode(option.value)}
                  option={option}
                />
              ))}
            </div>
          </fieldset>
        ) : null}

        {step === 3 ? (
          <section>
            <StepHeading
              eyebrow="FIRST EXCITEMENT"
              headingRef={headingRef}
              title="最初に、何をやってみたい？"
              body="気になる分野は、いくつ選んでも大丈夫です。"
            />
            <fieldset className="mt-6">
              <legend className="text-sm font-semibold">
                気になること
                <span className="ml-2 text-[11px] font-normal text-quiet">
                  1つ以上選択
                </span>
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {interests.map((interest) => {
                  const selected = interestKeys.includes(interest.value);
                  return (
                    <button
                      aria-pressed={selected}
                      className={`soft-pill min-h-11 border px-4 text-xs font-semibold transition ${
                        selected
                          ? 'border-sapphire bg-sapphire text-white shadow-sm'
                          : 'border-rule bg-white text-quiet hover:border-sapphire/40 hover:text-ink'
                      }`}
                      key={interest.value}
                      onClick={() => toggleInterest(interest.value)}
                      type="button"
                    >
                      <span className="inline-flex items-center gap-2">
                        {selected ? (
                          <Check className="size-3" aria-hidden="true" />
                        ) : null}
                        {interest.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <label
              className="mt-7 grid gap-2 text-sm font-semibold"
              htmlFor="first-outcome"
            >
              <span>
                最初にやってみたいこと
                <span className="ml-2 text-[11px] font-normal text-quiet">
                  入力必須
                </span>
              </span>
              <textarea
                className="soft-control min-h-24 resize-y border border-rule bg-white px-4 py-3 font-normal leading-6 outline-none transition focus:border-sapphire"
                id="first-outcome"
                maxLength={240}
                onChange={(event) => setFirstOutcome(event.target.value)}
                placeholder="例：お客様へのメール返信を、10分で作れるようにしたい"
                required
                value={firstOutcome}
              />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              {outcomeExamples.map((example) => (
                <button
                  className="soft-pill border border-rule bg-paper px-3 py-2 text-[11px] text-quiet transition hover:border-sapphire/40 hover:text-ink"
                  key={example}
                  onClick={() => setFirstOutcome(example)}
                  type="button"
                >
                  {example}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {step === 4 ? (
          <section>
            <StepHeading
              eyebrow="LAST STEP"
              headingRef={headingRef}
              title={
                isProfileEdit
                  ? '変更内容を保存します'
                  : isConsentUpdate
                    ? '内容を確認して、学びの続きへ'
                    : 'あと一つで、準備完了です'
              }
              body={
                isProfileEdit
                  ? '選び直した目的・始め方・興味をマイページに保存します。規約への同意とログイン情報は変わりません。'
                  : needsInitialCredential
                    ? '誕生日から最初のログイン用パスワードを作ります。その後、自分だけのパスワードへ変更します。'
                    : '登録内容と現行の規約を確認します。今のログイン情報は変わりません。'
              }
            />

            {needsInitialCredential && !isProfileEdit ? (
              <div className="soft-control mt-6 border border-future-mint/50 bg-future-mint-soft/40 p-5">
                <label
                  className="grid gap-2 text-sm font-semibold"
                  htmlFor="birth-date"
                >
                  誕生日
                  <input
                    autoComplete="bday"
                    className="soft-control min-h-14 border border-rule bg-white px-4 font-normal outline-none transition focus:border-sapphire"
                    id="birth-date"
                    max={new Date().toISOString().slice(0, 10)}
                    min="1900-01-01"
                    onChange={(event) => setBirthDate(event.target.value)}
                    required
                    type="date"
                    value={birthDate}
                  />
                </label>
                <div className="mt-4 flex gap-3 text-xs leading-6 text-quiet">
                  <ShieldCheck
                    className="mt-0.5 size-5 shrink-0 text-sapphire"
                    aria-hidden="true"
                  />
                  <p>
                    誕生日は初期パスワード（YYYYMMDD）の作成だけに使い、誕生日そのものは保存しません。初回の変更が終わるまで、初期パスワードを他の人に見せないでください。
                  </p>
                </div>
              </div>
            ) : null}

            {!isProfileEdit ? (
              <div className="soft-control mt-5 grid gap-4 border border-rule bg-paper-white p-5 text-sm leading-6">
                <label className="flex items-start gap-3">
                  <input
                    checked={termsAccepted}
                    className="mt-1 size-4 accent-sapphire"
                    onChange={(event) => setTermsAccepted(event.target.checked)}
                    required
                    type="checkbox"
                  />
                  <span>
                    <Link
                      className="font-semibold text-sapphire underline underline-offset-4"
                      href="/terms"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      無料会員利用規約（新しいタブ）
                    </Link>
                    に同意します。
                  </span>
                </label>
                <label className="flex items-start gap-3">
                  <input
                    checked={privacyAccepted}
                    className="mt-1 size-4 accent-sapphire"
                    onChange={(event) =>
                      setPrivacyAccepted(event.target.checked)
                    }
                    required
                    type="checkbox"
                  />
                  <span>
                    <Link
                      className="font-semibold text-sapphire underline underline-offset-4"
                      href="/privacy"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      プライバシーポリシー（新しいタブ）
                    </Link>
                    を確認し、個人情報の利用目的に同意します。
                  </span>
                </label>
              </div>
            ) : null}

            {!isProfileEdit ? (
              <p className="mt-5 text-xs leading-6 text-quiet">
                無料会員登録だけで料金は発生しません。
                {sharedFees.entranceCampaign}は入会金{sharedFees.entrance}（
                {sharedFees.entranceRegular}
                ）。有料受講は希望する場合に別途申し込みます。
              </p>
            ) : null}
          </section>
        ) : null}
      </div>

      {status === 'error' ? (
        <div className="soft-control mt-5 border-l-4 border-human-coral bg-human-coral-soft p-4 text-sm leading-6 text-brand-dark">
          <p role="alert">{message}</p>
          {needsLogin ? (
            <Link
              className="mt-3 inline-flex min-h-11 items-center font-semibold text-sapphire underline underline-offset-4"
              href={`/login?return_to=${encodeURIComponent(
                `/mypage/onboarding?return_to=${encodeURIComponent(returnTo)}${
                  isProfileEdit ? '&mode=edit' : ''
                }`,
              )}`}
            >
              ログインしてこの続きへ戻る
            </Link>
          ) : null}
          {needsExistingLogin ? (
            <Link
              className="mt-3 inline-flex min-h-11 items-center font-semibold text-sapphire underline underline-offset-4"
              href={`/login?return_to=${encodeURIComponent(returnTo)}`}
            >
              登録済みのID・パスワードでログイン
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="mt-8 flex items-center gap-3 border-t border-rule pt-6">
        {step > 0 ? (
          <button
            className="soft-outline-button flex min-h-12 items-center justify-center gap-2 border border-rule bg-white px-5 text-xs font-semibold text-ink disabled:opacity-50"
            disabled={status === 'sending'}
            onClick={goBack}
            type="button"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            戻る
          </button>
        ) : null}

        {step < stepLabels.length - 1 ? (
          <button
            className="button-glow ml-auto flex min-h-12 items-center justify-center gap-2 px-6 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
            disabled={!canContinue}
            onClick={goForward}
            type="button"
          >
            次へ
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        ) : (
          <button
            className="button-glow ml-auto flex min-h-12 items-center justify-center gap-2 px-6 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
            disabled={!canContinue || status === 'sending'}
            type="submit"
          >
            {status === 'sending' ? (
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Sparkles className="size-4" aria-hidden="true" />
            )}
            {status === 'sending'
              ? '準備しています…'
              : isProfileEdit
                ? '学び方メモを保存する'
                : isConsentUpdate
                  ? '内容を更新する'
                  : '無料会員登録を完了する'}
          </button>
        )}
      </div>
    </form>
  );
}

function StepHeading({
  body,
  eyebrow,
  headingRef,
  title,
}: {
  body: string;
  eyebrow: string;
  headingRef?: Ref<HTMLHeadingElement>;
  title: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.14em] text-sapphire">
        {eyebrow}
      </p>
      <h2
        className="mt-3 font-mincho text-2xl leading-tight outline-none sm:text-3xl"
        ref={headingRef}
        tabIndex={-1}
      >
        {title}
      </h2>
      <p className="mt-3 text-sm leading-7 text-quiet">{body}</p>
    </div>
  );
}

function ChoiceCard<T extends string>({
  checked,
  compact = false,
  name,
  onSelect,
  option,
}: {
  checked: boolean;
  compact?: boolean;
  name: string;
  onSelect: () => void;
  option: Option<T>;
}) {
  const { Icon } = option;
  return (
    <label
      className={`soft-control soft-interactive relative flex cursor-pointer items-start gap-4 border p-4 transition focus-within:border-sapphire focus-within:ring-4 focus-within:ring-sapphire/20 ${
        checked
          ? 'border-sapphire bg-sapphire-soft/70 shadow-sm'
          : 'border-rule bg-white hover:border-sapphire/35'
      } ${compact ? 'sm:items-center' : ''}`}
    >
      <input
        checked={checked}
        className="sr-only"
        name={name}
        onChange={onSelect}
        required
        type="radio"
        value={option.value}
      />
      <span
        className={`soft-icon grid size-10 shrink-0 place-items-center ${
          checked ? 'bg-sapphire text-white' : 'bg-paper text-sapphire'
        }`}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-6">
          {option.title}
        </span>
        <span className="mt-1 block text-xs leading-5 text-quiet">
          {option.body}
        </span>
      </span>
      <span
        className={`mt-1 grid size-5 shrink-0 place-items-center rounded-full border ${
          checked
            ? 'border-sapphire bg-sapphire text-white'
            : 'border-rule bg-white'
        }`}
      >
        {checked ? <Check className="size-3" aria-hidden="true" /> : null}
      </span>
    </label>
  );
}
