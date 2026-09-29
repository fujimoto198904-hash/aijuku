import Link from '@/components/site-link';
export function SiteFooter() {
  return (
    <footer className="as-footer">
      <span>© 2026 MON-ai</span>
      <Link href="/terms">利用規約</Link>
      <Link href="/privacy">プライバシー</Link>
      <Link href="/about">この作品について</Link>
    </footer>
  );
}
