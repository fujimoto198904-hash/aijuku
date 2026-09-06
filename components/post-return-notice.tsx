'use client';
import { useSyncExternalStore } from 'react';
import Link from '@/components/site-link';
import { missingPostReturnPath } from '@/lib/post-navigation';

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}
const currentHash = () => window.location.hash;
const serverHash = () => '';

/** Ranking can change after sign-in; do not silently lose an off-page post. */
export function PostReturnNotice({ visibleRefs }: { visibleRefs: string[] }) {
  const hash = useSyncExternalStore(subscribe, currentHash, serverHash);
  const path = missingPostReturnPath(hash, visibleRefs);
  return path ? (
    <aside className="as-post-return">
      <Link href={path}>戻り先の投稿を開く →</Link>
    </aside>
  ) : null;
}
