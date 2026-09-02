import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { canonicalMemberUrl, isVercelRuntime } from '@/lib/site-runtime';

export const metadata: Metadata = {
  title: '運営管理｜藤本実学塾',
  robots: { index: false, follow: false },
};

export default function AiKanriPage() {
  if (isVercelRuntime()) redirect(canonicalMemberUrl('/aikanri'));
  redirect('/admin');
}
