export const communityKinds = ['question', 'tip', 'learning'] as const;
export type CommunityKind = (typeof communityKinds)[number];
export const communityLabels: Record<CommunityKind, string> = {
  question: '質問',
  tip: '便利だった使い方',
  learning: '勉強の記録',
};
export function isCommunityKind(value: unknown): value is CommunityKind {
  return communityKinds.includes(value as CommunityKind);
}
export function publicNickname(
  value: unknown,
  allowStaffName = false,
): string | null {
  if (typeof value !== 'string') return null;
  const name = value.trim();
  const normalized = name
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\p{Dash_Punctuation}]/gu, '');
  if (!allowStaffName && /monai|aistock|運営|管理者/.test(normalized))
    return null;
  return name.length >= 1 &&
    name.length <= 30 &&
    !/[@\r\n\u0000-\u001f]/.test(name)
    ? name
    : null;
}
