import Link from '@/components/site-link';
export function SiteFooter() {
  return (
    <footer className="as-footer">
      <span>© 2026 MON-ai</span>
      <Link href="/terms">利用規約</Link>
      <Link href="/privacy">プライバシー</Link>
      <a href="mailto:info@mon-ai.jp">お問い合わせ</a>
    </footer>
  );
}
