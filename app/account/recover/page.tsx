import { redirect } from 'next/navigation';
import { getChatGPTUser, requireChatGPTUser } from '@/app/chatgpt-auth';
import { hasUsernameRecovery } from '@/db/username-registration';
import { AccountRecoveryForm } from '@/components/account-recovery-form';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import Link from '@/components/site-link';
import { registrationReturnTo } from '@/lib/username-registration';
import { canonicalMemberUrl, isVercelRuntime } from '@/lib/site-runtime';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'アカウントの復旧｜AIstock',
  robots: { index: false, follow: false },
};
type Props = { searchParams: Promise<{ mode?: string; return_to?: string }> };
export default function RecoveryPage(props: Props) {
  return <RecoveryContent {...props} />;
}
async function RecoveryContent({ searchParams }: Props) {
  const params = await searchParams,
    manage = params.mode === 'manage',
    returnTo = registrationReturnTo(params.return_to ?? '/mypage');
  if (isVercelRuntime())
    redirect(
      canonicalMemberUrl(
        '/account/recover?' +
          new URLSearchParams({
            return_to: returnTo,
            ...(manage ? { mode: 'manage' } : {}),
          }),
      ),
    );
  const user = manage
    ? await requireChatGPTUser('/account/recover?mode=manage')
    : await getChatGPTUser();
  const available =
    !manage ||
    (!!user && !user.isDemo && (await hasUsernameRecovery(user.userId)));
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-xl px-5 py-12">
        <section className="soft-panel border border-rule bg-white p-7 sm:p-9">
          <h1 className="text-2xl font-bold">
            {manage ? 'パスワードを忘れたときの備え' : 'パスワードを忘れたら'}
          </h1>
          <p className="mt-4 text-sm leading-7 text-quiet">
            {manage
              ? '設定は任意です。パスワードを忘れたときに使うコードを発行できます。'
              : 'ユーザー名と復旧コードがあれば、新しいパスワードに変えられます。'}
          </p>
          {available ? (
            <AccountRecoveryForm returnTo={returnTo} manage={manage} />
          ) : (
            <p className="mt-6 text-sm leading-7">
              このアカウントは復旧コードの対象外です。
              <Link href="mailto:info@mon-ai.jp" className="underline">
                info@mon-ai.jp
              </Link>{' '}
              へご相談ください。
            </p>
          )}
          {!manage && (
            <details className="mt-7 border-t border-rule pt-5 text-sm leading-7">
              <summary className="cursor-pointer">
                コードがない・メールで登録した方
              </summary>
              <p className="mt-3">
                ログインできる場合は、マイページの会員情報からコードを発行できます。メールで登録した方や、以前の初期パスワードが期限切れの方は、登録メールから{' '}
                <Link href="mailto:info@mon-ai.jp" className="underline">
                  info@mon-ai.jp
                </Link>{' '}
                へご相談ください。パスワードや復旧コードは送らないでください。
              </p>
              <p className="mt-3 text-quiet">
                メールなしで登録し、復旧コードを持っていない場合、パスワードを忘れるとアカウントを復旧できません。
              </p>
            </details>
          )}
          <Link
            href={
              manage
                ? '/mypage#account'
                : '/login?return_to=' + encodeURIComponent(returnTo)
            }
            className="mt-6 inline-block text-sm text-sapphire"
          >
            {manage ? 'マイページに戻る' : 'ログインに戻る'}
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
