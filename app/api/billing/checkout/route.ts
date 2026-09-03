import Stripe from 'stripe';

import {
  getActiveBillingSubscription,
  getBillableApplication,
  getBillingCustomer,
  getLatestBillingCustomer,
  getLatestBillingCheckoutSessionForApplication,
  getLatestBillingCheckoutSessionForService,
  getReusableBillingCheckoutSession,
  getReusableBillingCheckoutSessionForService,
  markBillingCustomerDeleted,
  updateBillingCheckoutSession,
  upsertBillingCheckoutSession,
  upsertBillingCustomer,
  type BillingCheckoutSession,
} from '@/db/billing';
import {
  billingReturnUrls,
  createStripeCheckoutAttemptId,
  createStripeCheckoutIdempotencyKey,
  createStripeCustomerIdempotencyKey,
  createStripeIntegrationIdentifier,
  getStripeBillingPlan,
  getStripeBillingRuntime,
  isStripeHostedUrl,
  resolveVerifiedStripePrice,
  StripeBillingConfigurationError,
  StripeCatalogConfigurationError,
  stripeObjectId,
  verifyStripeBillingAccount,
  type StripeBillingRuntime,
} from '@/lib/stripe-billing';
import { findMemberServicePlan } from '@/lib/member-service-plans';
import { noStoreBillingJson, requireBillingMember } from '@/lib/stripe-route';

