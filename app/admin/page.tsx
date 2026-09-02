import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LogOut, ShieldAlert, ShieldCheck } from 'lucide-react';

import { chatGPTSignOutPath, requireChatGPTUser } from '@/app/chatgpt-auth';
import { AdminApplicationAuditLog } from '@/components/admin-application-audit-log';
import { AdminApplicationQueue } from '@/components/admin-application-queue';
import { AdminSkillReview } from '@/components/admin-skill-review';
import { BrandMark } from '@/components/brand-mark';
import Link from '@/components/site-link';
import {
  applicationStatusValues,
  countAdminApplications,
  listAdminApplications,
  listAdminApplicationStatusEvents,
  type ApplicationStatus,
} from '@/db/membership';
import {
  countPendingAdminSkillEvidence,
  listAdminSkillEvidence,
} from '@/db/skill-passport';
import { canonicalMemberUrl, isVercelRuntime } from '@/lib/site-runtime';
import { getStaffPermissions, hasStaffAccess } from '@/lib/staff-permissions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '運営管理｜藤本実学塾',
  robots: { index: false, follow: false },
};

const applicationPageSize = 30;

function firstSearchValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (isVercelRuntime()) redirect(canonicalMemberUrl('/admin'));
  const user = await requireChatGPTUser('/admin');
  const permissions = getStaffPermissions(user.email);

  if (!hasStaffAccess(permissions)) {
    return (
      <main
        id="main-content"
        className="grid min-h-screen place-items-center bg-paper px-5 text-ink"
      >
        <section className="soft-work-surface w-full max-w-xl border border-rule bg-paper-white p-8 sm:p-10">
          <div className="flex items-center justify-between gap-4">
            <BrandMark className="size-11" />
            <ShieldAlert
              className="size-7 text-human-coral"
              aria-hidden="true"
            />
          </div>
          <h1 className="mt-6 font-mincho text-3xl">管理権限がありません</h1>
          <p className="mt-4 text-sm leading-7 text-quiet">
            ログインは確認できましたが、このアカウントには運営・講師のいずれの権限もありません。
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              className="soft-control border border-sapphire px-5 py-3 text-xs font-semibold text-sapphire"
              href="/mypage"
            >
              マイページへ
            </Link>
            <Link
              className="inline-flex items-center gap-2 px-5 py-3 text-xs text-quiet"
              href={chatGPTSignOutPath('/')}
              target="_top"
            >
              <LogOut className="size-4" aria-hidden="true" /> ログアウト
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const params = (await searchParams) ?? {};
  const statusValue = firstSearchValue(params.status) as ApplicationStatus;
  const statusFilter = applicationStatusValues.includes(statusValue)
    ? statusValue
    : undefined;
  const requestedPage = Math.max(
    1,
    Number.parseInt(firstSearchValue(params.page), 10) || 1,
  );

  const [
    applicationTotal,
    skillEvidence,
    pendingEvidenceTotal,
    applicationHistory,
  ] = await Promise.all([
    permissions.canManageApplications
      ? countAdminApplications(statusFilter)
      : Promise.resolve(0),
    permissions.canReviewEvidence
      ? listAdminSkillEvidence({
          includeMemberEmail: permissions.isOwner,
          includeResolved: permissions.isOwner,
        })
      : Promise.resolve([]),
    permissions.canReviewEvidence
      ? countPendingAdminSkillEvidence()
      : Promise.resolve(0),
    permissions.isOwner
      ? listAdminApplicationStatusEvents()
      : Promise.resolve([]),
  ]);
  const pageCount = Math.max(
    1,
    Math.ceil(applicationTotal / applicationPageSize),
  );
  const page = Math.min(requestedPage, pageCount);
  const applications = permissions.canManageApplications
    ? await listAdminApplications({
        status: statusFilter,
        limit: applicationPageSize,
        offset: (page - 1) * applicationPageSize,
      })
    : [];
  const evidenceForClient = skillEvidence.map((item) => ({
    ...item,
    memberId: item.memberId === user.userId ? user.userId : '',
  }));
  return (
    <main id="main-content" className="min-h-screen bg-paper text-ink">
      <header className="border-b border-white/15 bg-brand-dark px-5 py-6 text-white sm:px-8">
        <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-4">
          <Link className="flex items-center gap-3" href="/">
            <BrandMark framed />
            <span>
              <span className="block font-mincho text-lg">藤本実学塾</span>
              <span className="block text-[10px] tracking-[0.12em] text-white/55">
                SECURE OPERATIONS
              </span>
            </span>
          </Link>
          <Link
            className="inline-flex items-center gap-2 text-xs text-white/60 hover:text-white"
            href={chatGPTSignOutPath('/')}
            target="_top"
          >
            <LogOut className="size-4" aria-hidden="true" /> ログアウト
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1320px] px-5 py-10 sm:px-8 lg:py-14">
        <section className="soft-panel mb-12 border border-sapphire/25 bg-sapphire-soft p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold text-sapphire">
                <ShieldCheck className="size-4" aria-hidden="true" />
                権限を分けた運営画面
              </p>
              <h1 className="mt-3 font-mincho text-3xl">今日の運営キュー</h1>
              <p className="mt-3 text-sm leading-7 text-quiet">
                オーナーだけが申込者情報を扱い、講師確認は必要な成果物と確認記録だけを表示します。
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {permissions.isOwner ? (
                <span className="soft-badge bg-brand-dark px-3 py-2 text-white">
                  オーナー
                </span>
              ) : null}
              {permissions.canReviewEvidence ? (
                <span className="soft-badge bg-future-mint-soft px-3 py-2">
                  講師確認
                </span>
              ) : null}
            </div>
          </div>
        </section>

        {permissions.canManageApplications ? (
          <AdminApplicationQueue
            applications={applications}
            key={`${statusFilter ?? 'all'}-${page}`}
            page={page}
            pageCount={pageCount}
            statusFilter={statusFilter}
            totalCount={applicationTotal}
          />
        ) : (
          <section className="soft-panel border border-rule bg-paper-white p-7 text-sm leading-7 text-quiet">
            申込者の氏名・メール・希望内容はオーナー限定です。このアカウントには表示していません。
          </section>
        )}

        {permissions.isOwner ? (
          <AdminApplicationAuditLog events={applicationHistory} />
        ) : null}

        <AdminSkillReview
          canReviewEvidence={permissions.canReviewEvidence}
          currentUserId={user.userId}
          evidence={evidenceForClient}
          pendingEvidenceTotal={pendingEvidenceTotal}
        />

        <p className="mt-8 text-xs leading-6 text-quiet">
          予約枠の自動在庫、メール自動送信、決済はまだ接続していません。確定内容はマイページへ表示し、必要な連絡は登録メールで行います。電話受付は行いません。
        </p>
      </div>
    </main>
  );
}
