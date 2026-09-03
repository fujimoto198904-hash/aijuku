import { env } from 'cloudflare:workers';
import Stripe from 'stripe';

import type { ServiceType } from '@/db/membership';
import { withSiteBasePath } from '@/lib/site-paths';
import { canonicalPublicMemberUrl } from '@/lib/site-runtime';

export const stripeApiVersion = '2026-08-26.dahlia' as const;
export const stripeBillingPortalConfigurationId =
  'bpc_1UBbJVD8iUMy4IW9MrhzJJpZ';

type StripeBillingEnv = {
  STRIPE_ACCOUNT_ID?: string;
  STRIPE_BILLING_MODE?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
};

export type StripeBillingPlan = {
  serviceType: ServiceType;
  checkoutMode: 'payment' | 'subscription';
  productId: string;
  lookupKey: string;
  amount: number;
  currency: 'jpy';
  recurringInterval: 'month' | null;
};

const billingPlans: Record<ServiceType, StripeBillingPlan> = {
  'in-person-tutor': {
    serviceType: 'in-person-tutor',
    checkoutMode: 'payment',
    productId: 'prod_VBxPjxHgjWfS17',
    lookupKey: 'aijuku_in_person_tutor_jpy_once_v1',
    amount: 10_000,
    currency: 'jpy',
    recurringInterval: null,
  },
  'online-tutor': {
    serviceType: 'online-tutor',
    checkoutMode: 'payment',
    productId: 'prod_VBxQZtRActSNeC',
    lookupKey: 'aijuku_online_tutor_jpy_once_v1',
    amount: 4_000,
    currency: 'jpy',
    recurringInterval: null,
  },
  'self-study': {
    serviceType: 'self-study',
    checkoutMode: 'subscription',
    productId: 'prod_VBxTaTYdf2kkGK',
    lookupKey: 'aijuku_self_study_jpy_monthly_v1',
    amount: 10_000,
    currency: 'jpy',
    recurringInterval: 'month',
  },
};

export class StripeBillingConfigurationError extends Error {
  constructor(
    public readonly publicMessage: string,
    public readonly reason:
      | 'disabled'
      | 'invalid-secret-key'
      | 'missing-account-id'
      | 'missing-webhook-secret',
  ) {
    super(reason);
    this.name = 'StripeBillingConfigurationError';
  }
}

export class StripeCatalogConfigurationError extends Error {
  constructor(public readonly publicMessage: string) {
    super('stripe-catalog-mismatch');
    this.name = 'StripeCatalogConfigurationError';
  }
}

export type StripeBillingRuntime = {
  accountId: string;
  client: Stripe;
  livemode: false;
  webhookSecret?: string;
};

export type StripeTestBillingDisplayConfig = {
  stripeAccountId: string;
};

let cachedClient: { secretKey: string; client: Stripe } | null = null;
const accountVerificationTtlMs = 5 * 60 * 1_000;
const verifiedAccounts = new WeakMap<
  Stripe,
  { accountId: string; expiresAt: number; promise: Promise<void> }
>();

export function getStripeBillingRuntime(input?: {
  requireWebhookSecret?: boolean;
}): StripeBillingRuntime {
  const stripeEnv = env as unknown as StripeBillingEnv;
  if (stripeEnv.STRIPE_BILLING_MODE !== 'test') {
    throw new StripeBillingConfigurationError(
      'サンドボックス決済は現在無効です。',
      'disabled',
    );
  }

  const secretKey = stripeEnv.STRIPE_SECRET_KEY?.trim() ?? '';
  if (
    secretKey.startsWith('sk_live_') ||
    secretKey.startsWith('rk_live_') ||
    !/^(?:sk|rk)_test_[A-Za-z0-9]+$/.test(secretKey)
  ) {
    throw new StripeBillingConfigurationError(
      'Stripeのテスト用サーバーキーを確認してください。',
      'invalid-secret-key',
    );
  }

  const accountId = stripeEnv.STRIPE_ACCOUNT_ID?.trim() ?? '';
  if (!/^acct_[A-Za-z0-9]{12,}$/.test(accountId)) {
    throw new StripeBillingConfigurationError(
      'StripeサンドボックスのアカウントIDを確認してください。',
      'missing-account-id',
    );
  }

  const webhookSecret = stripeEnv.STRIPE_WEBHOOK_SECRET?.trim() || undefined;
  if (
    input?.requireWebhookSecret &&
    (!webhookSecret || !/^whsec_[A-Za-z0-9]+$/.test(webhookSecret))
  ) {
    throw new StripeBillingConfigurationError(
      'Stripe Webhookの署名シークレットを確認してください。',
      'missing-webhook-secret',
    );
  }

  if (!cachedClient || cachedClient.secretKey !== secretKey) {
    cachedClient = {
      secretKey,
      client: new Stripe(secretKey, {
        apiVersion: stripeApiVersion,
        httpClient: Stripe.createFetchHttpClient(),
        maxNetworkRetries: 2,
        telemetry: false,
      }),
    };
  }

  return {
    accountId,
    client: cachedClient.client,
    livemode: false,
    webhookSecret,
  };
}

export function getStripeTestBillingDisplayConfig(): StripeTestBillingDisplayConfig | null {
  try {
    const runtime = getStripeBillingRuntime({ requireWebhookSecret: true });
    return { stripeAccountId: runtime.accountId };
  } catch (error) {
    if (error instanceof StripeBillingConfigurationError) return null;
    throw error;
  }
}

