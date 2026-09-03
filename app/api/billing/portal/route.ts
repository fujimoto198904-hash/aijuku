import Stripe from 'stripe';

import { getBillingCustomer, markBillingCustomerDeleted } from '@/db/billing';
import {
  billingReturnUrls,
  getStripeBillingRuntime,
  isStripeHostedUrl,
  StripeBillingConfigurationError,
  StripeCatalogConfigurationError,
  verifyStripeBillingAccount,
} from '@/lib/stripe-billing';
import {
  noStoreBillingJson,
  requireBillingPortalMember,
} from '@/lib/stripe-route';
import { withSiteBasePath } from '@/lib/site-paths';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const auth = await requireBillingPortalMember(request);
  if ('response' in auth) return auth.response;

  try {
    const runtime = getStripeBillingRuntime({ requireWebhookSecret: true });
    await verifyStripeBillingAccount(runtime);
    const billingCustomer = await getBillingCustomer({
      memberId: auth.user.userId,
      stripeAccountId: runtime.accountId,
      livemode: runtime.livemode,
    });
    if (!billingCustomer) {
      return noStoreBillingJson(
        { error: '管理できるStripe請求情報はまだありません。' },
        { status: 404 },
      );
    }

    const customer = await runtime.client.customers.retrieve(
      billingCustomer.stripeCustomerId,
    );
    if (customer.deleted) {
      await markBillingCustomerDeleted({
        stripeCustomerId: customer.id,
        stripeAccountId: runtime.accountId,
        livemode: runtime.livemode,
      });
      return noStoreBillingJson(
        { error: '管理できるStripe請求情報はまだありません。' },
        { status: 404 },
      );
    }
    if (
      customer.livemode ||
      customer.metadata.aijuku_billing_version !== 'v1' ||
      customer.metadata.member_id !== auth.user.userId
    ) {
      throw new StripeCatalogConfigurationError(
        'Stripe顧客と会員情報の対応を確認できません。',
      );
    }

    const urls = billingReturnUrls(request);
    const portalReturnUrl =
      auth.member.status === 'active'
        ? urls.portalReturnUrl
        : new URL(
            withSiteBasePath('/mypage/billing'),
            urls.portalReturnUrl,
          ).toString();
    const portal = await runtime.client.billingPortal.sessions.create({
      customer: customer.id,
      return_url: portalReturnUrl,
    });
    if (!isStripeHostedUrl(portal.url, 'portal')) {
      throw new StripeCatalogConfigurationError(
        'Stripeの請求管理画面を安全に開けませんでした。',
      );
    }
    return noStoreBillingJson({ url: portal.url });
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
    console.error('Stripe Billing Portal creation failed', {
      kind: stripeFailure ? 'stripe' : 'internal',
    });
    return noStoreBillingJson(
      {
        error: stripeFailure
          ? 'Stripeの請求管理画面を開けませんでした。時間をおいて再度お試しください。'
          : '請求管理の準備を完了できませんでした。',
      },
      { status: stripeFailure ? 502 : 500 },
    );
  }
}
