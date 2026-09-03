'use client';

import { CreditCard, ExternalLink, Settings2 } from 'lucide-react';
import { useState } from 'react';

import type { ServiceType } from '@/db/membership';
import { withSiteBasePath } from '@/lib/site-paths';

type BillingAction = 'checkout' | 'portal';
type CheckoutStatus = 'open' | 'complete' | 'expired';
type PaymentStatus = 'no_payment_required' | 'unpaid' | 'paid';
type SubscriptionStatus =
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused';

type BillingResponse = {
  error?: string;
  url?: string;
};

const stripeHosts: Record<BillingAction, string> = {
  checkout: 'checkout.stripe.com',
  portal: 'billing.stripe.com',
};

function getStripeDestination(action: BillingAction, value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Stripeの画面を開けませんでした。');
  }

  const destination = new URL(value);
  if (
    destination.origin !== `https://${stripeHosts[action]}` ||
    destination.username ||
    destination.password
  ) {
    throw new Error('安全なStripe接続先を確認できませんでした。');
  }

  return destination.toString();
}

export function BillingActions({
  applicationId,
  billingEnabled,
  canManageBilling = false,
  checkoutStatus,
  paymentFailedAt,
  paymentStatus,
  serviceType,
  subscriptionCancelAt,
  subscriptionCancelAtPeriodEnd,
  subscriptionCurrentPeriodEnd,
  subscriptionStatus,
}: {
  applicationId: string;
  billingEnabled: boolean;
  canManageBilling?: boolean;
  checkoutStatus?: CheckoutStatus;
  paymentFailedAt?: number | null;
  paymentStatus?: PaymentStatus;
  serviceType: ServiceType;
  subscriptionCancelAt?: number | null;
  subscriptionCancelAtPeriodEnd?: boolean;
  subscriptionCurrentPeriodEnd?: number | null;
  subscriptionStatus?: SubscriptionStatus;
}) {
  const [activeAction, setActiveAction] = useState<BillingAction | null>(null);
  const [message, setMessage] = useState('');

  async function openStripe(action: BillingAction) {
    setActiveAction(action);
    setMessage('');

    try {
      const response = await fetch(withSiteBasePath(`/api/billing/${action}`), {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify(action === 'checkout' ? { applicationId } : {}),
      });
      const body = (await response.json().catch(() => ({}))) as BillingResponse;
      if (!response.ok) {
        throw new Error(
          body.error ??
            (action === 'checkout'
              ? '決済画面を開けませんでした。'
              : '契約管理画面を開けませんでした。'),
        );
      }

      window.location.assign(getStripeDestination(action, body.url));
    } catch (error) {
      setActiveAction(null);
      setMessage(
        error instanceof Error
          ? error.message
          : 'Stripeへ接続できませんでした。時間をおいて再度お試しください。',
      );
    }
  }

  const isSubscription = serviceType === 'self-study';
  const subscriptionEnded =
    subscriptionStatus === 'canceled' ||
    subscriptionStatus === 'incomplete_expired';
  const paymentConfirmed =
    !subscriptionEnded &&
    (paymentStatus === 'paid' ||
      (checkoutStatus === 'complete' &&
        paymentStatus === 'no_payment_required'));
  const paymentFailed =
    checkoutStatus === 'complete' &&
    paymentStatus === 'unpaid' &&
    paymentFailedAt != null;
  const paymentPending =
    !subscriptionEnded &&
    checkoutStatus === 'complete' &&
    paymentStatus === 'unpaid' &&
    !paymentFailed;
  const hasSubscription =
    subscriptionStatus !== undefined && !subscriptionEnded;
  const billingNeedsAttention =
    subscriptionStatus === 'incomplete' ||
    subscriptionStatus === 'past_due' ||
    subscriptionStatus === 'unpaid';
  const subscriptionEndDate = formatBillingDate(
    subscriptionCancelAt ?? subscriptionCurrentPeriodEnd,
  );

  if (paymentConfirmed || hasSubscription) {
    return (
      <div className="mt-4 border-t border-rule pt-4">
        <p
          className={`font-semibold ${billingNeedsAttention ? 'text-human-coral' : 'text-sapphire'}`}
        >
          {subscriptionStatus === 'incomplete'
            ? '初回支払い未完了・要確認'
            : billingNeedsAttention
              ? 'お支払いの確認が必要です'
              : subscriptionStatus === 'paused'
                ? '月額契約は一時停止中です'
                : subscriptionCancelAtPeriodEnd
                  ? '月額契約は期間末で解約予定です'
                  : hasSubscription
                    ? '月額契約をStripeで確認済み'
                    : 'Stripeで決済完了を確認済み'}
        </p>
        <p className="mt-1 text-quiet">
          {billingNeedsAttention
            ? '支払い・契約管理画面で最新状態をご確認ください。'
            : subscriptionCancelAtPeriodEnd
              ? subscriptionEndDate
                ? `${subscriptionEndDate}に終了予定です。変更は支払い・契約管理画面から行えます。`
                : '期間末で終了予定です。変更は支払い・契約管理画面から行えます。'
              : 'この表示はStripeから受け取った結果に基づいています。'}
        </p>
        {canManageBilling && billingEnabled ? (
          <button
            className="soft-control mt-3 inline-flex min-h-11 items-center gap-2 border border-sapphire px-4 text-xs font-semibold text-sapphire disabled:cursor-wait disabled:opacity-60"
            disabled={activeAction !== null}
            onClick={() => void openStripe('portal')}
            type="button"
          >
            <Settings2 className="size-4" aria-hidden="true" />
            {activeAction === 'portal'
              ? '接続しています…'
              : '支払い・契約を管理'}
          </button>
        ) : null}
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

  if (paymentPending) {
    return (
      <div className="mt-4 border-t border-rule pt-4">
        <p className="font-semibold text-sapphire">決済結果を確認中です</p>
        <p className="mt-1 text-quiet">
          二重決済を防ぐため、Stripeから最終結果を受け取るまでお待ちください。
        </p>
      </div>
    );
  }

  if (!billingEnabled) {
    return (
      <div className="mt-4 border-t border-rule pt-4">
        <p className="font-semibold text-quiet">決済未接続</p>
        <p className="mt-1 text-quiet">
          料金と取引条件の確認後にご案内します。この画面は支払済みを示しません。
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-rule pt-4">
      <p className="font-semibold text-sapphire">
        {paymentFailed
          ? '前回のテスト決済は完了しませんでした'
          : subscriptionEnded
            ? '前回の月額契約は終了しています'
            : 'Stripeテスト決済'}
      </p>
      <p className="mt-1 text-quiet">
        {paymentFailed
          ? '新しい決済画面でもう一度試せます。二重決済にならないよう前回の結果を確認済みです。'
          : subscriptionEnded
            ? '新しい確定申込から、月額受講をもう一度開始できます。'
            : 'サンドボックスのため、実際の請求は発生しません。決済結果はStripeからの確認後に反映します。'}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="soft-control inline-flex min-h-11 items-center gap-2 bg-sapphire px-4 text-xs font-semibold text-white disabled:cursor-wait disabled:opacity-60"
          disabled={activeAction !== null}
          onClick={() => void openStripe('checkout')}
          type="button"
        >
          <CreditCard className="size-4" aria-hidden="true" />
          {activeAction === 'checkout'
            ? '接続しています…'
            : paymentFailed
              ? 'もう一度テスト決済へ'
              : isSubscription
                ? '月額受講のテスト決済へ'
                : '受講料のテスト決済へ'}
          {activeAction !== 'checkout' ? (
            <ExternalLink className="size-3.5" aria-hidden="true" />
          ) : null}
        </button>
        {canManageBilling ? (
          <button
            className="soft-control inline-flex min-h-11 items-center gap-2 border border-sapphire px-4 text-xs font-semibold text-sapphire disabled:cursor-wait disabled:opacity-60"
            disabled={activeAction !== null}
            onClick={() => void openStripe('portal')}
            type="button"
          >
            <Settings2 className="size-4" aria-hidden="true" />
            {activeAction === 'portal'
              ? '接続しています…'
              : '支払い・契約を管理'}
          </button>
        ) : null}
      </div>
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

function formatBillingDate(value: number | null | undefined): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Tokyo',
  }).format(new Date(value));
}
