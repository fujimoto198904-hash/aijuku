import Stripe from 'stripe';

import {
  claimStripeObjectSyncLock,
  getBillingApplicationIdentity,
  getBillingCheckoutSession,
  getBillingCustomerByStripeCustomerId,
  getBillingSubscription,
  markBillingCustomerDeleted,
  releaseStripeObjectSyncLock,
  upsertBillingCheckoutSession,
  upsertBillingCustomer,
  upsertBillingSubscription,
  type BillingCheckoutMode,
  type BillingCheckoutStatus,
  type BillingPaymentStatus,
  type BillingSubscription,
  type BillingSubscriptionStatus,
  type BillingApplicationIdentity,
  type StripeObjectSyncType,
} from '@/db/billing';
import { serviceTypeValues, type ServiceType } from '@/db/membership';
import {
  createStripeCheckoutAttemptId,
  createStripeCheckoutIdempotencyKey,
  getStripeBillingPlan,
  stripeObjectId,
  type StripeBillingRuntime,
} from '@/lib/stripe-billing';

type BillingMetadata = {
  memberId: string;
  applicationId: string | null;
  serviceType: ServiceType;
  checkoutAttemptId: string;
  checkoutGeneration: string;
};

type BillingApplicationOwnership = {
  id: string | null;
  memberId: string;
  serviceType: ServiceType;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class StripeWebhookDataError extends Error {
  constructor() {
    super('invalid-stripe-webhook-data');
    this.name = 'StripeWebhookDataError';
  }
}

export class StripeWebhookObjectBusyError extends Error {
  constructor() {
    super('stripe-webhook-object-busy');
    this.name = 'StripeWebhookObjectBusyError';
  }
}

export async function processStripeBillingEvent(
  runtime: StripeBillingRuntime,
  event: Stripe.Event,
  leaseOwner: string,
): Promise<'handled' | 'ignored'> {
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
    case 'checkout.session.async_payment_failed':
    case 'checkout.session.expired': {
      return withStripeObjectSyncLock(
        runtime,
        leaseOwner,
        'checkout_session',
        event.data.object.id,
        async () => {
          const session = await runtime.client.checkout.sessions.retrieve(
            event.data.object.id,
          );
          const stateObservedAt = Date.now();
          return syncCheckoutSession(
            runtime,
            session,
            stateObservedAt,
            event.created,
            event.type,
            leaseOwner,
          );
        },
      );
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      return syncCurrentSubscription(runtime, event.data.object.id, leaseOwner);
    }
    case 'invoice.paid':
    case 'invoice.payment_failed':
      return syncSubscriptionFromInvoice(
        runtime,
        event.data.object,
        leaseOwner,
      );
    case 'customer.deleted': {
      return withStripeObjectSyncLock(
        runtime,
        leaseOwner,
        'customer',
        event.data.object.id,
        async () => {
          const customer = await runtime.client.customers.retrieve(
            event.data.object.id,
          );
          if (!customer.deleted) throw new StripeWebhookDataError();
          await markBillingCustomerDeleted({
            stripeCustomerId: customer.id,
            stripeAccountId: runtime.accountId,
            livemode: runtime.livemode,
          });
          return 'handled' as const;
        },
      );
    }
    default:
      return 'ignored';
  }
}

