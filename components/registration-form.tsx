'use client';
import { useState, type SubmitEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from '@/components/site-link';
import { withSiteBasePath } from '@/lib/site-paths';
export function RegistrationForm({
  ticket,
  email,
  returnTo = '/mypage',
}: {
  ticket?: string;
  email?: string;
  returnTo?: string;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const data = new FormData(event.currentTarget);
    if (ticket && data.get('password') !== data.get('confirm')) {
      setError('パスワードが一致しません。');
      setBusy(false);
      return;
    }
    try {
      const response = await fetch(withSiteBasePath('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          ticket
            ? {
                action: 'complete',
                token: ticket,
                nickname: data.get('nickname'),
                password: data.get('password'),
                terms: data.get('terms') === 'on',
                returnTo,
              }
            : { action: 'email', email: data.get('email'), returnTo },
        ),
      });
      const result = (await response.json()) as {
        error?: string;
        next?: string;
        message?: string;
      };
      if (!response.ok)
        throw new Error(result.error ?? '登録できませんでした。');
      if (result.next) window.location.assign(withSiteBasePath(result.next));
      else setMessage(result.message ?? '確認メールを送信しました。');
    } catch (e) {
      setError(e instanceof Error ? e.message : '登録できませんでした。');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="grid gap-5">
      {ticket ? (
        <>
          <p className="break-all text-sm text-quiet">
            確認済みのメール：{email}
          </p>
          <label
            htmlFor="register-nickname"
            className="grid gap-2 font-semibold"
          >
            ニックネーム
            <Input
              id="register-nickname"
              name="nickname"
              maxLength={30}
              required
              autoComplete="nickname"
            />
            <span className="text-sm font-normal text-quiet">
              本名でなくて大丈夫。投稿時に公開名を確認できます。
            </span>
          </label>
          <label
            htmlFor="register-password"
            className="grid gap-2 font-semibold"
          >
            パスワード
            <Input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
            />
            <span className="text-sm font-normal text-quiet">
              8文字以上。誕生日以外の、自分専用のものを。
            </span>
          </label>
          <label
            htmlFor="register-confirm"
            className="grid gap-2 font-semibold"
          >
            パスワードをもう一度
            <Input
              id="register-confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
            />
          </label>
          <label className="flex items-start gap-3 text-sm leading-6">
            <input name="terms" type="checkbox" required className="mt-1.5" />
            <span>
              <Link href="/terms" target="_blank" className="underline">
                利用規約
              </Link>
              と
              <Link href="/privacy" target="_blank" className="underline">
                プライバシーポリシー
              </Link>
              に同意します。
            </span>
          </label>
        </>
      ) : (
        <label htmlFor="register-email" className="grid gap-2 font-semibold">
          メールアドレス
          <Input
            id="register-email"
            name="email"
            type="email"
            maxLength={320}
            autoComplete="email"
            required
          />
        </label>
      )}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {message && (
        <output className="leading-7 text-sapphire">{message}</output>
      )}
      <Button
        disabled={busy}
        type="submit"
        className="min-h-12 bg-sapphire text-white"
      >
        {busy
          ? '処理しています…'
          : ticket
            ? '無料会員登録を完了する'
            : '確認メールを送る'}
      </Button>
    </form>
  );
}
