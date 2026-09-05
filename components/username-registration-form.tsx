'use client';
import { useState, type SubmitEvent } from 'react';
import Link from '@/components/site-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthPasswordInput } from '@/components/auth-password-input';
import { withSiteBasePath } from '@/lib/site-paths';

export function UsernameRegistrationForm({ returnTo }: { returnTo: string }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const form = event.currentTarget,
      values = new FormData(form);
    try {
      const response = await fetch(withSiteBasePath('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'username',
          username: values.get('username'),
          password: values.get('password'),
          terms: values.get('terms') === 'on',
          returnTo,
        }),
      });
      const body = (await response.json()) as {
        next?: string;
        error?: string;
      };
      if (!response.ok || !body.next)
        throw new Error(body.error ?? '登録できませんでした。');
      form.reset();
      window.location.assign(withSiteBasePath(body.next));
    } catch (e) {
      setError(e instanceof Error ? e.message : '登録できませんでした。');
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="grid gap-5">
      <h2 className="mb-1 text-2xl font-bold">まずは、この2つだけ。</h2>
      <div className="grid gap-2">
        <label htmlFor="signup-username" className="text-sm font-semibold">
          ユーザー名
        </label>
        <Input
          id="signup-username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          minLength={3}
          maxLength={24}
          pattern="[a-zA-Z0-9][a-zA-Z0-9_\-]{2,23}"
          placeholder="例：ai_sora"
          aria-describedby="signup-username-hint"
          className="min-h-12"
        />
        <p id="signup-username-hint" className="text-xs leading-6 text-quiet">
          半角英数字・_・-で3〜24文字。ログインに使います。
        </p>
      </div>
      <AuthPasswordInput id="signup-password" />
      <label className="flex items-start gap-3 text-sm leading-6">
        <input
          name="terms"
          type="checkbox"
          required
          className="mt-1 size-4 shrink-0"
        />
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
      {error && (
        <p role="alert" className="text-sm leading-6 text-red-700">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={busy}
        className="min-h-12 bg-sapphire text-white"
      >
        {busy ? '登録しています…' : '無料で登録する'}
      </Button>
      <p className="text-center text-xs leading-6 text-quiet">
        メール・本名は不要。公開する名前は、あとから設定できます。
      </p>
    </form>
  );
}