async function syncCheckoutSession(
  runtime: StripeBillingRuntime,
  session: Stripe.Checkout.Session,
  stateObservedAt: number,
  eventCreatedAt: number,
  eventType: Stripe.Event.Type,
  eventId: string,
): Promise<'handled' | 'ignored'> {
  const metadata = readBillingMetadata(session.metadata);
  if (!metadata) return 'ignored';
  const plan = getStripeBillingPlan(metadata.serviceType);
  const application =
    plan.checkoutMode === 'payment'
      ? await assertApplicationIdentity(metadata)
      : null;
  await assertCheckoutAttemptIdentity(runtime, metadata);
  const existingSession = await getBillingCheckoutSession({
    stripeCheckoutSessionId: session.id,
    stripeAccountId: runtime.accountId,
    livemode: runtime.livemode,
  });
  const effectiveStateObservedAt = Math.max(
    stateObservedAt,
    (existingSession?.stateObservedAt ?? 0) + 1,
  );
  const status = session.status;
  if (
    session.livemode !== runtime.livemode ||
    session.client_reference_id !== metadata.memberId ||
    session.mode !== plan.checkoutMode ||
    !isCheckoutStatus(status) ||
    !isPaymentStatus(session.payment_status) ||
    session.currency?.toLowerCase() !==
      (existingSession?.currency?.toLowerCase() ?? plan.currency) ||
    session.amount_total !== (existingSession?.amountTotal ?? plan.amount) ||
    (existingSession !== null &&
      (existingSession.memberId !== metadata.memberId ||
        existingSession.applicationId !== metadata.applicationId ||
        existingSession.serviceType !== metadata.serviceType ||
        existingSession.checkoutAttemptId !== metadata.checkoutAttemptId))
  ) {
    throw new StripeWebhookDataError();
  }

  const stripeCustomerId = stripeObjectId(session.customer);
  if (!stripeCustomerId) throw new StripeWebhookDataError();
  await syncCustomerOwnership(
    runtime,
    stripeCustomerId,
    metadata.memberId,
    eventId,
  );
  const paymentFailedAt =
    session.payment_status === 'paid' ||
    session.payment_status === 'no_payment_required'
      ? null
      : eventType === 'checkout.session.async_payment_failed' &&
          status === 'complete'
        ? eventCreatedAt * 1_000
        : (existingSession?.paymentFailedAt ?? null);

  await upsertBillingCheckoutSession({
    stripeCheckoutSessionId: session.id,
    memberId: metadata.memberId,
    applicationId: application?.id ?? null,
    checkoutAttemptId: metadata.checkoutAttemptId,
    stripeIdempotencyKey: await createStripeCheckoutIdempotencyKey({
      accountId: runtime.accountId,
      scope:
        plan.checkoutMode === 'subscription'
          ? `member:${metadata.memberId}:${metadata.serviceType}`
          : `application:${application!.id}`,
      generation: metadata.checkoutGeneration,
    }),
    stripeAccountId: runtime.accountId,
    livemode: runtime.livemode,
    serviceType: metadata.serviceType,
    mode: session.mode as BillingCheckoutMode,
    status,
    paymentStatus: session.payment_status,
    paymentFailedAt,
    stateObservedAt: effectiveStateObservedAt,
    currency: session.currency,
    amountTotal: session.amount_total,
    stripeCustomerId,
    stripePaymentIntentId: stripeObjectId(session.payment_intent),
    stripeSubscriptionId: stripeObjectId(session.subscription),
    checkoutUrl: session.url,
    expiresAt: session.expires_at ? session.expires_at * 1_000 : null,
    completedAt: status === 'complete' ? eventCreatedAt * 1_000 : null,
    createdAt: session.created * 1_000,
  });

  const subscriptionId = stripeObjectId(session.subscription);
  if (subscriptionId) {
    await syncCurrentSubscription(runtime, subscriptionId, eventId);
  }
  return 'handled';
}

async function syncSubscription(
  runtime: StripeBillingRuntime,
  subscription: Stripe.Subscription,
  stateObservedAt: number,
  eventId: string,
): Promise<'handled' | 'ignored'> {
  const metadata = readBillingMetadata(subscription.metadata);
  const existingSubscription = await getBillingSubscription({
    stripeSubscriptionId: subscription.id,
    stripeAccountId: runtime.accountId,
    livemode: runtime.livemode,
  });
  const effectiveStateObservedAt = Math.max(
    stateObservedAt,
    (existingSubscription?.stateObservedAt ?? 0) + 1,
  );
  if (!metadata && !existingSubscription) return 'ignored';

  if (metadata) await assertCheckoutAttemptIdentity(runtime, metadata);
  const application = existingSubscription
    ? await applicationIdentityFromExistingSubscription(
        existingSubscription,
        metadata,
      )
    : {
        id: null,
        memberId: metadata!.memberId,
        serviceType: metadata!.serviceType,
      };
  const serviceType =
    existingSubscription?.serviceType ?? metadata!.serviceType;
  const plan = getStripeBillingPlan(serviceType);
  if (
    plan.checkoutMode !== 'subscription' ||
    subscription.livemode !== runtime.livemode ||
    !isSubscriptionStatus(subscription.status)
  ) {
    throw new StripeWebhookDataError();
  }

  if (subscription.items.data.length !== 1) {
    throw new StripeWebhookDataError();
  }
  const item = subscription.items.data[0];
  const expectedPriceId = existingSubscription?.stripePriceId;
  const expectedCurrency = existingSubscription?.currency ?? plan.currency;
  const expectedUnitAmount = existingSubscription?.unitAmount ?? plan.amount;
  if (
    (expectedPriceId
      ? item.price.id !== expectedPriceId
      : item.price.lookup_key !== plan.lookupKey) ||
    item.price.currency.toLowerCase() !== expectedCurrency.toLowerCase() ||
    item.price.unit_amount !== expectedUnitAmount ||
    stripeObjectId(item.price.product) !== plan.productId ||
    item.price.type !== 'recurring' ||
    item.price.recurring?.interval !== plan.recurringInterval ||
    item.price.recurring.interval_count !== 1 ||
    item.price.recurring.usage_type !== 'licensed' ||
    item.quantity !== 1 ||
    subscription.currency.toLowerCase() !== item.price.currency.toLowerCase()
  ) {
    throw new StripeWebhookDataError();
  }
  const stripeCustomerId = stripeObjectId(subscription.customer);
  if (!stripeCustomerId) throw new StripeWebhookDataError();

  await syncCustomerOwnership(
    runtime,
    stripeCustomerId,
    application.memberId,
    eventId,
  );
  await upsertBillingSubscription({
    stripeSubscriptionId: subscription.id,
    memberId: application.memberId,
    applicationId: application.id,
    stripeAccountId: runtime.accountId,
    livemode: runtime.livemode,
    stripeCustomerId,
    serviceType,
    stripePriceId: item.price.id,
    status: subscription.status,
    stateObservedAt: effectiveStateObservedAt,
    currency: subscription.currency,
    unitAmount: item.price.unit_amount,
    quantity: item.quantity ?? null,
    currentPeriodStart: item.current_period_start * 1_000,
    currentPeriodEnd: item.current_period_end * 1_000,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    cancelAt: toMilliseconds(subscription.cancel_at),
    canceledAt: toMilliseconds(subscription.canceled_at),
    endedAt: toMilliseconds(subscription.ended_at),
    trialEnd: toMilliseconds(subscription.trial_end),
    latestInvoiceId: stripeObjectId(subscription.latest_invoice),
    createdAt: subscription.created * 1_000,
  });
  return 'handled';
}