export const dynamic = 'force-dynamic';

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const auth = await requireBillingMember(request);
  if ('response' in auth) return auth.response;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const applicationId =
      typeof body.applicationId === 'string' ? body.applicationId.trim() : '';
    if (!uuidPattern.test(applicationId)) {
      return noStoreBillingJson(
        {
          error:
            'お支払い対象を確認できませんでした。画面を再読み込みしてください。',
        },
        { status: 400 },
      );
    }

    const runtime = getStripeBillingRuntime({ requireWebhookSecret: true });
    await verifyStripeBillingAccount(runtime);
    const application = await getBillableApplication({
      memberId: auth.user.userId,
      applicationId,
    });
    if (!application) {
      return noStoreBillingJson(
        { error: '日時確定後の受講申込からお支払いへ進んでください。' },
        { status: 409 },
      );
    }

    const plan = getStripeBillingPlan(application.serviceType);
    const offeredPlan = findMemberServicePlan(application.serviceType);
    if (!offeredPlan || application.offerPrice !== offeredPlan.price) {
      return noStoreBillingJson(
        {
          error:
            '申込時の金額と現在の料金が一致しないため、決済を開始できません。運営に確認してください。',
        },
        { status: 409 },
      );
    }
    const reusable =
      plan.checkoutMode === 'subscription'
        ? await getReusableBillingCheckoutSessionForService({
            memberId: auth.user.userId,
            serviceType: application.serviceType,
            stripeAccountId: runtime.accountId,
            livemode: runtime.livemode,
          })
        : await getReusableBillingCheckoutSession({
            memberId: auth.user.userId,
            applicationId: application.id,
            stripeAccountId: runtime.accountId,
            livemode: runtime.livemode,
          });
    const reusedResponse = reusable
      ? await resolveReusableCheckout(runtime, reusable)
      : null;
    if (reusedResponse) return reusedResponse;

    let previousSession = reusable;
    if (plan.checkoutMode === 'subscription') {
      if (!previousSession) {
        previousSession = await getLatestBillingCheckoutSessionForService({
          memberId: auth.user.userId,
          serviceType: application.serviceType,
          stripeAccountId: runtime.accountId,
          livemode: runtime.livemode,
        });
      }
    } else if (!previousSession) {
      previousSession = await getLatestBillingCheckoutSessionForApplication({
        memberId: auth.user.userId,
        applicationId: application.id,
        stripeAccountId: runtime.accountId,
        livemode: runtime.livemode,
      });
    }
    const checkoutGeneration =
      previousSession?.stripeCheckoutSessionId ?? 'initial';
    const checkoutScope =
      plan.checkoutMode === 'subscription'
        ? `member:${auth.user.userId}:${application.serviceType}`
        : `application:${application.id}`;
    const attemptInput = {
      accountId: runtime.accountId,
      scope: checkoutScope,
      generation: checkoutGeneration,
    };
    const [checkoutAttemptId, stripeIdempotencyKey] = await Promise.all([
      createStripeCheckoutAttemptId(attemptInput),
      createStripeCheckoutIdempotencyKey(attemptInput),
    ]);

    if (plan.checkoutMode === 'subscription') {
      if (previousSession?.stripeSubscriptionId) {
        const previousSubscription =
          await runtime.client.subscriptions.retrieve(
            previousSession.stripeSubscriptionId,
          );
        if (
          previousSubscription.livemode ||
          previousSubscription.metadata.aijuku_billing_version !== 'v1' ||
          previousSubscription.metadata.member_id !== auth.user.userId ||
          previousSubscription.metadata.service_type !== application.serviceType
        ) {
          throw new StripeCatalogConfigurationError(
            '月額受講のStripe契約と会員情報が一致しません。',
          );
        }
        if (isBlockingSubscriptionStatus(previousSubscription.status)) {
          return noStoreBillingJson(
            {
              error:
                'すでに月額受講の契約があります。確認・変更は請求管理から行ってください。',
            },
            { status: 409 },
          );
        }
      } else if (
        previousSession &&
        (previousSession.paymentStatus === 'paid' ||
          previousSession.paymentStatus === 'no_payment_required')
      ) {
        return noStoreBillingJson(
          { error: '月額受講の契約状態を確認中です。' },
          { status: 409 },
        );
      }
      const currentSubscription = await getActiveBillingSubscription({
        memberId: auth.user.userId,
        serviceType: application.serviceType,
        stripeAccountId: runtime.accountId,
        livemode: runtime.livemode,
      });
      if (currentSubscription) {
        return noStoreBillingJson(
          {
            error:
              'すでに月額受講の契約があります。確認・変更は請求管理から行ってください。',
          },
          { status: 409 },
        );
      }
    }

    const price = await resolveVerifiedStripePrice(runtime.client, plan);
    let customerId: string | null = null;
    const billingCustomer = await getLatestBillingCustomer({
      memberId: auth.user.userId,
      stripeAccountId: runtime.accountId,
      livemode: runtime.livemode,
    });
    const customerGeneration = billingCustomer?.stripeCustomerId ?? 'initial';
    if (billingCustomer && billingCustomer.deletedAt === null) {
      const customer = await runtime.client.customers.retrieve(
        billingCustomer.stripeCustomerId,
      );
      if (customer.deleted) {
        await markBillingCustomerDeleted({
          stripeCustomerId: billingCustomer.stripeCustomerId,
          stripeAccountId: runtime.accountId,
          livemode: runtime.livemode,
        });
      } else if (
        customer.livemode ||
        customer.metadata.aijuku_billing_version !== 'v1' ||
        customer.metadata.member_id !== auth.user.userId
      ) {
        throw new StripeCatalogConfigurationError(
          'Stripe顧客と会員情報の対応を確認できません。',
        );
      } else {
        customerId = customer.id;
      }
    }
    if (!customerId) {
      const customer = await runtime.client.customers.create(
        {
          metadata: {
            aijuku_billing_version: 'v1',
            member_id: auth.user.userId,
          },
        },
        {
          idempotencyKey: await createStripeCustomerIdempotencyKey({
            accountId: runtime.accountId,
            memberId: auth.user.userId,
            generation: customerGeneration,
          }),
        },
      );
      if (
        customer.livemode ||
        customer.metadata.aijuku_billing_version !== 'v1' ||
        customer.metadata.member_id !== auth.user.userId
      ) {
        throw new StripeCatalogConfigurationError(
          'Stripe顧客と会員情報の対応を確認できません。',
        );
      }
      customerId = customer.id;
      await upsertBillingCustomer({
        stripeCustomerId: customer.id,
        memberId: auth.user.userId,
        stripeAccountId: runtime.accountId,
        livemode: runtime.livemode,
      });
    }

    const metadata: Stripe.MetadataParam = {
      aijuku_billing_version: 'v1',
      member_id: auth.user.userId,
      service_type: application.serviceType,
      checkout_attempt_id: checkoutAttemptId,
      checkout_generation: checkoutGeneration,
    };
    if (plan.checkoutMode === 'payment') {
      metadata.application_id = application.id;
    }
    const urls = billingReturnUrls(request);
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: plan.checkoutMode,
      line_items: [{ price: price.id, quantity: 1 }],
      automatic_tax: { enabled: false },
      client_reference_id: auth.user.userId,
      integration_identifier:
        createStripeIntegrationIdentifier(stripeIdempotencyKey),
      locale: 'ja',
      metadata,
      success_url: urls.successUrl,
      cancel_url: urls.cancelUrl,
    };
    params.customer = customerId;
    if (plan.checkoutMode === 'payment') {
      params.payment_intent_data = { metadata };
    } else {
      params.subscription_data = { metadata };
    }

    const session = await runtime.client.checkout.sessions.create(params, {
      idempotencyKey: stripeIdempotencyKey,
    });
    const stateObservedAt = currentStripeObservationTimestamp();
    if (
      session.livemode ||
      session.mode !== plan.checkoutMode ||
      session.status !== 'open' ||
      !isBillingPaymentStatus(session.payment_status) ||
      session.client_reference_id !== auth.user.userId ||
      (session.metadata?.application_id ?? null) !==
        (plan.checkoutMode === 'payment' ? application.id : null) ||
      session.metadata?.checkout_attempt_id !== checkoutAttemptId ||
      session.metadata?.aijuku_billing_version !== 'v1' ||
      session.currency?.toLowerCase() !== plan.currency ||
      session.amount_total !== plan.amount ||
      stripeObjectId(session.customer) !== customerId ||
      !isStripeHostedUrl(session.url, 'checkout')
    ) {
      throw new StripeCatalogConfigurationError(
        'Stripeから安全な決済画面を取得できませんでした。',
      );
    }

    await upsertBillingCheckoutSession({
      stripeCheckoutSessionId: session.id,
      memberId: auth.user.userId,
      applicationId: plan.checkoutMode === 'payment' ? application.id : null,
      checkoutAttemptId,
      stripeIdempotencyKey,
      stripeAccountId: runtime.accountId,
      livemode: runtime.livemode,
      serviceType: application.serviceType,
      mode: plan.checkoutMode,
      status: 'open',
      paymentStatus: session.payment_status,
      paymentFailedAt: null,
      stateObservedAt,
      currency: session.currency,
      amountTotal: session.amount_total,
      stripeCustomerId: stripeObjectId(session.customer),
      stripePaymentIntentId: stripeObjectId(session.payment_intent),
      stripeSubscriptionId: stripeObjectId(session.subscription),
      checkoutUrl: session.url,
      expiresAt: session.expires_at ? session.expires_at * 1_000 : null,
      completedAt: null,
      createdAt: session.created * 1_000,
    });

    return noStoreBillingJson(
      { url: session.url, sessionId: session.id },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof StripeBillingConfigurationError ||
      error instanceof StripeCatalogConfigurationError
    ) {
      return noStoreBillingJson(
        { error: error.publicMessage },
        { status: 503 },
      );
    }
    const stripeFailure = error instanceof Stripe.errors.StripeError;
    console.error('Stripe Checkout creation failed', {
      kind: stripeFailure ? 'stripe' : 'internal',
    });
    return noStoreBillingJson(
      {
        error: stripeFailure
          ? 'Stripeの決済画面を開けませんでした。時間をおいて再度お試しください。'
          : '決済準備を完了できませんでした。',
      },
      { status: stripeFailure ? 502 : 500 },
    );
  }
}

