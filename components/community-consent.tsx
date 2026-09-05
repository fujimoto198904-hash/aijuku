'use client';
import { useState, type SubmitEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { withSiteBasePath } from '@/lib/site-paths';
import Link from '@/components/site-link';
export function CommunityConsent({
  name,
  returnTo = '/mypage',
}: {
  name: string;
  returnTo?: string;
}) {
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const data = new FormData(e.currentTarget);
    try {
      const response = await fetch(withSiteBasePath('/api/community/consent'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: data.get('nickname'),
          accepted: data.get('accepted') === 'on',
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error);
      window.location.assign(withSiteBasePath(returnTo));
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存できませんでした。');
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="mt-6 grid gap-5">
      <label htmlFor="consent-nickname" className="grid gap-2 font-semibold">
        ニックネーム
        <Input
          id="consent-nickname"
          name="nickname"
          defaultValue={name.includes('@') ? '' : name}
          maxLength={30}
          required
        />
      </label>
      <p className="leading-8 text-quiet">
        AIstockは、教科書で学び、質問や使い方を共有する無料コミュニティです。投稿は誰でも読めます。投稿時には公開用の名前を選べます。
      </p>
      <label className="flex items-start gap-3 text-sm leading-7">
        <input name="accepted" type="checkbox" required className="mt-2" />
        <span>
          <Link href="/terms" target="_blank" className="underline">
            利用規約
          </Link>
          と
          <Link href="/privacy" target="_blank" className="underline">
            プライバシーポリシー
          </Link>
          を確認し、同意します。
        </span>
      </label>
      {error && <p role="alert">{error}</p>}
      <Button disabled={busy} className="min-h-12 bg-sapphire text-white">
        {busy ? '保存しています…' : '同意して続ける'}
      </Button>
    </form>
  );
}
