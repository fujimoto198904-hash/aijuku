'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, Copy, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { withSiteBasePath } from '@/lib/site-paths';

export function RecoveryCodeCard({
  username,
  code,
  next,
  reset = false,
}: {
  username: string;
  code: string;
  next: string;
  reset?: boolean;
}) {
  const [copied, setCopied] = useState(false),
    [error, setError] = useState('');
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titleRef.current?.focus();
  }, []);
  async function copy() {
    try {
      await navigator.clipboard.writeText(
        `AIstock\nユーザー名：${username}\n復旧コード：${code}`,
      );
      setCopied(true);
      setError('');
    } catch {
      setError('コピーできませんでした。下のコードを選択して控えてください。');
    }
  }
  return (
    <section className="grid gap-5" aria-labelledby="recovery-title">
      <KeyRound size={28} className="text-sapphire" aria-hidden="true" />
      <h2
        ref={titleRef}
        tabIndex={-1}
        id="recovery-title"
        className="text-2xl font-bold focus:outline-none"
      >
        {reset ? 'パスワードを変更しました' : '復旧コードを発行しました'}
      </h2>
      <p className="text-sm leading-7">
        パスワードを忘れたときに使います。必要ならコピーして保管してください。
      </p>
      <div className="rounded-2xl border border-rule bg-paper p-5">
        <p className="text-xs text-quiet">ユーザー名</p>
        <p className="mt-1 break-all font-semibold">{username}</p>
        <label
          htmlFor="account-recovery-code"
          className="mt-4 block text-xs text-quiet"
        >
          復旧コード
        </label>
        <textarea
          id="account-recovery-code"
          readOnly
          value={code}
          rows={2}
          spellCheck={false}
          autoComplete="off"
          className="mt-2 w-full resize-none break-all rounded-lg bg-white p-3 font-mono text-sm leading-6"
          onFocus={(e) => e.currentTarget.select()}
        />
        <Button
          type="button"
          variant="outline"
          onClick={copy}
          className="mt-3 min-h-11 w-full"
        >
          {copied ? (
            <Check size={16} aria-hidden="true" />
          ) : (
            <Copy size={16} aria-hidden="true" />
          )}
          {copied ? 'コピーしました' : 'ユーザー名とコードをコピー'}
        </Button>
      </div>
      <p className="text-xs leading-6 text-quiet">
        コードは再表示できません。他人には渡さず、パスワード管理アプリなどに保管してください。
        以前に発行したコードがある場合、それは使えなくなります。
        パスワードとコードの両方をなくすと、復旧できません。
      </p>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <Button
        type="button"
        onClick={() => window.location.assign(withSiteBasePath(next))}
        className="min-h-12 bg-sapphire text-white"
      >
        {reset ? '新しいパスワードでログイン' : 'マイページに戻る'}
      </Button>
    </section>
  );
}
