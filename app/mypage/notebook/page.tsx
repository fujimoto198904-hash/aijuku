import { redirect } from 'next/navigation';
import { requireChatGPTUser } from '@/app/chatgpt-auth';
import { getMember, hasCurrentMembershipConsent } from '@/db/membership';
import { listLearningNotes } from '@/db/learning-notes';
import { getCommunityPost } from '@/db/community';
import { findTextbookTask } from '@/lib/textbook-catalog';
import { findOfficialPost } from '@/lib/official-posts';
import { withSiteBasePath } from '@/lib/site-paths';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { LearningNotebook } from '@/components/learning-notebook';
import Link from '@/components/site-link';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: '自分用ノート｜AIstock',
  robots: { index: false, follow: false },
};
export default async function NotebookPage({
  searchParams,
}: {
  searchParams: Promise<{ task?: string; source?: string; page?: string }>;
}) {
  const params = await searchParams;
  const taskId = params.task ? findTextbookTask(params.task)?.id : undefined;
  const source =
    typeof params.source === 'string' && params.source.length <= 100
      ? (findOfficialPost(params.source)?.id ??
        (await getCommunityPost(params.source))?.id)
      : undefined;
  const user = await requireChatGPTUser(
    '/mypage/notebook?' +
      new URLSearchParams({
        ...(taskId ? { task: taskId } : {}),
        ...(source ? { source } : {}),
      }),
  );
  const member = await getMember(user.userId);
  if (!member || member.status !== 'active')
    redirect(withSiteBasePath('/login'));
  if (!user.isDemo && !hasCurrentMembershipConsent(member))
    redirect(withSiteBasePath('/mypage/onboarding'));
  const page = Math.max(
    1,
    Math.min(1000, Math.floor(Number(params.page) || 1)),
  );
  const { notes, hasMore } = await listLearningNotes(user.userId, page);
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="as-page as-detail">
        <Link href="/mypage" className="as-back">
          ← マイページ
        </Link>
        <header className="as-page-lead">
          <p className="as-eyebrow">自分用ノート · 非公開</p>
          <h1>昨日より、ひとつできた。</h1>
          <p>
            うまくいったことも、途中のことも。
            <br />
            自分の「やってみた」を残しておこう。
          </p>
        </header>
        {user.isDemo && (
          <p className="as-status">
            デモでは保存・削除・取り込みはできません。
          </p>
        )}
        <LearningNotebook
          notes={notes}
          taskId={taskId}
          sourceRef={source}
          readOnly={!!user.isDemo}
        />
        <nav className="as-action-row" aria-label="ノートのページ">
          {page > 1 && (
            <Link href={'/mypage/notebook?page=' + (page - 1)}>
              ← 新しい記録
            </Link>
          )}
          {hasMore && (
            <Link href={'/mypage/notebook?page=' + (page + 1)}>
              以前の記録 →
            </Link>
          )}
        </nav>
      </main>
      <SiteFooter />
    </>
  );
}
