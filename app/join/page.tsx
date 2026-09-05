import { redirect } from 'next/navigation';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getMember } from '@/db/membership';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { RegistrationForm } from '@/components/registration-form';
import { registrationAvailability } from '@/lib/registration-config';
import { getRegistrationTicket } from '@/db/registration';
import { withSiteBasePath } from '@/lib/site-paths';
import { isVercelRuntime, canonicalMemberUrl } from '@/lib/site-runtime';
import Link from '@/components/site-link';
import { UsernameRegistrationForm } from '@/components/username-registration-form';
import { registrationReturnTo } from '@/lib/username-registration';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: '無料で参加する｜AIstock',
  robots: { index: false, follow: false },
};
type JoinProps = {
  searchParams: Promise<{
    ticket?: string;
    error?: string;
    return_to?: string;
  }>;
};
export default function JoinPage(props: JoinProps) {
  return <JoinContent {...props} />;
}
async function JoinContent({ searchParams }: JoinProps) {
  const params = await searchParams;
  const returnTo = registrationReturnTo(params.return_to ?? '/mypage');
  const query = new URLSearchParams({ return_to: returnTo });
  if (params.ticket) query.set('ticket', params.ticket);
  if (params.error) query.set('error', params.error);
  if (isVercelRuntime()) redirect(canonicalMemberUrl('/join?' + query));
  const user = await getChatGPTUser();
  if (user && (await getMember(user.userId)))
    redirect(withSiteBasePath(returnTo));
  const availability = registrationAvailability();
  const ticket = params.ticket
    ? await getRegistrationTicket(params.ticket)
    : null;
  return (
    <>
      <SiteHeader />
      <main
        id="main-content"
        className="mx-auto grid max-w-5xl items-start gap-8 px-5 py-10 lg:grid-cols-[0.8fr_1fr] lg:gap-16 lg:py-16"
      >
        <section className="lg:pt-10">
          <p className="font-semibold text-sapphire">無料会員登録</p>
          <h1 className="mt-4 text-3xl font-bold leading-snug sm:text-4xl">
            AIstockに参加する
          </h1>
          <p className="mt-4 leading-7 text-quiet">
            ユーザー名とパスワードだけで、無料で始められます。
          </p>
          <ul className="mt-6 hidden gap-3 text-sm lg:grid">
            <li>✓ 気になる投稿や教材を保存</li>
            <li>✓ 試したことを記録・シェア</li>
            <li>✓ わからないことを、みんなに質問</li>
          </ul>
          <Link
            href="/textbook"
            className="mt-5 inline-block text-sm text-sapphire"
          >
            登録せずに教科書を読む →
          </Link>
        </section>
        <section className="soft-panel border border-rule bg-white p-6 sm:p-8">
          {ticket && (
            <h2 className="mb-6 text-2xl font-bold">あと少しで参加できます</h2>
          )}
          {params.ticket && !ticket && (
            <p role="alert" className="mb-5 text-red-700">
              確認リンクが使用済みか、有効期限が切れています。もう一度お手続きください。
            </p>
          )}
          {params.error === 'google-email' && (
            <p role="alert" className="mb-5 leading-7">
              このGoogleアカウントは、メールでの追加確認が必要です。メール登録からお進みください。
            </p>
          )}
          {ticket ? (
            <RegistrationForm
              ticket={params.ticket}
              email={ticket.email}
              returnTo={returnTo}
            />
          ) : (
            <div className="grid gap-5">
              {availability.username ? (
                <UsernameRegistrationForm returnTo={returnTo} />
              ) : (
                <p className="rounded-2xl bg-paper p-5 text-sm leading-7 text-quiet">
                  ユーザー名での登録は準備中です。教科書は登録なしで読めます。
                </p>
              )}
              {(availability.google || availability.email) && (
                <details className="border-t border-rule pt-5">
                  <summary className="min-h-11 cursor-pointer text-sm font-semibold text-quiet">
                    ほかの方法で登録する
                  </summary>
                  <div className="mt-2 grid gap-5">
                    {availability.google && (
                      <a
                        href={withSiteBasePath(
                          '/api/auth/google?return_to=' +
                            encodeURIComponent(returnTo),
                        )}
                        target="_top"
                        className="soft-outline-button flex min-h-12 items-center justify-center border border-rule font-semibold"
                      >
                        Googleで続ける
                      </a>
                    )}
                    {availability.email && (
                      <RegistrationForm returnTo={returnTo} />
                    )}
                  </div>
                </details>
              )}
            </div>
          )}
          <p className="mt-7 text-sm">
            登録済みの方は{' '}
            <Link
              href={'/login?return_to=' + encodeURIComponent(returnTo)}
              className="font-semibold text-sapphire"
            >
              ログイン
            </Link>
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
