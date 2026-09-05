import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { canonicalMemberUrl, isVercelRuntime } from '@/lib/site-runtime';
import { withSiteBasePath } from '@/lib/site-paths';

export const metadata: Metadata = {
  title: '運営管理｜AIstock',
  robots: { index: false, follow: false },
};

export default function AiKanriPage() {
  if (isVercelRuntime()) redirect(canonicalMemberUrl('/aikanri'));
  redirect(withSiteBasePath('/admin'));
}