async function syncSubscriptionFromInvoice(
  runtime: StripeBillingRuntime,
  invoice: Stripe.Invoice,
  eventId: string,
): Promise<'handled' | 'ignored'> {
  const details = invoice.parent?.subscription_details;
  if (!details) return 'ignored';
  const subscriptionId = stripeObjectId(details.subscription);
  if (!subscriptionId) throw new StripeWebhookDataError();
  return syncCurrentSubscription(runtime, subscriptionId, eventId);
}

async function syncCurrentSubscription(
  runtime: StripeBillingRuntime,
  stripeSubscriptionId: string,
  eventId: string,
): Promise<'handled' | 'ignored'> {
  return withStripeObjectSyncLock(
    runtime,
    eventId,
    'subscription',
    stripeSubscriptionId,
    async () => {
      const subscription = await runtime.client.subscriptions.retrieve(
        stripeSubscriptionId,
        { expand: ['items.data.price'] },
      );
      const stateObservedAt = Date.now();
      return syncSubscription(runtime, subscription, stateObservedAt, eventId);
    },
  );
}

async function assertApplicationIdentity(
  metadata: BillingMetadata,
): Promise<BillingApplicationIdentity> {
  if (!metadata.applicationId) throw new StripeWebhookDataError();
  const application = await getBillingApplicationIdentity({
    memberId: metadata.memberId,
    applicationId: metadata.applicationId,
  });
  if (!application || application.serviceType !== metadata.serviceType) {
    throw new StripeWebhookDataError();
  }
  return application;
}

async function applicationIdentityFromExistingSubscription(
  subscription: BillingSubscription,
  metadata: BillingMetadata | null,
): Promise<BillingApplicationOwnership> {
  if (
    metadata &&
    (metadata.memberId !== subscription.memberId ||
      metadata.serviceType !== subscription.serviceType ||
      metadata.applicationId !== null)
  ) {
    throw new StripeWebhookDataError();
  }
  const applicationId = subscription.applicationId ?? metadata?.applicationId;
  if (!applicationId) {
    return {
      id: null,
      memberId: subscription.memberId,
      serviceType: subscription.serviceType,
    };
  }
  const application = await getBillingApplicationIdentity({
    memberId: subscription.memberId,
    applicationId,
  });
  if (!application || application.serviceType !== subscription.serviceType) {
    throw new StripeWebhookDataError();
  }
  return application;
}

async function assertCheckoutAttemptIdentity(
  runtime: StripeBillingRuntime,
  metadata: BillingMetadata,
): Promise<void> {
  const scope =
    getStripeBillingPlan(metadata.serviceType).checkoutMode === 'subscription'
      ? `member:${metadata.memberId}:${metadata.serviceType}`
      : `application:${metadata.applicationId}`;
  const expectedAttemptId = await createStripeCheckoutAttemptId({
    accountId: runtime.accountId,
    scope,
    generation: metadata.checkoutGeneration,
  });
  if (metadata.checkoutAttemptId !== expectedAttemptId) {
    throw new StripeWebhookDataError();
  }
}

