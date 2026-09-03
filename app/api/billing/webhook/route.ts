import Stripe from 'stripe';

import {
  claimStripeWebhookEvent,
  completeStripeWebhookEvent,
} from '@/db/billing';
import {
  getStripeBillingRuntime,
  stripeApiVersion,
  StripeBillingConfigurationError,
  verifyStripeBillingAccount,
} from '@/lib/stripe-billing';
import { noStoreBillingJson } from '@/lib/stripe-route';
import {
  processStripeBillingEvent,
  StripeWebhookDataError,
  StripeWebhookObjectBusyError,
} from '@/lib/stripe-webhook';

export const dynamic = 'force-dynamic';

const maximumWebhookBytes = 1_000_000;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(contentLength) && contentLength > maximumWebhookBytes) {
    return noStoreBillingJson(
      { error: 'Webhook payload is too large.' },
      { status: 413 },
    );
  }

  let runtime;
  try {
    runtime = getStripeBillingRuntime({ requireWebhookSecret: true });
  } catch (error) {
    if (error instanceof StripeBillingConfigurationError) {
      return noStoreBillingJson(
        { error: 'Stripe Webhook is not configured.' },
        { status: 503 },
      );
    }
    throw error;
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return noStoreBillingJson(
      { error: 'Stripe signature is required.' },
      { status: 400 },
    );
  }
  const payload = await request.text();
  if (new TextEncoder().encode(payload).byteLength > maximumWebhookBytes) {
    return noStoreBillingJson(
      { error: 'Webhook payload is too large.' },
      { status: 413 },
    );
  }

  let event: Stripe.Event;
  try {
    event = await runtime.client.webhooks.constructEventAsync(
      payload,
      signature,
      runtime.webhookSecret!,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch {
    return noStoreBillingJson(
      { error: 'Stripe signature is invalid.' },
      { status: 400 },
    );
  }
  if (
    event.api_version !== stripeApiVersion ||
    event.livemode ||
    (event.account && event.account !== runtime.accountId)
  ) {
    return noStoreBillingJson(
      { error: 'Stripe event mode or account does not match.' },
      { status: 400 },
    );
  }

  try {
    await verifyStripeBillingAccount(runtime);
  } catch {
    return noStoreBillingJson(
      { error: 'Stripe account could not be verified.' },
      { status: 503 },
    );
  }

  let claim: Awaited<ReturnType<typeof claimStripeWebhookEvent>>;
  try {
    claim = await claimStripeWebhookEvent({
      stripeEventId: event.id,
      stripeAccountId: runtime.accountId,
      livemode: runtime.livemode,
      eventType: event.type,
      apiVersion: event.api_version,
      stripeCreatedAt: event.created * 1_000,
    });
  } catch {
    console.error('Stripe webhook claim failed', { eventId: event.id });
    return noStoreBillingJson(
      { error: 'Webhook event could not be claimed.' },
      { status: 500 },
    );
  }

  if (claim.status === 'processed') {
    return noStoreBillingJson({ received: true, duplicate: true });
  }
  if (claim.status === 'busy') {
    return noStoreBillingJson(
      { error: 'Webhook event is already being processed.' },
      { status: 409, headers: { 'Retry-After': '30' } },
    );
  }

  try {
    const result = await processStripeBillingEvent(
      runtime,
      event,
      `${event.id}:${claim.attemptCount}`,
    );
    const completed = await completeStripeWebhookEvent({
      stripeEventId: event.id,
      stripeAccountId: runtime.accountId,
      livemode: runtime.livemode,
      attemptCount: claim.attemptCount,
      succeeded: true,
    });
    if (!completed) throw new Error('Webhook claim was lost.');
    return noStoreBillingJson({
      received: true,
      handled: result === 'handled',
    });
  } catch (error) {
    const objectBusy = error instanceof StripeWebhookObjectBusyError;
    const failureCode =
      error instanceof StripeWebhookDataError
        ? 'invalid_event_data'
        : 'handler_error';
    try {
      await completeStripeWebhookEvent({
        stripeEventId: event.id,
        stripeAccountId: runtime.accountId,
        livemode: runtime.livemode,
        attemptCount: claim.attemptCount,
        succeeded: false,
        failureCode,
      });
    } catch {
      console.error('Stripe webhook failure state could not be saved', {
        eventId: event.id,
      });
    }
    console.error('Stripe webhook processing failed', {
      eventId: event.id,
      eventType: event.type,
      kind: objectBusy ? 'object_busy' : failureCode,
    });
    return noStoreBillingJson(
      {
        error: objectBusy
          ? 'Stripe object is already being synchronized.'
          : 'Webhook event processing failed.',
      },
      objectBusy
        ? { status: 409, headers: { 'Retry-After': '30' } }
        : { status: 500 },
    );
  }
}
