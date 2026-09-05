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
export const dynamic = 'force-dynamic';
export const metadata = {
  title: '無料で参加する｜AIstock',
  robots: { index: false, follow: false },
};
export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ ticket?: string; error?: string }>;
}) {
  const params = await searchParams;
  if (isVercelRuntime())
    redirect(
      canonicalMemberUrl(
        '/join' +
          (params.ticket ? '?ticket=' + encodeURIComponent(params.ticket) : ''),
      ),
    );
  const user = await getChatGPTUser();
  if (user && (await getMember(user.userId)))
    redirect(withSiteBasePath('/mypage'));
  const availability = registrationAvailability();
  const ticket = params.ticket
    ? await getRegistrationTicket(params.ticket)
    : null;
  return (
    <>
      <SiteHeader />
      <main
        id="main-content"
        className="mx-auto grid max-w-5xl gap-10 px-5 py-14 md:grid-cols-2"
      >
        <section>
          <p className="font-semibold text-sapphire">無料会員登録</p>
          <h1 className="mt-4 text-4xl font-bold leading-snug">
            ひとりの疑問を、
            <br />
            みんなのヒントに。
          </h1>
          <p className="mt-6 leading-8 text-quiet">
            質問も、回答も、学習の記録も無料です。ニックネームで気軽に参加してください。
          </p>
          <ul className="mt-6 grid gap-3">
            <li>✓ 気になる課題を保存</li>
            <li>✓ できた課題を記録</li>
            <li>✓ みんなに質問・回答</li>
            <li>✓ 便利な使い方や勉強の記録を共有</li>
          </ul>
          <p className="mt-8 text-sm leading-7 text-quiet">
            Web教科書・コラムは、登録しなくても読めます。
          </p>
          <Link
            href="/textbook"
            className="mt-3 inline-block font-semibold text-sapphire"
          >
            教科書を見てみる →
          </Link>
        </section>
        <section className="soft-panel border border-rule bg-white p-6 sm:p-8">
          <h2 className="mb-6 text-2xl font-bold">
            {ticket ? 'あと少しで参加できます' : 'AIstockに参加する'}
          </h2>
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
            <RegistrationForm ticket={params.ticket} email={ticket.email} />
          ) : (
            <div className="grid gap-5">
              {availability.google && (
                <a
                  href={withSiteBasePath('/api/auth/google')}
                  target="_top"
                  className="soft-outline-button flex min-h-12 items-center justify-center border border-rule font-semibold"
                >
                  Googleで続ける
                </a>
              )}
              {availability.email ? (
                <RegistrationForm />
              ) : (
                <p className="rounded-2xl bg-paper p-5 leading-7 text-quiet">
                  メール登録は現在準備中です。教科書とコラムは、今すぐ無料で読めます。
                </p>
              )}
            </div>
          )}
          <p className="mt-7 text-sm">
            登録済みの方は{' '}
            <Link href="/login" className="font-semibold text-sapphire">
              ログイン
            </Link>
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
