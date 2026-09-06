import { KeyRound, SlidersHorizontal } from 'lucide-react';
import Link from '@/components/site-link';

export function MemberProfileSettings({
  email,
  loginId,
  hasRecovery = false,
  readOnly = false,
}: {
  displayName?: string;
  email: string;
  loginId?: string;
  hasRecovery?: boolean;
  readOnly?: boolean;
}) {
  return (
    <section id="member-account" className="as-panel">
      <h2>ログインとアカウント</h2>
      <div className="my-4 text-sm leading-7 text-quiet">
        {loginId && <p className="break-all">ログインID：{loginId}</p>}
        <p className="break-all">登録メール：{email || '未登録'}</p>
      </div>
      {!readOnly && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            className="as-secondary"
            href="/account/password?mode=manage&return_to=%2Fmypage%23account"
          >
            <KeyRound size={18} aria-hidden="true" />
            パスワードを変更
          </Link>
          <Link
            className="as-secondary"
            href="/mypage/onboarding?mode=edit&return_to=%2Fmypage%23account"
          >
            <SlidersHorizontal size={18} aria-hidden="true" />
            参加情報・利用規約
          </Link>
        </div>
      )}
      {hasRecovery && !readOnly && (
        <Link href="/account/recover?mode=manage" className="as-text-button">
          パスワードを忘れたときの備え（任意）
        </Link>
      )}
      {readOnly && <p className="as-private-note">デモは閲覧専用です。</p>}
    </section>
  );
}
