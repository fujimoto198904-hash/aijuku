'use client';
import { useState, type SubmitEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AuthPasswordInput } from '@/components/auth-password-input';
import { RecoveryCodeCard } from '@/components/recovery-code-card';
import { withSiteBasePath } from '@/lib/site-paths';

export function AccountRecoveryForm({
  returnTo,
  manage = false,
}: {
  returnTo: string;
  manage?: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const [result, setResult] = useState<{
    username: string;
    recoveryCode: string;
  } | null>(null);
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const form = event.currentTarget,
      data = new FormData(form);
    try {
      const response = await fetch(withSiteBasePath('/api/auth/recover'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: manage ? 'rotate' : 'reset',
          username: data.get('username'),
          code: data.get('code'),
          password: data.get('password'),
        }),
      });
      const body = (await response.json()) as {
        username?: string;
        recoveryCode?: string;
        error?: string;
      };
      if (!response.ok || !body.username || !body.recoveryCode)
        throw new Error(body.error ?? '再設定できませんでした。');
      form.reset();
      setResult({ username: body.username, recoveryCode: body.recoveryCode });
    } catch (e) {
      setError(e instanceof Error ? e.message : '再設定できませんでした。');
    } finally {
      setBusy(false);
    }
  }
  if (result)
    return (
      <RecoveryCodeCard
        username={result.username}
        code={result.recoveryCode}
        reset={!manage}
        next={
          manage
            ? '/mypage#account'
            : '/login?return_to=' + encodeURIComponent(returnTo)
        }
      />
    );
  return (
    <form onSubmit={submit} className="mt-7 grid gap-5">
      {!manage && (
        <>
          <label
            htmlFor="recover-username"
            className="grid gap-2 text-sm font-semibold"
          >
            ユーザー名
            <Input
              id="recover-username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              minLength={3}
              maxLength={24}
              className="min-h-12"
            />
          </label>
          <label
            htmlFor="recover-code"
            className="grid gap-2 text-sm font-semibold"
          >
            復旧コード
            <Input
              id="recover-code"
              name="code"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              required
              maxLength={100}
              className="min-h-12 font-mono"
            />
            <span className="text-xs font-normal text-quiet">
              事前に控えたコードを貼り付けてください。
            </span>
          </label>
        </>
      )}
      <AuthPasswordInput
        id="recover-password"
        label={manage ? '現在のパスワード' : '新しいパスワード'}
        current={manage}
      />
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
        {busy
          ? '確認しています…'
          : manage
            ? '復旧コードを発行する'
            : 'パスワードを再設定する'}
      </Button>
    </form>
  );
}