async function resolveReusableCheckout(
  runtime: StripeBillingRuntime,
  sessionRecord: BillingCheckoutSession,
): Promise<Response | null> {
  if (
    sessionRecord.paymentStatus === 'paid' ||
    sessionRecord.paymentStatus === 'no_payment_required'
  ) {
    return noStoreBillingJson(
      { error: 'この受講申込のお支払いは完了しています。' },
      { status: 409 },
    );
  }
  if (sessionRecord.status === 'complete') {
    return noStoreBillingJson(
      {
        error:
          'お支払い結果を確認中です。しばらく待ってから再読み込みしてください。',
      },
      { status: 409 },
    );
  }

  const session = await refreshCheckoutSessionRecord(runtime, sessionRecord);

  if (
    session.payment_status === 'paid' ||
    session.payment_status === 'no_payment_required'
  ) {
    return noStoreBillingJson(
      { error: 'この受講申込のお支払いは完了しています。' },
      { status: 409 },
    );
  }
  if (session.status === 'complete') {
    return noStoreBillingJson(
      {
        error:
          'お支払い結果を確認中です。しばらく待ってから再読み込みしてください。',
      },
      { status: 409 },
    );
  }
  if (session.status === 'open' && isStripeHostedUrl(session.url, 'checkout')) {
    return noStoreBillingJson({
      url: session.url,
      sessionId: session.id,
      reused: true,
    });
  }
  return null;
}

async function refreshCheckoutSessionRecord(
  runtime: StripeBillingRuntime,
  sessionRecord: BillingCheckoutSession,
): Promise<
  Stripe.Checkout.Session & { status: 'open' | 'complete' | 'expired' }