export async function verifyStripeBillingAccount(
  runtime: StripeBillingRuntime,
): Promise<void> {
  const cached = verifiedAccounts.get(runtime.client);
  if (
    cached &&
    cached.accountId === runtime.accountId &&
    cached.expiresAt > Date.now()
  ) {
    return cached.promise;
  }

  const verification = runtime.client.accounts
    .retrieveCurrent()
    .then((account) => {
      if (account.id !== runtime.accountId) {
        throw new StripeBillingConfigurationError(
          'Stripeキーとサンドボックスアカウントが一致しません。',
          'missing-account-id',
        );
      }
    })
    .catch((error: unknown) => {
      verifiedAccounts.delete(runtime.client);
      throw error;
    });
  verifiedAccounts.set(runtime.client, {
    accountId: runtime.accountId,
    expiresAt: Date.now() + accountVerificationTtlMs,
    promise: verification,
  });
  return verification;
}

export function getStripeBillingPlan(
  serviceType: ServiceType,
): StripeBillingPlan {
  return billingPlans[serviceType];
}

export async function resolveVerifiedStripePrice(
  client: Stripe,
  plan: StripeBillingPlan,
): Promise<Stripe.Price> {
  const prices = await client.prices.list({
    active: true,
    lookup_keys: [plan.lookupKey],
    limit: 10,
    expand: ['data.product'],
  });
  if (prices.data.length !== 1) {
    throw new StripeCatalogConfigurationError(
      'Stripeの料金設定を一意に確認できませんでした。',
    );
  }

  const price = prices.data[0];
  const product = price.product;
  const productMatches =
    typeof product !== 'string' &&
    !('deleted' in product) &&
    product.active &&
    product.id === plan.productId;
  const recurringMatches =
    plan.recurringInterval === null
      ? price.type === 'one_time' && price.recurring === null
      : price.type === 'recurring' &&
        price.recurring?.interval === plan.recurringInterval &&
        price.recurring.interval_count === 1 &&
        price.recurring.usage_type === 'licensed';

  if (
    !price.active ||
    price.livemode ||
    !productMatches ||
    price.currency.toLowerCase() !== plan.currency ||
    price.unit_amount !== plan.amount ||
    price.billing_scheme !== 'per_unit' ||
    price.custom_unit_amount !== null ||
    !recurringMatches
  ) {
    throw new StripeCatalogConfigurationError(
      'Stripeの通貨・金額・課金間隔がサイトの設定と一致しません。',
    );
  }

  return price;
}

export function createStripeIntegrationIdentifier(seed?: string): string {
  const bytes = seed
    ? deterministicIdentifierBytes(seed)
    : crypto.getRandomValues(new Uint8Array(8));
  const suffix = Array.from(bytes, (value) =>
    String.fromCharCode(97 + (value % 26)),
  ).join('');
  return `aijuku_${suffix}`;
}

function deterministicIdentifierBytes(seed: string): Uint8Array {
  const bytes = new Uint8Array(8);
  for (let index = 0; index < seed.length; index += 1) {
    const slot = index % bytes.length;
    bytes[slot] = (bytes[slot] * 33 + seed.charCodeAt(index) + index) % 256;
  }
  return bytes;
}

export async function createStripeCheckoutIdempotencyKey(input: {
  accountId: string;
  scope: string;
  generation: string;
}): Promise<string> {
  const digest = await stableStripeDigest(
    `${input.accountId}:${input.scope}:${input.generation}`,
  );
  return `aijuku-checkout-v1:${input.accountId}:${digest}`;
}

export async function createStripeCheckoutAttemptId(input: {
  accountId: string;
  scope: string;
  generation: string;
}): Promise<string> {
  const digest = await stableStripeDigest(
    `${input.accountId}:${input.scope}:${input.generation}`,
  );
  return `aijuku-attempt-v1:${digest}`;
}

export async function createStripeCustomerIdempotencyKey(input: {
  accountId: string;
  memberId: string;
  generation: string;
}): Promise<string> {
  const memberHash = await stableStripeDigest(
    `${input.accountId}:${input.memberId}:${input.generation}`,
  );
  return `aijuku-customer-v1:${input.accountId}:${memberHash}`;
}

async function stableStripeDigest(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

export function stripeObjectId(
  value: string | { id: string } | null | undefined,
): string | null {
  if (typeof value === 'string') return value;
  return value?.id ?? null;
}

export function isStripeHostedUrl(
  value: string | null,
  surface: 'checkout' | 'portal',
): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    const expectedHostname =
      surface === 'checkout' ? 'checkout.stripe.com' : 'billing.stripe.com';
    return (
      url.protocol === 'https:' &&
      url.hostname === expectedHostname &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function billingReturnUrls(request: Request): {
  successUrl: string;
  cancelUrl: string;
  portalReturnUrl: string;
} {
  const requestUrl = new URL(request.url);
  const localHostname =
    requestUrl.hostname === 'localhost' ||
    requestUrl.hostname === '127.0.0.1' ||
    requestUrl.hostname === '[::1]';
  const origin = localHostname
    ? requestUrl.origin
    : new URL(canonicalPublicMemberUrl).origin;
  const mypage = withSiteBasePath('/mypage');
  return {
    successUrl: `${origin}${mypage}?checkout=success&session_id={CHECKOUT_SESSION_ID}#applications`,
    cancelUrl: `${origin}${mypage}?checkout=cancelled#applications`,
    portalReturnUrl: `${origin}${mypage}#billing`,
  };
}
