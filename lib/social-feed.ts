import type { CommunityKind } from './community';

export function communityFeedPath(
  view: string,
  kind?: CommunityKind,
  page = 1,
) {
  return (
    '/community?' +
    new URLSearchParams({
      view,
      ...(kind && view !== 'textbook' ? { kind } : {}),
      ...(page > 1 ? { page: String(page) } : {}),
    })
  );
}

export function followingEmptyState({
  signedIn,
  publicProfile,
  kind,
  page = 1,
}: {
  signedIn: boolean;
  publicProfile: boolean;
  kind?: CommunityKind;
  page?: number;
}) {
  if (!signedIn)
    return {
      title: '好きな人の投稿を、ここに。',
      body: '無料登録・ログインして、気になる人をフォローしよう。',
      href:
        '/login?return_to=' +
        encodeURIComponent(communityFeedPath('following', kind)),
      label: '無料登録・ログイン',
    };
  if (page > 1)
    return {
      title: 'ここまでが、フォロー中の投稿です。',
      body: '最初のページから、もう一度見られます。',
      href: communityFeedPath('following', kind),
      label: '最初のページへ',
    };
  if (!publicProfile)
    return {
      title: 'まずは、みんなに見せるプロフィールを。',
      body: 'プロフィールを公開すると、気になる人をフォローできます。',
      href: '/mypage#account',
      label: 'プロフィールを整える',
    };
  if (kind)
    return {
      title: 'この種類の投稿は、まだありません。',
      body: '絞り込みを外して、ほかの投稿も見てみよう。',
      href: communityFeedPath('following'),
      label: '絞り込みを外す',
    };
  return {
    title: '気になる人を、見つけよう。',
    body: 'フォローした人の投稿が、ここに並びます。',
    href: '/discover?view=people',
    label: 'メンバーを探す',
  };
}

export function mixLearningFeed<T, U>(members: T[], guides: U[]) {
  const result: ({ type: 'member'; value: T } | { type: 'guide'; value: U })[] =
    [];
  let guideIndex = 0;
  members.forEach((value, i) => {
    result.push({ type: 'member', value });
    if (i % 3 === 1 && guides[guideIndex])
      result.push({ type: 'guide', value: guides[guideIndex++] });
  });
  while (guideIndex < guides.length)
    result.push({ type: 'guide', value: guides[guideIndex++] });
  return result;
}
