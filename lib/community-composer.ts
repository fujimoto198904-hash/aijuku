/** 本文から既存の一覧・検索用見出しを作る。利用者に二度入力させない。 */
export function communityPostTitle(body: string): string {
  return (
    body
      .trim()
      .split(/\r?\n/)
      .find((line) => line.trim())
      ?.trim() ?? ''
  )
    .slice(0, 100)
    .replace(/[\uD800-\uDBFF]$/, '');
}

export function communityHttpUrl(value: string): string | null {
  if (!value.trim() || value.length > 2000) return null;
  try {
    const url = new URL(value.trim());
    return ['https:', 'http:'].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function communityPostBody(body: string, link: string): string {
  const text = body.trim();
  if (!link.trim()) return text;
  const url = communityHttpUrl(link);
  if (!url)
    throw new Error(
      'リンクは https:// または http:// から始まるURLを入れてください。',
    );
  return [text, url].filter(Boolean).join('\n\n');
}
export const communityPostMaxLength = 1000;
export const communityReplyMaxLength = 5000;
export const communityFeedPreviewLength = 140;

/** 絵文字のサロゲートペアを途中で切らない。URLも本文の文字数に含める。 */
export function communityTextLength(value: string): number {
  return Array.from(value).length;
}
export function communityFeedPreview(body: string): string {
  const preview = Array.from(body)
    .slice(0, communityFeedPreviewLength)
    .join('');
  // A short post with many line breaks must not occupy the entire feed.
  const breaks = [...preview.matchAll(/\r\n|\r|\n/g)];
  return breaks.length >= 4 ? preview.slice(0, breaks[3].index) : preview;
}
