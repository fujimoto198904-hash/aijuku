export const canonicalSitesUrl =
  'https://toyota-ai-school.mondism.chatgpt.site';

export const canonicalPublicMemberUrl = 'https://mon-ai.jp/aistock';

export function isVercelRuntime(): boolean {
  return process.env.VERCEL === '1';
}

export function canonicalMemberUrl(pathname: string): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${canonicalPublicMemberUrl}${path}`;
}
