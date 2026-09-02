'use client';

import { type SubmitEvent, useState } from 'react';

import Link from '@/components/site-link';
import { sharedFees } from '@/lib/member-service-plans';
import { withSiteBasePath } from '@/lib/site-paths';

export function MembershipOnboardingForm({
  defaultName,
  email,
  isConsentUpdate = false,
}: {
  defaultName: string;
  email: string;
  isConsentUpdate?: boolean;
}) {
  const [displayName, setDisplayName] = useState(defaultName);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setMessage('');

    try {
      const response = await fetch(withSiteBasePath('/api/membership'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          displayName,
          termsAccepted,
          privacyAccepted,
        }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? '登録できませんでした。');

      window.location.assign(withSiteBasePath('/mypage'));
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : '登録できませんでした。時間をおいて再度お試しください。',
      );
    }
  }

  return (
    <form className="mt-9 grid gap-6" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-semibold">
        マイページに表示するお名前
        <input
          className="min-h-12 border border-rule bg-white px-4 font-normal outline-none transition-colors focus:border-sapphire"
          maxLength={80}
          minLength={1}
          name="displayName"
          onChange={(event) => setDisplayName(event.target.value)}
          required
          value={displayName}
        />
      </label>

      <div className="border-y border-rule py-5 text-sm">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-quiet">
          登録メールアドレス
        </p>
        <p className="mt-2 break-all font-semibold">{email}</p>
        <p className="mt-2 text-xs leading-6 text-quiet">
          ChatGPTで確認済みのメールアドレスを連絡先として使います。電話番号は取得しません。
        </p>
      </div>

      <div className="soft-control grid gap-4 border border-rule bg-paper-white p-5 text-sm leading-6">
        <label className="flex items-start gap-3">
          <input
            className="mt-1 size-4 accent-sapphire"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            required
            type="checkbox"
          />
          <span>
            <Link
              className="font-semibold text-sapphire underline"
              href="/terms"
              rel="noopener noreferrer"
              target="_blank"
            >
              無料会員利用規約
            </Link>
            に同意します。
          </span>
        </label>
        <label className="flex items-start gap-3">
          <input
            className="mt-1 size-4 accent-sapphire"
            checked={privacyAccepted}
            onChange={(event) => setPrivacyAccepted(event.target.checked)}
            required
            type="checkbox"
          />
          <span>
            <Link
              className="font-semibold text-sapphire underline"
              href="/privacy"
              rel="noopener noreferrer"
              target="_blank"
            >
              プライバシーポリシー
            </Link>
            を確認し、個人情報の利用目的に同意します。
          </span>
        </label>
      </div>

      {status === 'error' ? (
        <p
          className="soft-control border-l-4 border-human-coral bg-human-coral-soft p-4 text-sm text-brand-dark"
          role="alert"
        >
          {message}
        </p>
      ) : null}

      <button
        className="button-glow min-h-14 px-6 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
        disabled={status === 'sending'}
        type="submit"
      >
        {status === 'sending'
          ? '保存しています…'
          : isConsentUpdate
            ? '同意内容を更新する'
            : '無料会員登録を完了する'}
      </button>

      <p className="text-center text-xs leading-6 text-quiet">
        {isConsentUpdate
          ? '更新だけで料金は発生しません。公開設定や学習記録の内容は引き継がれます。'
          : `登録は無料です。${sharedFees.entranceCampaign}は入会金${sharedFees.entrance}（${sharedFees.entranceRegular}）。受講料は申込前に案内します。`}
      </p>
    </form>
  );
}
