import { env } from 'cloudflare:workers';

import type { ApplicationStatus, ServiceType } from '@/db/membership';

export type BillableApplication = {
  id: string;
  memberId: string;
  memberEmail: string;
  memberDisplayName: string;
  serviceType: ServiceType;
  status: Extract<ApplicationStatus, 'confirmed'>;
  offerPrice: string | null;
};

export type BillingApplicationIdentity = {
  id: string;
  memberId: string;
  serviceType: ServiceType;
};

export type BillingCustomer = {
  stripeCustomerId: string;
  memberId: string;
  stripeAccountId: string;
  livemode: boolean;
  deletedAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export type BillingCheckoutMode = 'payment' | 'subscription';
export type BillingCheckoutStatus = 'open' | 'complete' | 'expired';
export type BillingPaymentStatus = 'no_payment_required' | 'unpaid' | 'paid';

export type BillingCheckoutSession = {
  stripeCheckoutSessionId: string;
  memberId: string;
  applicationId: string | null;
  checkoutAttemptId: string;
  stripeIdempotencyKey: string;
  stripeAccountId: string;
  livemode: boolean;
  serviceType: ServiceType;
  mode: BillingCheckoutMode;
  status: BillingCheckoutStatus;
  paymentStatus: BillingPaymentStatus;
  paymentFailedAt: number | null;
  stateObservedAt: number;
  currency: string | null;
  amountTotal: number | null;
  stripeCustomerId: string | null;
  stripePaymentIntentId: string | null;
  stripeSubscriptionId: string | null;
  checkoutUrl: string | null;
  expiresAt: number | null;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export type BillingSubscriptionStatus =
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused';

export type BillingSubscription = {
  stripeSubscriptionId: string;
  memberId: string;
  applicationId: string | null;
  stripeAccountId: string;
  livemode: boolean;
  stripeCustomerId: string;
  serviceType: ServiceType;
  stripePriceId: string;
  status: BillingSubscriptionStatus;
  stateObservedAt: number;
  currency: string | null;
  unitAmount: number | null;
  quantity: number | null;
  currentPeriodStart: number | null;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  cancelAt: number | null;
  canceledAt: number | null;
  endedAt: number | null;
  trialEnd: number | null;
  latestInvoiceId: string | null;
  createdAt: number;
  updatedAt: number;
};

export type StripeWebhookFailureCode =
  | 'database_error'
  | 'handler_error'
  | 'invalid_event_data';

export type StripeWebhookClaimResult =
  | { status: 'claimed'; attemptCount: number }
  | { status: 'processed' }
  | { status: 'busy' };

export type StripeObjectSyncType =
  | 'checkout_session'
  | 'subscription'
  | 'customer';

type RawBillingCustomer = Omit<BillingCustomer, 'livemode'> & {
  livemode: number;
};

type RawBillableApplication = Omit<BillableApplication, 'offerPrice'> & {
  offerSnapshot: string;
};

type RawBillingCheckoutSession = Omit<BillingCheckoutSession, 'livemode'> & {
  livemode: number;
};

type RawBillingSubscription = Omit<
  BillingSubscription,
  'livemode' | 'cancelAtPeriodEnd'
> & {
  livemode: number;
  cancelAtPeriodEnd: number;
};

const webhookProcessingLeaseMs = 5 * 60 * 1000;
const stripeObjectSyncLeaseMs = 10 * 60 * 1000;

function getD1(): D1Database {
  if (!env.DB) throw new Error('D1 binding `DB` is unavailable.');
  return env.DB;
}

function toBillingCustomer(row: RawBillingCustomer): BillingCustomer {
  return { ...row, livemode: row.livemode === 1 };
}

function readOfferPrice(offerSnapshot: string): string | null {
  try {
    const value = (JSON.parse(offerSnapshot) as { price?: unknown }).price;
    return typeof value === 'string' ? value : null;
  } catch {
    return null;
  }
}

function toBillingCheckoutSession(
  row: RawBillingCheckoutSession,
): BillingCheckoutSession {
  return { ...row, livemode: row.livemode === 1 };
}

function toBillingSubscription(
  row: RawBillingSubscription,
): BillingSubscription {
  return {
    ...row,
    livemode: row.livemode === 1,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd === 1,
  };
}

const billingCustomerColumns = `
  stripe_customer_id AS stripeCustomerId,
  member_id AS memberId,
  stripe_account_id AS stripeAccountId,
  livemode,
  deleted_at AS deletedAt,
  created_at AS createdAt,
  updated_at AS updatedAt
`;

const billingCheckoutSessionColumns = `
  stripe_checkout_session_id AS stripeCheckoutSessionId,
  member_id AS memberId,
  application_id AS applicationId,
  checkout_attempt_id AS checkoutAttemptId,
  stripe_idempotency_key AS stripeIdempotencyKey,
  stripe_account_id AS stripeAccountId,
  livemode,
  service_type AS serviceType,
  mode,
  status,
  payment_status AS paymentStatus,
  payment_failed_at AS paymentFailedAt,
  state_observed_at AS stateObservedAt,
  currency,
  amount_total AS amountTotal,
  stripe_customer_id AS stripeCustomerId,
  stripe_payment_intent_id AS stripePaymentIntentId,
  stripe_subscription_id AS stripeSubscriptionId,
  checkout_url AS checkoutUrl,
  expires_at AS expiresAt,
  completed_at AS completedAt,
  created_at AS createdAt,
  updated_at AS updatedAt
`;

const billingSubscriptionColumns = `
  stripe_subscription_id AS stripeSubscriptionId,
  member_id AS memberId,
  application_id AS applicationId,
  stripe_account_id AS stripeAccountId,
  livemode,
  stripe_customer_id AS stripeCustomerId,
  service_type AS serviceType,
  stripe_price_id AS stripePriceId,
  status,
  state_observed_at AS stateObservedAt,
  currency,
  unit_amount AS unitAmount,
  quantity,
  current_period_start AS currentPeriodStart,
  current_period_end AS currentPeriodEnd,
  cancel_at_period_end AS cancelAtPeriodEnd,
  cancel_at AS cancelAt,
  canceled_at AS canceledAt,
  ended_at AS endedAt,
  trial_end AS trialEnd,
  latest_invoice_id AS latestInvoiceId,
  created_at AS createdAt,
  updated_at AS updatedAt
`;

export async function getBillableApplication(input: {
  memberId: string;
  applicationId: string;
}): Promise<BillableApplication | null> {
  const application = await getD1()
    .prepare(
      `
        SELECT
          applications.id,
          applications.member_id AS memberId,
          members.email AS memberEmail,
          members.display_name AS memberDisplayName,
          applications.service_type AS serviceType,
          applications.status,
          applications.offer_snapshot AS offerSnapshot
        FROM applications
        INNER JOIN members ON members.id = applications.member_id
        WHERE
          applications.id = ?
          AND applications.member_id = ?
          AND applications.status = 'confirmed'
          AND members.status = 'active'
        LIMIT 1
      `,
    )
    .bind(input.applicationId, input.memberId)
    .first<RawBillableApplication>();
  if (!application) return null;
  const { offerSnapshot, ...billableApplication } = application;
  return {
    ...billableApplication,
    offerPrice: readOfferPrice(offerSnapshot),
  };
}

export async function getBillingApplicationIdentity(input: {
  memberId: string;
  applicationId: string;
}): Promise<BillingApplicationIdentity | null> {
  return getD1()
    .prepare(
      `
        SELECT
          id,
          member_id AS memberId,
          service_type AS serviceType
        FROM applications
        WHERE id = ? AND member_id = ?
        LIMIT 1
      `,
    )
    .bind(input.applicationId, input.memberId)
    .first<BillingApplicationIdentity>();
}

export async function getBillingCustomer(input: {
  memberId: string;
  stripeAccountId: string;
  livemode: boolean;
}): Promise<BillingCustomer | null> {
  const row = await getD1()
    .prepare(
      `
        SELECT ${billingCustomerColumns}
        FROM billing_customers
        WHERE
          member_id = ?
          AND stripe_account_id = ?
          AND livemode = ?
          AND deleted_at IS NULL
        LIMIT 1
      `,
    )
    .bind(input.memberId, input.stripeAccountId, input.livemode ? 1 : 0)
    .first<RawBillingCustomer>();
  return row ? toBillingCustomer(row) : null;
}

export async function getLatestBillingCustomer(input: {
  memberId: string;
  stripeAccountId: string;
  livemode: boolean;
}): Promise<BillingCustomer | null> {
  const row = await getD1()
    .prepare(
      `
        SELECT ${billingCustomerColumns}
        FROM billing_customers
        WHERE
          member_id = ?
          AND stripe_account_id = ?
          AND livemode = ?
        LIMIT 1
      `,
    )
    .bind(input.memberId, input.stripeAccountId, input.livemode ? 1 : 0)
    .first<RawBillingCustomer>();
  return row ? toBillingCustomer(row) : null;
}

export async function getBillingCustomerByStripeCustomerId(input: {
  stripeCustomerId: string;
  stripeAccountId: string;
  livemode: boolean;
}): Promise<BillingCustomer | null> {
  const row = await getD1()
    .prepare(
      `
        SELECT ${billingCustomerColumns}
        FROM billing_customers
        WHERE
          stripe_customer_id = ?
          AND stripe_account_id = ?
          AND livemode = ?
          AND deleted_at IS NULL
        LIMIT 1
      `,
    )
    .bind(input.stripeCustomerId, input.stripeAccountId, input.livemode ? 1 : 0)
    .first<RawBillingCustomer>();
  return row ? toBillingCustomer(row) : null;
}

export async function upsertBillingCustomer(input: {
  stripeCustomerId: string;
  memberId: string;
  stripeAccountId: string;
  livemode: boolean;
}): Promise<BillingCustomer> {
  const now = Date.now();
  const row = await getD1()
    .prepare(
      `
        INSERT INTO billing_customers (
          stripe_customer_id,
          member_id,
          stripe_account_id,
          livemode,
          deleted_at,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, NULL, ?, ?)
        ON CONFLICT(member_id, stripe_account_id, livemode) DO UPDATE SET
          stripe_customer_id = excluded.stripe_customer_id,
          deleted_at = CASE
            WHEN billing_customers.stripe_customer_id = excluded.stripe_customer_id
              THEN billing_customers.deleted_at
            ELSE NULL
          END,
          updated_at = excluded.updated_at
        WHERE
          billing_customers.stripe_customer_id = excluded.stripe_customer_id
          OR billing_customers.deleted_at IS NOT NULL
        RETURNING ${billingCustomerColumns}
      `,
    )
    .bind(
      input.stripeCustomerId,
      input.memberId,
      input.stripeAccountId,
      input.livemode ? 1 : 0,
      now,
      now,
    )
    .first<RawBillingCustomer>();
  if (!row) throw new Error('Billing customer was not saved.');
  return toBillingCustomer(row);
}

export async function markBillingCustomerDeleted(input: {
  stripeCustomerId: string;
  stripeAccountId: string;
  livemode: boolean;
}): Promise<boolean> {
  const now = Date.now();
  const result = await getD1()
    .prepare(
      `
        UPDATE billing_customers
        SET deleted_at = ?, updated_at = ?
        WHERE
          stripe_customer_id = ?
          AND stripe_account_id = ?
          AND livemode = ?
          AND deleted_at IS NULL
      `,
    )
    .bind(
      now,
      now,
      input.stripeCustomerId,
      input.stripeAccountId,
      input.livemode ? 1 : 0,
    )
    .run();
  return Number(result.meta.changes ?? 0) > 0;
}

export type UpsertBillingCheckoutSessionInput = Omit<
  BillingCheckoutSession,
  'createdAt' | 'updatedAt'
> & {
  createdAt?: number;
};

export async function upsertBillingCheckoutSession(
  input: UpsertBillingCheckoutSessionInput,
): Promise<BillingCheckoutSession> {
  const now = Date.now();
  const row = await getD1()
    .prepare(
      `
        INSERT INTO billing_checkout_sessions (
          stripe_checkout_session_id,
          member_id,
          application_id,
          checkout_attempt_id,
          stripe_idempotency_key,
          stripe_account_id,
          livemode,
          service_type,
          mode,
          status,
          payment_status,
          payment_failed_at,
          state_observed_at,
          currency,
          amount_total,
          stripe_customer_id,
          stripe_payment_intent_id,
          stripe_subscription_id,
          checkout_url,
          expires_at,
          completed_at,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(stripe_checkout_session_id) DO UPDATE SET
          status = CASE
            WHEN billing_checkout_sessions.status IN ('complete', 'expired')
              THEN billing_checkout_sessions.status
            WHEN excluded.status IN ('complete', 'expired')
              THEN excluded.status
            WHEN billing_checkout_sessions.state_observed_at > excluded.state_observed_at
              THEN billing_checkout_sessions.status
            ELSE excluded.status
          END,
          payment_status = CASE
            WHEN billing_checkout_sessions.payment_status IN ('paid', 'no_payment_required')
              THEN billing_checkout_sessions.payment_status
            WHEN excluded.payment_status IN ('paid', 'no_payment_required')
              THEN excluded.payment_status
            WHEN billing_checkout_sessions.state_observed_at > excluded.state_observed_at
              THEN billing_checkout_sessions.payment_status
            ELSE excluded.payment_status
          END,
          payment_failed_at = CASE
            WHEN billing_checkout_sessions.payment_status IN ('paid', 'no_payment_required')
              OR excluded.payment_status IN ('paid', 'no_payment_required')
              THEN NULL
            ELSE COALESCE(
              billing_checkout_sessions.payment_failed_at,
              excluded.payment_failed_at
            )
          END,
          state_observed_at = MAX(
            billing_checkout_sessions.state_observed_at,
            excluded.state_observed_at
          ),
          currency = COALESCE(billing_checkout_sessions.currency, excluded.currency),
          amount_total = COALESCE(billing_checkout_sessions.amount_total, excluded.amount_total),
          stripe_customer_id = COALESCE(billing_checkout_sessions.stripe_customer_id, excluded.stripe_customer_id),
          stripe_payment_intent_id = COALESCE(billing_checkout_sessions.stripe_payment_intent_id, excluded.stripe_payment_intent_id),
          stripe_subscription_id = COALESCE(billing_checkout_sessions.stripe_subscription_id, excluded.stripe_subscription_id),
          checkout_url = COALESCE(billing_checkout_sessions.checkout_url, excluded.checkout_url),
          expires_at = COALESCE(billing_checkout_sessions.expires_at, excluded.expires_at),
          completed_at = COALESCE(billing_checkout_sessions.completed_at, excluded.completed_at),
          updated_at = CASE
            WHEN billing_checkout_sessions.state_observed_at <= excluded.state_observed_at
              THEN excluded.updated_at
            ELSE billing_checkout_sessions.updated_at
          END
        WHERE
          billing_checkout_sessions.member_id = excluded.member_id
          AND billing_checkout_sessions.application_id IS excluded.application_id
          AND billing_checkout_sessions.checkout_attempt_id = excluded.checkout_attempt_id
          AND billing_checkout_sessions.stripe_idempotency_key = excluded.stripe_idempotency_key
          AND billing_checkout_sessions.stripe_account_id = excluded.stripe_account_id
          AND billing_checkout_sessions.livemode = excluded.livemode
          AND billing_checkout_sessions.service_type = excluded.service_type
          AND billing_checkout_sessions.mode = excluded.mode
        RETURNING ${billingCheckoutSessionColumns}
      `,
    )
    .bind(
      input.stripeCheckoutSessionId,
      input.memberId,
      input.applicationId,
      input.checkoutAttemptId,
      input.stripeIdempotencyKey,
      input.stripeAccountId,
      input.livemode ? 1 : 0,
      input.serviceType,
      input.mode,
      input.status,
      input.paymentStatus,
      input.paymentFailedAt,
      input.stateObservedAt,
      input.currency,
      input.amountTotal,
      input.stripeCustomerId,
      input.stripePaymentIntentId,
      input.stripeSubscriptionId,
      input.checkoutUrl,
      input.expiresAt,
      input.completedAt,
      input.createdAt ?? now,
      now,
    )
    .first<RawBillingCheckoutSession>();
  if (!row) throw new Error('Billing checkout session was not saved.');
  return toBillingCheckoutSession(row);
}

export const createBillingCheckoutSession = upsertBillingCheckoutSession;

export async function updateBillingCheckoutSession(input: {
  stripeCheckoutSessionId: string;
  stripeAccountId: string;
  livemode: boolean;
  status: BillingCheckoutStatus;
  paymentStatus: BillingPaymentStatus;
  paymentFailedAt: number | null;
  stateObservedAt: number;
  currency: string | null;
  amountTotal: number | null;
  stripeCustomerId: string | null;
  stripePaymentIntentId: string | null;
  stripeSubscriptionId: string | null;
  checkoutUrl: string | null;
  expiresAt: number | null;
  completedAt: number | null;
}): Promise<BillingCheckoutSession | null> {
  const row = await getD1()
    .prepare(
      `
        UPDATE billing_checkout_sessions
        SET
          status = CASE
            WHEN status IN ('complete', 'expired') THEN status
            ELSE ?
          END,
          payment_status = CASE
            WHEN payment_status IN ('paid', 'no_payment_required')
              THEN payment_status
            ELSE ?
          END,
          payment_failed_at = CASE
            WHEN payment_status IN ('paid', 'no_payment_required') THEN NULL
            WHEN ? IN ('paid', 'no_payment_required') THEN NULL
            ELSE COALESCE(payment_failed_at, ?)
          END,
          state_observed_at = ?,
          currency = COALESCE(currency, ?),
          amount_total = COALESCE(amount_total, ?),
          stripe_customer_id = COALESCE(stripe_customer_id, ?),
          stripe_payment_intent_id = COALESCE(stripe_payment_intent_id, ?),
          stripe_subscription_id = COALESCE(stripe_subscription_id, ?),
          checkout_url = COALESCE(checkout_url, ?),
          expires_at = COALESCE(expires_at, ?),
          completed_at = COALESCE(completed_at, ?),
          updated_at = ?
        WHERE
          stripe_checkout_session_id = ?
          AND stripe_account_id = ?
          AND livemode = ?
          AND state_observed_at <= ?
        RETURNING ${billingCheckoutSessionColumns}
      `,
    )
    .bind(
      input.status,
      input.paymentStatus,
      input.paymentStatus,
      input.paymentFailedAt,
      input.stateObservedAt,
      input.currency,
      input.amountTotal,
      input.stripeCustomerId,
      input.stripePaymentIntentId,
      input.stripeSubscriptionId,
      input.checkoutUrl,
      input.expiresAt,
      input.completedAt,
      Date.now(),
      input.stripeCheckoutSessionId,
      input.stripeAccountId,
      input.livemode ? 1 : 0,
      input.stateObservedAt,
    )
    .first<RawBillingCheckoutSession>();
  if (row) return toBillingCheckoutSession(row);
  return getBillingCheckoutSession({
    stripeCheckoutSessionId: input.stripeCheckoutSessionId,
    stripeAccountId: input.stripeAccountId,
    livemode: input.livemode,
  });
}

export async function getBillingCheckoutSession(input: {
  stripeCheckoutSessionId: string;
  stripeAccountId: string;
  livemode: boolean;
}): Promise<BillingCheckoutSession | null> {
  const row = await getD1()
    .prepare(
      `
        SELECT ${billingCheckoutSessionColumns}
        FROM billing_checkout_sessions
        WHERE
          stripe_checkout_session_id = ?
          AND stripe_account_id = ?
          AND livemode = ?
        LIMIT 1
      `,
    )
    .bind(
      input.stripeCheckoutSessionId,
      input.stripeAccountId,
      input.livemode ? 1 : 0,
    )
    .first<RawBillingCheckoutSession>();
  return row ? toBillingCheckoutSession(row) : null;
}

export async function getBillingCheckoutSessionByAttempt(input: {
  checkoutAttemptId: string;
  stripeAccountId: string;
  livemode: boolean;
}): Promise<BillingCheckoutSession | null> {
  const row = await getD1()
    .prepare(
      `
        SELECT ${billingCheckoutSessionColumns}
        FROM billing_checkout_sessions
        WHERE
          checkout_attempt_id = ?
          AND stripe_account_id = ?
          AND livemode = ?
        LIMIT 1
      `,
    )
    .bind(
      input.checkoutAttemptId,
      input.stripeAccountId,
      input.livemode ? 1 : 0,
    )
    .first<RawBillingCheckoutSession>();
  return row ? toBillingCheckoutSession(row) : null;
}

export async function getLatestBillingCheckoutSessionForApplication(input: {
  memberId: string;
  applicationId: string;
  stripeAccountId: string;
  livemode: boolean;
}): Promise<BillingCheckoutSession | null> {
  const row = await getD1()
    .prepare(
      `
        SELECT ${billingCheckoutSessionColumns}
        FROM billing_checkout_sessions
        WHERE
          member_id = ?
          AND application_id = ?
          AND stripe_account_id = ?
          AND livemode = ?
        ORDER BY created_at DESC, updated_at DESC
        LIMIT 1
      `,
    )
    .bind(
      input.memberId,
      input.applicationId,
      input.stripeAccountId,
      input.livemode ? 1 : 0,
    )
    .first<RawBillingCheckoutSession>();
  return row ? toBillingCheckoutSession(row) : null;
}

export async function getLatestBillingCheckoutSessionForService(input: {
  memberId: string;
  serviceType: ServiceType;
  stripeAccountId: string;
  livemode: boolean;
}): Promise<BillingCheckoutSession | null> {
  const row = await getD1()
    .prepare(
      `
        SELECT ${billingCheckoutSessionColumns}
        FROM billing_checkout_sessions
        WHERE
          member_id = ?
          AND service_type = ?
          AND stripe_account_id = ?
          AND livemode = ?
        ORDER BY created_at DESC, updated_at DESC
        LIMIT 1
      `,
    )
    .bind(
      input.memberId,
      input.serviceType,
      input.stripeAccountId,
      input.livemode ? 1 : 0,
    )
    .first<RawBillingCheckoutSession>();
  return row ? toBillingCheckoutSession(row) : null;
}

export async function getReusableBillingCheckoutSession(input: {
  memberId: string;
  applicationId: string;
  stripeAccountId: string;
  livemode: boolean;
}): Promise<BillingCheckoutSession | null> {
  const row = await getD1()
    .prepare(
      `
        SELECT ${billingCheckoutSessionColumns}
        FROM billing_checkout_sessions
        WHERE
          member_id = ?
          AND application_id = ?
          AND stripe_account_id = ?
          AND livemode = ?
          AND (
            payment_status IN ('paid', 'no_payment_required')
            OR status = 'open'
            OR (
              status = 'complete'
              AND payment_status = 'unpaid'
              AND payment_failed_at IS NULL
            )
          )
        ORDER BY
          CASE
            WHEN payment_status IN ('paid', 'no_payment_required') THEN 0
            ELSE 1
          END,
          updated_at DESC
        LIMIT 1
      `,
    )
    .bind(
      input.memberId,
      input.applicationId,
      input.stripeAccountId,
      input.livemode ? 1 : 0,
    )
    .first<RawBillingCheckoutSession>();
  return row ? toBillingCheckoutSession(row) : null;
}

export async function getReusableBillingCheckoutSessionForService(input: {
  memberId: string;
  serviceType: ServiceType;
  stripeAccountId: string;
  livemode: boolean;
}): Promise<BillingCheckoutSession | null> {
  const row = await getD1()
    .prepare(
      `
        SELECT ${billingCheckoutSessionColumns}
        FROM billing_checkout_sessions
        WHERE
          member_id = ?
          AND service_type = ?
          AND stripe_account_id = ?
          AND livemode = ?
          AND (
            status = 'open'
            OR (
              status = 'complete'
              AND payment_status = 'unpaid'
              AND payment_failed_at IS NULL
            )
          )
        ORDER BY
          updated_at DESC
        LIMIT 1
      `,
    )
    .bind(
      input.memberId,
      input.serviceType,
      input.stripeAccountId,
      input.livemode ? 1 : 0,
    )
    .first<RawBillingCheckoutSession>();
  return row ? toBillingCheckoutSession(row) : null;
}

export async function listMemberBillingCheckoutSessions(input: {
  memberId: string;
  stripeAccountId: string;
  livemode: boolean;
  limit?: number;
}): Promise<BillingCheckoutSession[]> {
  const limit = Math.min(100, Math.max(1, Math.trunc(input.limit ?? 20)));
  const result = await getD1()
    .prepare(
      `
        SELECT ${billingCheckoutSessionColumns}
        FROM billing_checkout_sessions
        WHERE
          member_id = ?
          AND stripe_account_id = ?
          AND livemode = ?
        ORDER BY updated_at DESC
        LIMIT ?
      `,
    )
    .bind(input.memberId, input.stripeAccountId, input.livemode ? 1 : 0, limit)
    .all<RawBillingCheckoutSession>();
  return result.results.map(toBillingCheckoutSession);
}

export type UpsertBillingSubscriptionInput = Omit<
  BillingSubscription,
  'createdAt' | 'updatedAt'
> & {
  createdAt?: number;
};

export async function upsertBillingSubscription(
  input: UpsertBillingSubscriptionInput,
): Promise<BillingSubscription> {
  const now = Date.now();
  const row = await getD1()
    .prepare(
      `
        INSERT INTO billing_subscriptions (
          stripe_subscription_id,
          member_id,
          application_id,
          stripe_account_id,
          livemode,
          stripe_customer_id,
          service_type,
          stripe_price_id,
          status,
          state_observed_at,
          currency,
          unit_amount,
          quantity,
          current_period_start,
          current_period_end,
          cancel_at_period_end,
          cancel_at,
          canceled_at,
          ended_at,
          trial_end,
          latest_invoice_id,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(stripe_subscription_id) DO UPDATE SET
          application_id = COALESCE(billing_subscriptions.application_id, excluded.application_id),
          stripe_customer_id = billing_subscriptions.stripe_customer_id,
          stripe_price_id = billing_subscriptions.stripe_price_id,
          status = CASE
            WHEN billing_subscriptions.status IN ('canceled', 'incomplete_expired')
              THEN billing_subscriptions.status
            WHEN excluded.status IN ('canceled', 'incomplete_expired')
              THEN excluded.status
            WHEN billing_subscriptions.state_observed_at > excluded.state_observed_at
              THEN billing_subscriptions.status
            ELSE excluded.status
          END,
          state_observed_at = MAX(
            billing_subscriptions.state_observed_at,
            excluded.state_observed_at
          ),
          currency = COALESCE(billing_subscriptions.currency, excluded.currency),
          unit_amount = COALESCE(billing_subscriptions.unit_amount, excluded.unit_amount),
          quantity = COALESCE(billing_subscriptions.quantity, excluded.quantity),
          current_period_start = CASE
            WHEN billing_subscriptions.status IN ('canceled', 'incomplete_expired')
              THEN billing_subscriptions.current_period_start
            WHEN excluded.status IN ('canceled', 'incomplete_expired')
              THEN excluded.current_period_start
            WHEN billing_subscriptions.state_observed_at <= excluded.state_observed_at
              THEN excluded.current_period_start
            ELSE billing_subscriptions.current_period_start
          END,
          current_period_end = CASE
            WHEN billing_subscriptions.status IN ('canceled', 'incomplete_expired')
              THEN billing_subscriptions.current_period_end
            WHEN excluded.status IN ('canceled', 'incomplete_expired')
              THEN excluded.current_period_end
            WHEN billing_subscriptions.state_observed_at <= excluded.state_observed_at
              THEN excluded.current_period_end
            ELSE billing_subscriptions.current_period_end
          END,
          cancel_at_period_end = CASE
            WHEN billing_subscriptions.status IN ('canceled', 'incomplete_expired')
              THEN billing_subscriptions.cancel_at_period_end
            WHEN excluded.status IN ('canceled', 'incomplete_expired')
              THEN excluded.cancel_at_period_end
            WHEN billing_subscriptions.state_observed_at <= excluded.state_observed_at
              THEN excluded.cancel_at_period_end
            ELSE billing_subscriptions.cancel_at_period_end
          END,
          cancel_at = CASE
            WHEN billing_subscriptions.status IN ('canceled', 'incomplete_expired')
              THEN billing_subscriptions.cancel_at
            WHEN excluded.status IN ('canceled', 'incomplete_expired')
              THEN excluded.cancel_at
            WHEN billing_subscriptions.state_observed_at <= excluded.state_observed_at
              THEN excluded.cancel_at
            ELSE billing_subscriptions.cancel_at
          END,
          canceled_at = CASE
            WHEN billing_subscriptions.status IN ('canceled', 'incomplete_expired')
              THEN billing_subscriptions.canceled_at
            WHEN excluded.status IN ('canceled', 'incomplete_expired')
              THEN excluded.canceled_at
            WHEN billing_subscriptions.state_observed_at <= excluded.state_observed_at
              THEN excluded.canceled_at
            ELSE billing_subscriptions.canceled_at
          END,
          ended_at = CASE
            WHEN billing_subscriptions.status IN ('canceled', 'incomplete_expired')
              THEN billing_subscriptions.ended_at
            WHEN excluded.status IN ('canceled', 'incomplete_expired')
              THEN excluded.ended_at
            WHEN billing_subscriptions.state_observed_at <= excluded.state_observed_at
              THEN excluded.ended_at
            ELSE billing_subscriptions.ended_at
          END,
          trial_end = CASE
            WHEN billing_subscriptions.status IN ('canceled', 'incomplete_expired')
              THEN billing_subscriptions.trial_end
            WHEN excluded.status IN ('canceled', 'incomplete_expired')
              THEN excluded.trial_end
            WHEN billing_subscriptions.state_observed_at <= excluded.state_observed_at
              THEN excluded.trial_end
            ELSE billing_subscriptions.trial_end
          END,
          latest_invoice_id = CASE
            WHEN billing_subscriptions.status IN ('canceled', 'incomplete_expired')
              THEN billing_subscriptions.latest_invoice_id
            WHEN excluded.status IN ('canceled', 'incomplete_expired')
              THEN COALESCE(excluded.latest_invoice_id, billing_subscriptions.latest_invoice_id)
            WHEN billing_subscriptions.state_observed_at <= excluded.state_observed_at
              THEN COALESCE(excluded.latest_invoice_id, billing_subscriptions.latest_invoice_id)
            ELSE billing_subscriptions.latest_invoice_id
          END,
          updated_at = CASE
            WHEN billing_subscriptions.status IN ('canceled', 'incomplete_expired')
              THEN billing_subscriptions.updated_at
            WHEN excluded.status IN ('canceled', 'incomplete_expired')
              THEN excluded.updated_at
            WHEN billing_subscriptions.state_observed_at <= excluded.state_observed_at
              THEN excluded.updated_at
            ELSE billing_subscriptions.updated_at
          END
        WHERE
          billing_subscriptions.member_id = excluded.member_id
          AND billing_subscriptions.application_id IS excluded.application_id
          AND billing_subscriptions.stripe_account_id = excluded.stripe_account_id
          AND billing_subscriptions.livemode = excluded.livemode
          AND billing_subscriptions.stripe_customer_id = excluded.stripe_customer_id
          AND billing_subscriptions.service_type = excluded.service_type
        RETURNING ${billingSubscriptionColumns}
      `,
    )
    .bind(
      input.stripeSubscriptionId,
      input.memberId,
      input.applicationId,
      input.stripeAccountId,
      input.livemode ? 1 : 0,
      input.stripeCustomerId,
      input.serviceType,
      input.stripePriceId,
      input.status,
      input.stateObservedAt,
      input.currency,
      input.unitAmount,
      input.quantity,
      input.currentPeriodStart,
      input.currentPeriodEnd,
      input.cancelAtPeriodEnd ? 1 : 0,
      input.cancelAt,
      input.canceledAt,
      input.endedAt,
      input.trialEnd,
      input.latestInvoiceId,
      input.createdAt ?? now,
      now,
    )
    .first<RawBillingSubscription>();
  if (!row) throw new Error('Billing subscription was not saved.');
  return toBillingSubscription(row);
}

export async function getBillingSubscription(input: {
  stripeSubscriptionId: string;
  stripeAccountId: string;
  livemode: boolean;
}): Promise<BillingSubscription | null> {
  const row = await getD1()
    .prepare(
      `
        SELECT ${billingSubscriptionColumns}
        FROM billing_subscriptions
        WHERE
          stripe_subscription_id = ?
          AND stripe_account_id = ?
          AND livemode = ?
        LIMIT 1
      `,
    )
    .bind(
      input.stripeSubscriptionId,
      input.stripeAccountId,
      input.livemode ? 1 : 0,
    )
    .first<RawBillingSubscription>();
  return row ? toBillingSubscription(row) : null;
}

export async function getLatestBillingSubscription(input: {
  memberId: string;
  serviceType: ServiceType;
  stripeAccountId: string;
  livemode: boolean;
}): Promise<BillingSubscription | null> {
  const row = await getD1()
    .prepare(
      `
        SELECT ${billingSubscriptionColumns}
        FROM billing_subscriptions
        WHERE
          member_id = ?
          AND service_type = ?
          AND stripe_account_id = ?
          AND livemode = ?
        ORDER BY created_at DESC, updated_at DESC
        LIMIT 1
      `,
    )
    .bind(
      input.memberId,
      input.serviceType,
      input.stripeAccountId,
      input.livemode ? 1 : 0,
    )
    .first<RawBillingSubscription>();
  return row ? toBillingSubscription(row) : null;
}

export async function getActiveBillingSubscription(input: {
  memberId: string;
  serviceType: ServiceType;
  stripeAccountId: string;
  livemode: boolean;
}): Promise<BillingSubscription | null> {
  const row = await getD1()
    .prepare(
      `
        SELECT ${billingSubscriptionColumns}
        FROM billing_subscriptions
        WHERE
          member_id = ?
          AND service_type = ?
          AND stripe_account_id = ?
          AND livemode = ?
          AND status IN (
            'incomplete',
            'trialing',
            'active',
            'past_due',
            'unpaid',
            'paused'
          )
        ORDER BY updated_at DESC
        LIMIT 1
      `,
    )
    .bind(
      input.memberId,
      input.serviceType,
      input.stripeAccountId,
      input.livemode ? 1 : 0,
    )
    .first<RawBillingSubscription>();
  return row ? toBillingSubscription(row) : null;
}

export async function listMemberBillingSubscriptions(input: {
  memberId: string;
  stripeAccountId: string;
  livemode: boolean;
  limit?: number;
}): Promise<BillingSubscription[]> {
  const limit = Math.min(100, Math.max(1, Math.trunc(input.limit ?? 20)));
  const result = await getD1()
    .prepare(
      `
        SELECT ${billingSubscriptionColumns}
        FROM billing_subscriptions
        WHERE
          member_id = ?
          AND stripe_account_id = ?
          AND livemode = ?
        ORDER BY updated_at DESC
        LIMIT ?
      `,
    )
    .bind(input.memberId, input.stripeAccountId, input.livemode ? 1 : 0, limit)
    .all<RawBillingSubscription>();
  return result.results.map(toBillingSubscription);
}

function stripeObjectSyncLockKey(input: {
  stripeAccountId: string;
  livemode: boolean;
  stripeObjectType: StripeObjectSyncType;
  stripeObjectId: string;
}): string {
  return `v1:${JSON.stringify([
    input.stripeAccountId,
    input.livemode ? 1 : 0,
    input.stripeObjectType,
    input.stripeObjectId,
  ])}`;
}

export async function claimStripeObjectSyncLock(input: {
  stripeAccountId: string;
  livemode: boolean;
  stripeObjectType: StripeObjectSyncType;
  stripeObjectId: string;
  leaseOwner: string;
}): Promise<boolean> {
  const now = Date.now();
  const lockKey = stripeObjectSyncLockKey(input);
  const claimed = await getD1()
    .prepare(
      `
        INSERT INTO stripe_object_sync_locks (
          lock_key,
          stripe_object_type,
          stripe_object_id,
          stripe_account_id,
          livemode,
          lease_owner,
          lease_expires_at,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(
          stripe_account_id,
          livemode,
          stripe_object_type,
          stripe_object_id
        ) DO UPDATE SET
          lease_owner = excluded.lease_owner,
          lease_expires_at = excluded.lease_expires_at,
          updated_at = excluded.updated_at
        WHERE
          stripe_object_sync_locks.lock_key = excluded.lock_key
          AND stripe_object_sync_locks.lease_expires_at <= ?
        RETURNING lock_key
      `,
    )
    .bind(
      lockKey,
      input.stripeObjectType,
      input.stripeObjectId,
      input.stripeAccountId,
      input.livemode ? 1 : 0,
      input.leaseOwner,
      now + stripeObjectSyncLeaseMs,
      now,
      now,
      now,
    )
    .first<{ lock_key: string }>();
  return claimed?.lock_key === lockKey;
}

export async function releaseStripeObjectSyncLock(input: {
  stripeAccountId: string;
  livemode: boolean;
  stripeObjectType: StripeObjectSyncType;
  stripeObjectId: string;
  leaseOwner: string;
}): Promise<boolean> {
  const result = await getD1()
    .prepare(
      `
        DELETE FROM stripe_object_sync_locks
        WHERE
          lock_key = ?
          AND stripe_account_id = ?
          AND livemode = ?
          AND stripe_object_type = ?
          AND stripe_object_id = ?
          AND lease_owner = ?
      `,
    )
    .bind(
      stripeObjectSyncLockKey(input),
      input.stripeAccountId,
      input.livemode ? 1 : 0,
      input.stripeObjectType,
      input.stripeObjectId,
      input.leaseOwner,
    )
    .run();
  return Number(result.meta.changes ?? 0) > 0;
}

export async function claimStripeWebhookEvent(input: {
  stripeEventId: string;
  stripeAccountId: string;
  livemode: boolean;
  eventType: string;
  apiVersion: string | null;
  stripeCreatedAt: number;
}): Promise<StripeWebhookClaimResult> {
  const now = Date.now();
  const claimed = await getD1()
    .prepare(
      `
        INSERT INTO stripe_webhook_events (
          stripe_event_id,
          stripe_account_id,
          livemode,
          event_type,
          api_version,
          status,
          attempt_count,
          last_error,
          stripe_created_at,
          processing_started_at,
          processed_at,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, 'processing', 1, NULL, ?, ?, NULL, ?, ?)
        ON CONFLICT(stripe_event_id) DO UPDATE SET
          status = 'processing',
          attempt_count = stripe_webhook_events.attempt_count + 1,
          last_error = NULL,
          processing_started_at = excluded.processing_started_at,
          processed_at = NULL,
          updated_at = excluded.updated_at
        WHERE
          stripe_webhook_events.stripe_account_id = excluded.stripe_account_id
          AND stripe_webhook_events.livemode = excluded.livemode
          AND (
            stripe_webhook_events.status = 'failed'
            OR (
              stripe_webhook_events.status = 'processing'
              AND stripe_webhook_events.processing_started_at <= ?
            )
          )
        RETURNING attempt_count
      `,
    )
    .bind(
      input.stripeEventId,
      input.stripeAccountId,
      input.livemode ? 1 : 0,
      input.eventType,
      input.apiVersion,
      input.stripeCreatedAt,
      now,
      now,
      now,
      now - webhookProcessingLeaseMs,
    )
    .first<{ attempt_count: number }>();
  if (claimed) {
    return { status: 'claimed', attemptCount: claimed.attempt_count };
  }

  const existing = await getD1()
    .prepare(
      `
        SELECT status
        FROM stripe_webhook_events
        WHERE
          stripe_event_id = ?
          AND stripe_account_id = ?
          AND livemode = ?
        LIMIT 1
      `,
    )
    .bind(input.stripeEventId, input.stripeAccountId, input.livemode ? 1 : 0)
    .first<{ status: 'processing' | 'processed' | 'failed' }>();
  if (!existing) {
    throw new Error('Stripe webhook event ownership did not match.');
  }
  return existing.status === 'processed'
    ? { status: 'processed' }
    : { status: 'busy' };
}

export async function completeStripeWebhookEvent(input: {
  stripeEventId: string;
  stripeAccountId: string;
  livemode: boolean;
  attemptCount: number;
  succeeded: boolean;
  failureCode?: StripeWebhookFailureCode;
}): Promise<boolean> {
  const now = Date.now();
  const status = input.succeeded ? 'processed' : 'failed';
  const failureCode = input.succeeded
    ? null
    : (input.failureCode ?? 'handler_error');
  const result = await getD1()
    .prepare(
      `
        UPDATE stripe_webhook_events
        SET
          status = ?,
          last_error = ?,
          processed_at = ?,
          updated_at = ?
        WHERE
          stripe_event_id = ?
          AND stripe_account_id = ?
          AND livemode = ?
          AND status = 'processing'
          AND attempt_count = ?
      `,
    )
    .bind(
      status,
      failureCode,
      input.succeeded ? now : null,
      now,
      input.stripeEventId,
      input.stripeAccountId,
      input.livemode ? 1 : 0,
      input.attemptCount,
    )
    .run();
  return Number(result.meta.changes ?? 0) > 0;
}

export async function markStripeWebhookEventProcessed(
  input: Omit<
    Parameters<typeof completeStripeWebhookEvent>[0],
    'succeeded' | 'failureCode'
  >,
): Promise<boolean> {
  return completeStripeWebhookEvent({ ...input, succeeded: true });
}

export async function markStripeWebhookEventFailed(
  input: Omit<
    Parameters<typeof completeStripeWebhookEvent>[0],
    'succeeded' | 'failureCode'
  > & { failureCode: StripeWebhookFailureCode },
): Promise<boolean> {
  return completeStripeWebhookEvent({ ...input, succeeded: false });
}