async function syncCustomerOwnership(
  runtime: StripeBillingRuntime,
  stripeCustomerId: string,
  memberId: string,
  eventId: string,
): Promise<void> {
  await withStripeObjectSyncLock(
    runtime,
    eventId,
    'customer',
    stripeCustomerId,
    async () => {
      const [customer, existingCustomer] = await Promise.all([
        runtime.client.customers.retrieve(stripeCustomerId),
        getBillingCustomerByStripeCustomerId({
          stripeCustomerId,
          stripeAccountId: runtime.accountId,
          livemode: runtime.livemode,
        }),
      ]);
      if (
        customer.deleted ||
        customer.livemode !== runtime.livemode ||
        customer.metadata.aijuku_billing_version !== 'v1' ||
        customer.metadata.member_id !== memberId ||
        (existingCustomer !== null && existingCustomer.memberId !== memberId)
      ) {
        throw new StripeWebhookDataError();
      }
      await upsertBillingCustomer({
        stripeCustomerId,
        memberId,
        stripeAccountId: runtime.accountId,
        livemode: runtime.livemode,
      });
    },
  );
}

async function withStripeObjectSyncLock<T>(
  runtime: StripeBillingRuntime,
  eventId: string,
  stripeObjectType: StripeObjectSyncType,
  stripeObjectId: string,
  work: () => Promise<T>,
): Promise<T> {
  const lock = {
    stripeAccountId: runtime.accountId,
    livemode: runtime.livemode,
    stripeObjectType,
    stripeObjectId,
    leaseOwner: eventId,
  };
  if (!(await claimStripeObjectSyncLock(lock))) {
    throw new StripeWebhookObjectBusyError();
  }

  try {
    return await work();
  } finally {
    try {
      const released = await releaseStripeObjectSyncLock(lock);
      if (!released) {
        console.error('Stripe object sync lock ownership was lost', {
          stripeObjectType,
        });
      }
    } catch {
      console.error('Stripe object sync lock release failed', {
        stripeObjectType,
      });
    }
  }
}

function readBillingMetadata(
  metadata: Stripe.Metadata | null,
): BillingMetadata | null {
  if (metadata?.aijuku_billing_version !== 'v1') return null;
  const memberId = metadata.member_id?.trim() ?? '';
  const rawApplicationId = metadata.application_id?.trim() ?? '';
  const rawServiceType = metadata.service_type?.trim() ?? '';
  const checkoutAttemptId = metadata.checkout_attempt_id?.trim() ?? '';
  const checkoutGeneration = metadata.checkout_generation?.trim() ?? '';
  if (
    !memberId ||
    memberId.length > 200 ||
    containsControlCharacter(memberId) ||
    !serviceTypeValues.includes(rawServiceType as ServiceType) ||
    !isCheckoutAttemptId(checkoutAttemptId) ||
    !isCheckoutGeneration(checkoutGeneration)
  ) {
    throw new StripeWebhookDataError();
  }
  const serviceType = rawServiceType as ServiceType;
  const applicationId = rawApplicationId || null;
  const checkoutMode = getStripeBillingPlan(serviceType).checkoutMode;
  if (
    (checkoutMode === 'payment' && !uuidPattern.test(applicationId ?? '')) ||
    (checkoutMode === 'subscription' && applicationId !== null)
  ) {
    throw new StripeWebhookDataError();
  }
  return {
    memberId,
    applicationId,
    serviceType,
    checkoutAttemptId,
    checkoutGeneration,
  };
}

function containsControlCharacter(value: string): boolean {
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint < 32 || codePoint === 127) return true;
  }
  return false;
}

function isCheckoutGeneration(value: string): boolean {
  return value === 'initial' || /^cs_test_[A-Za-z0-9_]{10,200}$/.test(value);
}

function isCheckoutAttemptId(value: string): boolean {
  return /^aijuku-attempt-v1:[0-9a-f]{64}$/.test(value);
}

function isCheckoutStatus(
  value: Stripe.Checkout.Session.Status | null,
): value is BillingCheckoutStatus {
  return value === 'open' || value === 'complete' || value === 'expired';
}

function isPaymentStatus(
  value: Stripe.Checkout.Session.PaymentStatus,
): value is BillingPaymentStatus {
  return (
    value === 'paid' || value === 'unpaid' || value === 'no_payment_required'
  );
}

function isSubscriptionStatus(
  value: Stripe.Subscription.Status,
): value is BillingSubscriptionStatus {
  return (
    value === 'incomplete' ||
    value === 'incomplete_expired' ||
    value === 'trialing' ||
    value === 'active' ||
    value === 'past_due' ||
    value === 'canceled' ||
    value === 'unpaid' ||
    value === 'paused'
  );
}

function toMilliseconds(value: number | null): number | null {
  return value === null ? null : value * 1_000;
}
