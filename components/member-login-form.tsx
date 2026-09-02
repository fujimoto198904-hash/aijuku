'use client';

import { Eye, EyeOff, LoaderCircle, LogIn, ShieldCheck } from 'lucide-react';
import { type SubmitEvent, useState } from 'react';

import Link from '@/components/site-link';
import { withSiteBasePath } from '@/lib/site-paths';

type LoginResponse = {
  error?: string;
  next?: string;
  verificationRequired?: boolean;
  requiresChatGPTVerification?: boolean;
  retryAfterSeconds?: number;
};

export function MemberLoginForm({
  initialLoginId = '',
  returnTo = '/mypage',
  verificationPath,
  verifiedInitialIdentity = false,
}: {
  initialLoginId?: string;
  returnTo?: string;
  verificationPath: string;
  verifiedInitialIdentity?: boolean;
}) {
  const [loginId, setLoginId] = useState(initialLoginId);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [verificationRequired, setVerificationRequired] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setMessage('');
    setVerificationRequired(false);

    try {
      const response = await fetch(withSiteBasePath('/api/auth/login'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ loginId, password, returnTo }),
      });
      const body = (await response.json()) as LoginResponse;
      if (!response.ok) {
        if (body.verificationRequired || body.requiresChatGPTVerification) {
          setVerificationRequired(true);
        }
        const retryMessage = body.retryAfterSeconds
          ? ` ${Math.ceil(body.retryAfterSeconds / 60)}分ほど待ってからお試しください。`
          : '';
        throw new Error(
          `${body.error ?? 'ログインできませんでした。'}${retryMessage}`,
        );
      }

      window.location.assign(
        withSiteBasePath(body.next ?? returnTo ?? '/mypage'),
      );
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'ログインできませんでした。時間をおいてお試しください。',
      );
    }
  }

  return (
    <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-semibold" htmlFor="login-id">
        メールアドレス／ログインID
        <input
          autoCapitalize="none"
          autoComplete="username"
          className="soft-control min-h-14 border border-rule bg-white px-4 font-normal outline-none transition focus:border-sapphire"
          id="login-id"
          maxLength={320}
          name="username"
          onChange={(event) => {
            setLoginId(event.target.value);
            setStatus('idle');
            setVerificationRequired(false);
          }}
          placeholder="name@example.com"
          readOnly={verifiedInitialIdentity}
          required
          spellCheck={false}
          value={loginId}
        />
      </label>

      {verifiedInitialIdentity ? (
        <output className="soft-control block border border-future-mint bg-future-mint-soft p-4 text-xs leading-6 text-brand-dark">
          <span className="block font-semibold">
            ChatGPTで初回の本人確認が完了しました
          </span>
          <span className="mt-1 block text-quiet">
            確認済みのログインIDと、誕生日の8桁（YYYYMMDD）を入力してください。
          </span>
        </output>
      ) : null}

      <label className="grid gap-2 text-sm font-semibold" htmlFor="password">
        パスワード
        <span className="soft-control flex min-h-14 items-center border border-rule bg-white transition focus-within:border-sapphire">
          <input
            autoComplete="current-password"
            className="min-w-0 flex-1 bg-transparent px-4 font-normal outline-none"
            id="password"
            maxLength={128}
            name="password"
            onChange={(event) => {
              setPassword(event.target.value);
              setStatus('idle');
            }}
            required
            type={showPassword ? 'text' : 'password'}
            value={password}
          />
          <button
            aria-label={
              showPassword ? 'パスワードを隠す' : 'パスワードを表示する'
            }
            className="mr-2 grid size-10 place-items-center rounded-full text-quiet transition hover:bg-paper hover:text-ink"
            onClick={() => setShowPassword((current) => !current)}
            type="button"
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </span>
      </label>

      <div className="soft-control flex gap-3 border border-future-mint/45 bg-future-mint-soft/45 p-4">
        <ShieldCheck
          className="mt-0.5 size-5 shrink-0 text-sapphire"
          aria-hidden="true"
        />
        <p className="text-xs leading-6 text-quiet">
          初期パスワードは、登録した誕生日の8桁（YYYYMMDD）で、発行から72時間有効です。初回はChatGPTでメールアドレスを確認し、ログイン後すぐ自分だけのパスワードへ変更します。
        </p>
      </div>

      {status === 'error' ? (
        <div className="soft-control border-l-4 border-human-coral bg-human-coral-soft p-4 text-sm leading-6 text-brand-dark">
          <p role="alert">{message}</p>
          {verificationRequired ? (
            <Link
              className="button-glow mt-4 flex min-h-12 items-center justify-between px-5 text-xs font-semibold text-white"
              href={verificationPath}
              target="_top"
            >
              初回だけChatGPTで本人確認する
              <LogIn className="size-4" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      ) : null}

      <button
        className="button-glow flex min-h-14 items-center justify-center gap-2 px-6 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
        disabled={status === 'sending'}
        type="submit"
      >
        {status === 'sending' ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <LogIn className="size-4" aria-hidden="true" />
        )}
        {status === 'sending' ? '確認しています…' : 'マイページへログイン'}
      </button>

      <div className="border-t border-rule pt-5 text-center text-xs leading-6 text-quiet">
        <p>
          パスワードを忘れた方、初期パスワードの72時間が過ぎた方は、
          <Link
            className="font-semibold text-sapphire underline underline-offset-4"
            href="mailto:info@mon-ai.jp"
          >
            info@mon-ai.jp
          </Link>
          へ登録アドレスからご連絡ください。
        </p>
        <p className="mt-3">
          まだ無料会員ではない方は、
          <Link
            className="font-semibold text-sapphire underline underline-offset-4"
            href="/join"
          >
            ChatGPTで本人確認から始める
          </Link>
        </p>
      </div>
    </form>
  );
}