> {
  const session = await runtime.client.checkout.sessions.retrieve(
    sessionRecord.stripeCheckoutSessionId,
  );
  const stateObservedAt = currentStripeObservationTimestamp();
  const plan = getStripeBillingPlan(sessionRecord.serviceType);
  if (
    session.livemode ||
    session.client_reference_id !== sessionRecord.memberId ||
    (session.metadata?.application_id ?? null) !==
      sessionRecord.applicationId ||
    session.metadata?.service_type !== sessionRecord.serviceType ||
    session.metadata?.checkout_attempt_id !== sessionRecord.checkoutAttemptId ||
    session.metadata?.aijuku_billing_version !== 'v1' ||
    session.mode !== sessionRecord.mode ||
    session.currency?.toLowerCase() !==
      (sessionRecord.currency?.toLowerCase() ?? plan.currency) ||
    session.amount_total !== (sessionRecord.amountTotal ?? plan.amount) ||
    !isBillingCheckoutStatus(session.status) ||
    !isBillingPaymentStatus(session.payment_status) ||
    (session.status === 'open' && !isStripeHostedUrl(session.url, 'checkout'))
  ) {
    throw new StripeCatalogConfigurationError(
      '保存済みの決済画面が申込内容と一致しません。',
    );
  }

  const stripeCustomerId = stripeObjectId(session.customer);
  if (!stripeCustomerId) {
    throw new StripeCatalogConfigurationError(
      '保存済みの決済画面に顧客情報がありません。',
    );
  }
  await verifyCheckoutCustomerOwnership(
    runtime,
    stripeCustomerId,
    sessionRecord.memberId,
  );

  await updateBillingCheckoutSession({
    stripeCheckoutSessionId: session.id,
    stripeAccountId: runtime.accountId,
    livemode: runtime.livemode,
    status: session.status,
    paymentStatus: session.payment_status,
    paymentFailedAt:
      session.payment_status === 'paid' ||
      session.payment_status === 'no_payment_required'
        ? null
        : sessionRecord.paymentFailedAt,
    stateObservedAt,
    currency: session.currency,
    amountTotal: session.amount_total,
    stripeCustomerId,
    stripePaymentIntentId: stripeObjectId(session.payment_intent),
    stripeSubscriptionId: stripeObjectId(session.subscription),
    checkoutUrl: session.url,
    expiresAt: session.expires_at ? session.expires_at * 1_000 : null,
    completedAt: session.status === 'complete' ? Date.now() : null,
  });
  return session as Stripe.Checkout.Session & {
    status: 'open' | 'complete' | 'expired';
  };
}

async function verifyCheckoutCustomerOwnership(
  runtime: StripeBillingRuntime,
  stripeCustomerId: string,
  memberId: string,
): Promise<void> {
  const [customer, existingMapping] = await Promise.all([
    runtime.client.customers.retrieve(stripeCustomerId),
    getBillingCustomer({
      memberId,
      stripeAccountId: runtime.accountId,
      livemode: runtime.livemode,
    }),
  ]);
  if (
    customer.deleted ||
    customer.livemode ||
    customer.metadata.aijuku_billing_version !== 'v1' ||
    customer.metadata.member_id !== memberId ||
    (existingMapping !== null &&
      existingMapping.stripeCustomerId !== stripeCustomerId)
  ) {
    throw new StripeCatalogConfigurationError(
      'Stripe顧客と会員情報の対応を確認できません。',
    );
  }
  await upsertBillingCustomer({
    stripeCustomerId,
    memberId,
    stripeAccountId: runtime.accountId,
    livemode: runtime.livemode,
  });
}

function isBillingCheckoutStatus(
  value: Stripe.Checkout.Session.Status | null,
): value is 'open' | 'complete' | 'expired' {
  return value === 'open' || value === 'complete' || value === 'expired';
}

function isBillingPaymentStatus(
  value: Stripe.Checkout.Session.PaymentStatus,
): value is 'paid' | 'unpaid' | 'no_payment_required' {
  return (
    value === 'paid' || value === 'unpaid' || value === 'no_payment_required'
  );
}

function isBlockingSubscriptionStatus(
  value: Stripe.Subscription.Status,
): boolean {
  return (
    value === 'incomplete' ||
    value === 'trialing' ||
    value === 'active' ||
    value === 'past_due' ||
    value === 'unpaid' ||
    value === 'paused'
  );
}

function currentStripeObservationTimestamp(): number {
  return Date.now();
}
