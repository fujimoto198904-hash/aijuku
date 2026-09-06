import { requireChatGPTUser } from '@/app/chatgpt-auth';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { CommunityForm } from '@/components/community-form';
import { isCommunityKind, publicNickname } from '@/lib/community';
import { findTextbookTask } from '@/lib/textbook-catalog';
import { getAuthenticatedStaffPermissions } from '@/lib/staff-permissions';
import Link from '@/components/site-link';
import { redirect } from 'next/navigation';
import { getMember, hasCurrentMembershipConsent } from '@/db/membership';
import { getLearningNote } from '@/db/learning-notes';
import { withSiteBasePath } from '@/lib/site-paths';
import { isVercelRuntime, canonicalMemberUrl } from '@/lib/site-runtime';
import { ownSocialProfile } from '@/db/social';
import { profileUserId } from '@/lib/public-profile';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: '投稿する｜AIstock',
  robots: { index: false, follow: false },
};
export default async function NewPost({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; task?: string; note?: string }>;
}) {
  const params = await searchParams;
  const noteId =
    typeof params.note === 'string' && params.note.length <= 100
      ? params.note
      : undefined;
  const task = params.task ? findTextbookTask(params.task) : undefined;
  const kind = isCommunityKind(params.kind) ? params.kind : 'learning';
  const returnTo =
    '/community/new?' +
    new URLSearchParams({
      kind,
      ...(task ? { task: task.id } : {}),
      ...(noteId ? { note: noteId } : {}),
    });
  if (isVercelRuntime()) redirect(canonicalMemberUrl(returnTo));
  return (
    <NewPostContent
      kind={kind}
      taskId={task?.id}
      returnTo={returnTo}
      noteId={noteId}
    />
  );
}
async function NewPostContent({
  kind,
  taskId,
  returnTo,
  noteId,
}: {
  noteId?: string;
  kind: 'question' | 'tip' | 'learning';
  taskId?: string;
  returnTo: string;
}) {
  const user = await requireChatGPTUser(returnTo);
  if (!user.isDemo) {
    const member = await getMember(user.userId);
    if (!member)
      redirect(
        withSiteBasePath('/join?return_to=' + encodeURIComponent(returnTo)),
      );
    if (member.status !== 'active' || !hasCurrentMembershipConsent(member))
      redirect(
        withSiteBasePath(
          '/mypage/onboarding?return_to=' + encodeURIComponent(returnTo),
        ),
      );
  }
  const note =
    noteId && !user.isDemo ? await getLearningNote(user.userId, noteId) : null;
  const profile = await ownSocialProfile(user.userId);
  const relatedTask = findTextbookTask(taskId ?? note?.taskId ?? '');
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="as-compose-page">
        <header className="as-compose-page-heading">
          <Link href="/community" className="text-sapphire">
            ← 戻る
          </Link>
          <h1>新しい投稿</h1>
        </header>
        {user.isDemo ? (
          <p>
            デモは閲覧専用です。投稿するにはご自身のアカウントでログインしてください。
          </p>
        ) : noteId && !note ? (
          <p role="alert">
            このノートは見つかりません。
            <Link href="/mypage/notebook" className="text-sapphire underline">
              自分のノートへ戻る
            </Link>
          </p>
        ) : (
          <CommunityForm
            defaultNickname={
              publicNickname(profile?.name ?? user.displayName) ?? ''
            }
            publicProfile={
              profile?.isPublic
                ? { name: profile.name, handle: profileUserId(profile) }
                : null
            }
            initialKind={kind}
            initialBody={
              note
                ? [note.body, note.humanFix].filter(Boolean).join('\n\n')
                : ''
            }
            taskId={relatedTask?.id}
            taskTitle={relatedTask?.title}
            isStaff={getAuthenticatedStaffPermissions(user).isOwner}
          />
        )}
      </main>
      <SiteFooter />
    </>
  );
}
