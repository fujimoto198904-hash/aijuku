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
