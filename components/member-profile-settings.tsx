'use client';

import { KeyRound, Save, SlidersHorizontal, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type SubmitEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from '@/components/site-link';
import { withSiteBasePath } from '@/lib/site-paths';

export function MemberProfileSettings({
  displayName,
  email,
  readOnly = false,
}: {
  displayName: string;
  email: string;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(displayName);
  const [status, setStatus] = useState<
    'idle' | 'sending' | 'success' | 'error'
  >('idle');
  const [message, setMessage] = useState('');

  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnly) return;
    setStatus('sending');
    setMessage('');
    try {
      const response = await fetch(withSiteBasePath('/api/membership'), {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ displayName: name }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? '表示名を保存できませんでした。');
      }
      setStatus('success');
      setMessage('表示名を保存しました。');
      router.refresh();
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : '表示名を保存できませんでした。',
      );
    }
  }

  return (
    <section
      id="account"
      className="mt-16 scroll-mt-24 border-t-2 border-brand-dark pt-8"
    >
      <p className="text-xs font-semibold tracking-[0.14em] text-sapphire">
        ACCOUNT
      </p>
      <h2 className="mt-3 font-mincho text-3xl">会員情報</h2>
      <form
        className="soft-panel mt-7 grid gap-5 border border-rule bg-paper-white p-6 sm:p-8"
        onSubmit={save}
      >
        <div className="flex items-center gap-3">
          <UserRound className="size-5 text-sapphire" aria-hidden="true" />
          <p className="text-sm font-semibold">
            {readOnly ? 'デモの会員情報（閲覧専用）' : '表示名を変更できます'}
          </p>
        </div>
        <label
          className="grid gap-2 text-sm font-semibold"
          htmlFor="member-display-name"
        >
          表示名
          <Input
            className="min-h-12 bg-white px-4 font-normal"
            disabled={readOnly}
            id="member-display-name"
            maxLength={80}
            minLength={1}
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
        </label>
        <div className="border-y border-rule py-4 text-xs leading-6 text-quiet">
          <p className="break-all">登録メール：{email}</p>
          <p className="mt-2">
            共有ページには、この表示名が出ます。見せたい名前に直してから共有してください。
          </p>
        </div>
        {!readOnly ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              className="soft-control inline-flex min-h-12 items-center justify-between border border-rule bg-paper px-4 text-xs font-semibold text-sapphire hover:border-sapphire"
              href="/mypage/onboarding?mode=edit&return_to=%2Fmypage%23account"
            >
              参加情報・利用規約を確認
              <SlidersHorizontal className="size-4" aria-hidden="true" />
            </Link>
            <Link
              className="soft-control inline-flex min-h-12 items-center justify-between border border-rule bg-paper px-4 text-xs font-semibold text-sapphire hover:border-sapphire"
              href="/account/password?mode=manage&return_to=%2Fmypage%23account"
            >
              自分専用パスワードを変更
              <KeyRound className="size-4" aria-hidden="true" />
            </Link>
          </div>
        ) : null}
        {message ? (
          <p
            className={`soft-control border-l-4 p-4 text-sm ${status === 'error' ? 'border-human-coral bg-human-coral-soft' : 'border-future-mint bg-future-mint-soft'}`}
            role={status === 'error' ? 'alert' : 'status'}
          >
            {message}
          </p>
        ) : null}
        <Button
          className="min-h-12 bg-sapphire text-white"
          disabled={readOnly || status === 'sending' || name.trim().length < 1}
          type="submit"
        >
          <Save className="size-4" aria-hidden="true" />
          {readOnly
            ? 'デモでは変更できません'
            : status === 'sending'
              ? '保存しています…'
              : '表示名を保存'}
        </Button>
      </form>
    </section>
  );
}
