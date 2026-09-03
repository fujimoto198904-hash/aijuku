'use client';

import { ExternalLink, Settings2 } from 'lucide-react';
import { useState } from 'react';

import { withSiteBasePath } from '@/lib/site-paths';

type BillingPortalResponse = {
  error?: string;
  url?: string;
};

function getBillingPortalDestination(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Stripeの請求管理画面を開けませんでした。');
  }

  const destination = new URL(value);
  if (
    destination.origin !== 'https://billing.stripe.com' ||
    destination.username ||
    destination.password
  ) {
    throw new Error('安全なStripe接続先を確認できませんでした。');
  }
  return destination.toString();
}

export function BillingPortalButton() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [message, setMessage] = useState('');

  async function openBillingPortal() {
    setIsConnecting(true);
    setMessage('');

    try {
      const response = await fetch(withSiteBasePath('/api/billing/portal'), {
        method: 'POST',
        cache: 'no-store',
        credentials: 'same-origin',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const body = (await response
        .json()
        .catch(() => ({}))) as BillingPortalResponse;
      if (!response.ok) {
        throw new Error(
          body.error ?? 'Stripeの請求管理画面を開けませんでした。',
        );
      }

      window.location.assign(getBillingPortalDestination(body.url));
    } catch (error) {
      setIsConnecting(false);
      setMessage(
        error instanceof Error
          ? error.message
          : 'Stripeへ接続できませんでした。時間をおいて再度お試しください。',
      );
    }
  }

  return (
    <div className="mt-5">
      <button
        className="soft-control inline-flex min-h-11 items-center gap-2 border border-sapphire px-4 text-xs font-semibold text-sapphire disabled:cursor-wait disabled:opacity-60"
        disabled={isConnecting}
        onClick={() => void openBillingPortal()}
        type="button"
      >
        <Settings2 className="size-4" aria-hidden="true" />
        {isConnecting
          ? '接続しています…'
          : 'Stripeの支払い・契約管理画面を開く'}
        {!isConnecting ? (
          <ExternalLink className="size-3.5" aria-hidden="true" />
        ) : null}
      </button>
      {message ? (
        <p
          className="soft-control mt-3 border-l-4 border-human-coral bg-human-coral-soft p-3 text-xs leading-6"
          role="alert"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
