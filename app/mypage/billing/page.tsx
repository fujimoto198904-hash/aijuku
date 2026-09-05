import type { Metadata } from 'next';
import { withSiteBasePath } from '@/lib/site-paths';
import { paidServicesEnabled } from '@/lib/site-features';
import { redirect } from 'next/navigation';
import { CreditCard, LogOut, ShieldCheck } from 'lucide-react';

import {
  chatGPTSignOutPath,
  requireBillingAuthenticatedUser,
} from '@/app/chatgpt-auth';
import { BillingPortalButton } from '@/components/billing-portal-button';
import { BrandMark } from '@/components/brand-mark';
import Link from '@/components/site-link';
import { getBillingCustomer } from '@/db/billing';
import { canonicalMemberUrl, isVercelRuntime } from '@/lib/site-runtime';
import { getStripeTestBillingDisplayConfig } from '@/lib/stripe-billing';
import { getAuthenticatedStaffPermissions } from '@/lib/staff-permissions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '支払い・契約管理｜AIstock',
  description:
    'Stripeサンドボックスの支払い・契約情報を確認する会員専用ページです。',
  robots: { index: false, follow: false },
};

const billingPath = '/mypage/billing';

const memberStatusLabels = {
  active: '登録中',
  suspended: '会員登録停止中',
  withdrawn: '退会済み',
} as const;

export default async function BillingManagementPage() {
  if (!paidServicesEnabled) redirect(withSiteBasePath('/mypage'));
  if (isVercelRuntime()) redirect(canonicalMemberUrl(billingPath));

  const user = await requireBillingAuthenticatedUser(billingPath);
  if (
    user.memberStatus === 'active' &&
    getAuthenticatedStaffPermissions(user).isOwner
  ) {
    redirect('/aikanri');
  }

  const billingConfig = getStripeTestBillingDisplayConfig();
  const billingCustomer = billingConfig
    ? await getBillingCustomer({
        memberId: user.userId,
        stripeAccountId: billingConfig.stripeAccountId,
        livemode: false,
      })
    : null;
  const canManageBilling = billingCustomer !== null;
  const inactive = user.memberStatus !== 'active';

  return (
    <main
      className="grid min-h-screen place-items-center bg-paper px-5 py-10 text-ink sm:px-8"
      id="main-content"
    >
      <section className="soft-panel w-full max-w-2xl border border-rule bg-paper-white p-7 sm:p-10">
        <Link className="flex items-center gap-3 font-mincho text-xl" href="/">
          <BrandMark framed />
          AIstock
        </Link>

        <div className="mt-10 flex items-start gap-4">
          <span className="soft-icon grid size-12 shrink-0 place-items-center bg-sapphire-soft text-sapphire">
            <CreditCard className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-sapphire">
              BILLING
            </p>
            <h1 className="mt-2 font-mincho text-3xl sm:text-4xl">
              支払い・契約管理
            </h1>
          </div>
        </div>

        <div className="soft-control mt-7 border border-rule bg-paper p-5 text-sm leading-7">
          <p className="flex items-center gap-2 font-semibold text-sapphire">
            <ShieldCheck className="size-4" aria-hidden="true" />
            {memberStatusLabels[user.memberStatus]}
          </p>
          <p className="mt-2 text-quiet">
            {inactive
              ? '会員登録の停止・退会後も、既存のStripeサンドボックスの支払い・契約管理画面を確認できます。この操作で会員登録は再開されません。実際の請求は発生しません。'
              : 'Stripeサンドボックスで作成済みの支払い・契約情報を確認できます。実際の請求は発生しません。'}
          </p>
        </div>

        {canManageBilling ? (
          <BillingPortalButton />
        ) : (
          <div className="mt-6 border-l-4 border-human-coral bg-human-coral-soft p-4 text-sm leading-7">
            <p className="font-semibold">
              管理できるStripe請求情報はまだありません
            </p>
            <p className="mt-1 text-quiet">
              お支払い済みの契約がある場合や、画面を開けない場合は、登録メールアドレスから
              info@mon-ai.jp へご連絡ください。
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule pt-6 text-xs font-semibold">
          {inactive ? (
            <Link
              className="text-sapphire underline underline-offset-4"
              href="mailto:info@mon-ai.jp"
            >
              運営本部へ連絡する
            </Link>
          ) : (
            <Link
              className="text-sapphire underline underline-offset-4"
              href="/mypage"
            >
              マイページへ戻る
            </Link>
          )}
          <Link
            className="inline-flex items-center gap-2 text-quiet hover:text-ink"
            href={chatGPTSignOutPath('/')}
            target="_top"
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            ログアウト
          </Link>
        </div>
      </section>
    </main>
  );
}
