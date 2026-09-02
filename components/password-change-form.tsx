'use client';

import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
} from 'lucide-react';
import { type SubmitEvent, useMemo, useState } from 'react';

import Link from '@/components/site-link';
import { withSiteBasePath } from '@/lib/site-paths';

type ChangePasswordResponse = {
  error?: string;
  next?: string;
  retryAfterSeconds?: number;
};

export function PasswordChangeForm({
  loginId,
  loginPath,
  returnTo = '/mypage/onboarding',
  isInitialChange = true,
}: {
  loginId: string;
  loginPath: string;
  returnTo?: string;
  isInitialChange?: boolean;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [needsLogin, setNeedsLogin] = useState(false);

  const checks = useMemo(
    () => [
      { label: '10文字以上', passed: newPassword.length >= 10 },
      {
        label: '誕生日の8桁とは異なる',
        passed: newPassword.length > 0 && !/^\d{8}$/.test(newPassword),
      },
      {
        label: 'ログインIDとは異なる',
        passed:
          newPassword.length > 0 &&
          newPassword.normalize('NFKC').toLowerCase() !==
            loginId.trim().normalize('NFKC').toLowerCase(),
      },
      {
        label: '確認用の入力と一致',
        passed: confirmPassword.length > 0 && newPassword === confirmPassword,
      },
    ],
    [confirmPassword, loginId, newPassword],
  );
  const canSubmit = checks.every((item) => item.passed);

  function resetError() {
    if (status === 'error') setStatus('idle');
    setNeedsLogin(false);
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setMessage('');
    setNeedsLogin(false);

    try {
      const response = await fetch(
        withSiteBasePath('/api/auth/change-password'),
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
            returnTo,
          }),
        },
      );
      const body = (await response.json()) as ChangePasswordResponse;
      if (!response.ok) {
        if (response.status === 401) setNeedsLogin(true);
        const retryMessage = body.retryAfterSeconds
          ? ` ${Math.ceil(body.retryAfterSeconds / 60)}分ほど待ってからお試しください。`
          : '';
        throw new Error(
          `${body.error ?? 'パスワードを変更できませんでした。'}${retryMessage}`,
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
          : 'パスワードを変更できませんでした。',
      );
    }
  }

  return (
    <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
      <PasswordField
        autoComplete="current-password"
        label={isInitialChange ? '現在の初期パスワード' : '現在のパスワード'}
        name="current-password"
        onChange={(value) => {
          setCurrentPassword(value);
          resetError();
        }}
        show={showPassword}
        value={currentPassword}
      />

      <PasswordField
        autoComplete="new-password"
        label="新しいパスワード"
        name="new-password"
        onChange={(value) => {
          setNewPassword(value);
          resetError();
        }}
        show={showPassword}
        value={newPassword}
      />

      <PasswordField
        autoComplete="new-password"
        label="新しいパスワード（確認）"
        name="confirm-password"
        onChange={(value) => {
          setConfirmPassword(value);
          resetError();
        }}
        show={showPassword}
        value={confirmPassword}
      />

      <button
        className="flex w-fit items-center gap-2 text-xs font-semibold text-sapphire"
        onClick={() => setShowPassword((current) => !current)}
        type="button"
      >
        {showPassword ? (
          <EyeOff className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
        )}
        {showPassword ? '入力を隠す' : '入力を表示して確認'}
      </button>

      <ul className="soft-control grid gap-2 border border-rule bg-paper p-4 text-xs">
        {checks.map((item) => (
          <li
            className={`flex items-center gap-2 ${
              item.passed ? 'text-sapphire' : 'text-quiet'
            }`}
            key={item.label}
          >
            <span
              className={`grid size-5 place-items-center rounded-full border ${
                item.passed
                  ? 'border-future-mint bg-future-mint-soft'
                  : 'border-rule bg-white'
              }`}
            >
              {item.passed ? (
                <Check className="size-3" aria-hidden="true" />
              ) : null}
            </span>
            {item.label}
          </li>
        ))}
      </ul>

      {status === 'error' ? (
        <div className="soft-control border-l-4 border-human-coral bg-human-coral-soft p-4 text-sm leading-6 text-brand-dark">
          <p role="alert">{message}</p>
          {needsLogin ? (
            <Link
              className="mt-3 inline-flex min-h-11 items-center font-semibold text-sapphire underline underline-offset-4"
              href={loginPath}
            >
              ログインしてパスワード変更へ戻る
            </Link>
          ) : null}
        </div>
      ) : null}

      <button
        className="button-glow flex min-h-14 items-center justify-center gap-2 px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        disabled={status === 'sending' || !canSubmit}
        type="submit"
      >
        {status === 'sending' ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <KeyRound className="size-4" aria-hidden="true" />
        )}
        {status === 'sending'
          ? '安全に保存しています…'
          : 'このパスワードに変更する'}
      </button>

      <div className="soft-control flex gap-3 border border-future-mint/45 bg-future-mint-soft/45 p-4">
        <ShieldCheck
          className="mt-0.5 size-5 shrink-0 text-sapphire"
          aria-hidden="true"
        />
        <p className="text-xs leading-6 text-quiet">
          新しいパスワードはそのまま保存されません。忘れた場合は、登録メールアドレスから
          <Link
            className="mx-1 font-semibold text-sapphire underline underline-offset-4"
            href="mailto:info@mon-ai.jp"
          >
            info@mon-ai.jp
          </Link>
          へご連絡ください。電話受付は行いません。
        </p>
      </div>
    </form>
  );
}

function PasswordField({
  autoComplete,
  label,
  name,
  onChange,
  show,
  value,
}: {
  autoComplete: 'current-password' | 'new-password';
  label: string;
  name: string;
  onChange: (value: string) => void;
  show: boolean;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold" htmlFor={name}>
      {label}
      <input
        autoComplete={autoComplete}
        className="soft-control min-h-14 border border-rule bg-white px-4 font-normal outline-none transition focus:border-sapphire"
        id={name}
        maxLength={128}
        minLength={1}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        required
        type={show ? 'text' : 'password'}
        value={value}
      />
    </label>
  );
}
