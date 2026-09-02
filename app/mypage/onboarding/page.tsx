import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';

import { requireChatGPTUser } from '@/app/chatgpt-auth';
import { BrandMark } from '@/components/brand-mark';
import { MemberOnboardingForm } from '@/components/member-onboarding-form';
import Link from '@/components/site-link';
import { getMemberAuthAccount } from '@/db/member-auth';
import { getMemberOnboardingProfile } from '@/db/member-onboarding';
import { getMember, hasCurrentMembershipConsent } from '@/db/membership';
import { canonicalMemberUrl, isVercelRuntime } from '@/lib/site-runtime';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '無料会員登録｜藤本実学塾',
  robots: { index: false, follow: false },
};

type MembershipOnboardingPageProps = {
  searchParams: Promise<{
    mode?: string | string[];
    return_to?: string | string[];
  }>;
};

function safeMemberReturnTo(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return '/mypage';
  }
  try {
    const url = new URL(candidate, 'https://member.local');
    if (url.origin !== 'https://member.local' || url.pathname !== '/mypage') {
      return '/mypage';
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/mypage';
  }
}

export default async function MembershipOnboardingPage({
  searchParams,
}: MembershipOnboardingPageProps) {
  const params = await searchParams;
  const returnTo = safeMemberReturnTo(params.return_to);
  const requestedMode = Array.isArray(params.mode)
    ? params.mode[0]
    : params.mode;
  const requestedEdit = requestedMode === 'edit';
  const query = new URLSearchParams();
  if (requestedEdit) query.set('mode', 'edit');
  if (returnTo !== '/mypage') query.set('return_to', returnTo);
  const onboardingPath = `/mypage/onboarding${query.size ? `?${query}` : ''}`;
  if (isVercelRuntime()) {
    redirect(canonicalMemberUrl(onboardingPath));
  }
  return (
    <MembershipOnboardingContent
      onboardingPath={onboardingPath}
      requestedEdit={requestedEdit}
      returnTo={returnTo}
    />
  );
}

async function MembershipOnboardingContent({
  onboardingPath,
  requestedEdit,
  returnTo,
}: {
  onboardingPath: string;
  requestedEdit: boolean;
  returnTo: string;
}) {
  const user = await requireChatGPTUser(onboardingPath);
  const [member, authAccount, onboardingProfile] = await Promise.all([
    getMember(user.userId),
    getMemberAuthAccount(user.userId),
    getMemberOnboardingProfile(user.userId),
  ]);
  const hasCurrentConsent = Boolean(
    member?.status === 'active' && hasCurrentMembershipConsent(member),
  );
  const isProfileEdit = Boolean(
    requestedEdit && hasCurrentConsent && authAccount,
  );
  if (hasCurrentConsent && authAccount && !isProfileEdit) {
    redirect(returnTo);
  }
  if (member?.status === 'suspended') {
    return (
      <main
        id="main-content"
        className="grid min-h-screen place-items-center bg-paper px-5 text-ink"
      >
        <section className="soft-panel w-full max-w-xl border border-rule bg-paper-white p-8 sm:p-10">
          <ShieldAlert className="size-7 text-human-coral" aria-hidden="true" />
          <h1 className="mt-6 font-mincho text-3xl">
            この会員登録は停止中です
          </h1>
          <p className="mt-4 text-sm leading-7 text-quiet">
            画面上では再開できません。登録メールアドレスから info@mon-ai.jp
            へご連絡ください。電話受付は行いません。
          </p>
        </section>
      </main>
    );
  }
  if (member?.status === 'withdrawn') {
    return (
      <main
        id="main-content"
        className="grid min-h-screen place-items-center bg-paper px-5 text-ink"
      >
        <section className="soft-panel w-full max-w-xl border border-rule bg-paper-white p-8 sm:p-10">
          <ShieldAlert className="size-7 text-human-coral" aria-hidden="true" />
          <h1 className="mt-6 font-mincho text-3xl">
            この会員登録は退会済みです
          </h1>
          <p className="mt-4 text-sm leading-7 text-quiet">
            以前の同意だけで自動的に再登録することはありません。再登録を希望する場合は、登録メールアドレスから
            info@mon-ai.jp へご連絡ください。電話受付は行いません。
          </p>
        </section>
      </main>
    );
  }

  const isConsentUpdate = Boolean(member);
  const defaultName =
    member?.displayName || user.fullName?.trim() || user.email.split('@')[0];

  return (
    <main
      id="main-content"
      className="min-h-screen bg-paper px-5 py-10 text-ink sm:px-8 sm:py-16"
    >
      <div className="soft-panel soft-panel-clip mx-auto grid w-full max-w-[1120px] border border-rule bg-paper-white lg:grid-cols-[1.28fr_0.72fr]">
        <section className="p-7 sm:p-10 lg:p-12">
          <Link
            className="mb-9 flex items-center gap-3 font-mincho text-xl lg:hidden"
            href="/"
          >
            <BrandMark framed />
            藤本実学塾
          </Link>
          <h1 className="sr-only">
            {isProfileEdit ? '学び方の変更' : '無料会員登録'}
          </h1>
          <MemberOnboardingForm
            authMethod={user.authMethod}
            defaultName={defaultName}
            email={user.email}
            initialFirstOutcome={onboardingProfile?.firstOutcome ?? ''}
            initialInterestKeys={onboardingProfile?.interestKeys ?? []}
            initialLearningGoal={onboardingProfile?.learningGoal ?? ''}
            initialStartMode={onboardingProfile?.startMode ?? ''}
            isConsentUpdate={isConsentUpdate}
            isProfileEdit={isProfileEdit}
            needsInitialCredential={!authAccount}
            returnTo={returnTo}
          />
        </section>

        <section className="aurora-shell relative isolate overflow-hidden p-8 text-white sm:p-10 lg:flex lg:min-h-[820px] lg:flex-col lg:p-12">
          <div
            className="soft-grid pointer-events-none absolute inset-0 -z-10"
            aria-hidden="true"
          />
          <Link
            className="hidden items-center gap-3 font-mincho text-xl lg:flex"
            href="/"
          >
            <BrandMark framed />
            藤本実学塾
          </Link>
          <p className="mt-14 text-xs font-semibold tracking-[0.16em] text-future-mint lg:mt-auto">
            FREE MEMBERSHIP
          </p>
          <h2 className="text-soft-glow mt-5 font-mincho text-4xl leading-tight">
            {isProfileEdit
              ? '今の自分に、'
              : isConsentUpdate
                ? '学び方を、'
                : 'あなたらしい、'}
            <br />
            {isProfileEdit
              ? '学び方を合わせよう。'
              : isConsentUpdate
                ? '整えなおそう。'
                : '学びの入り口へ。'}
          </h2>
          <p className="mt-5 text-sm leading-7 text-white/65">
            一律の順番ではなく、あなたが作りたい変化から学び方を組み立てます。
          </p>
          <ol className="mt-10 grid gap-4 text-xs text-white/70 lg:mb-auto">
            <li className="border-t border-white/15 pt-4">
              01　マイページのお名前
            </li>
            <li className="border-t border-white/15 pt-4">
              02　AIで作りたい変化
            </li>
            <li className="border-t border-white/15 pt-4">
              03　自分に合う始め方
            </li>
            <li className="border-t border-white/15 pt-4">
              04　最初に作りたいもの
            </li>
            <li className="border-t border-white/15 pt-4">
              05　
              {isProfileEdit ? '変更内容を保存' : '安全なログインの準備'}
            </li>
          </ol>
        </section>
      </div>
    </main>
  );
}
