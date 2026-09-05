import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { canonicalPublicPath } from '@/lib/site-paths';
export const metadata = {
  title: 'プライバシーポリシー｜AIstock',
  alternates: { canonical: canonicalPublicPath('/privacy') },
};
const sections = [
  [
    '1. 取得する情報',
    '会員のメールアドレス、ニックネーム、規約への同意日時、パスワードの検証用データ、ログイン記録、学習記録、投稿・返信とその操作記録を取得します。Googleでログインする場合は、Googleが発行するユーザー識別子と確認済みメールアドレスを利用します。Googleカレンダーや連絡先へのアクセスは求めません。',
  ],
  [
    '2. 利用目的',
    '本人確認、ログイン、学習の続きや保存課題の表示、コミュニティの投稿・返信、問い合わせへの対応、不正利用の防止と障害対応のために使います。会員登録の確認メールをお送りする場合があります。',
  ],
  [
    '3. 公開される情報',
    'コミュニティでは投稿時に指定した名前、本文、添付画像、投稿日時、関連課題、運営回答の印が公開されます。質問だけでなく返信も公開です。登録メールやログインIDは公開データに含めません。画像の位置情報などは取り除きますが、本文や画像に含まれる個人情報は自分で確認してください。',
  ],
  [
    '4. 非公開の学習記録',
    '自分用ノートと保存した投稿の一覧は本人の画面だけに表示します。ノートをみんなに共有するには、別の公開操作が必要です。ブックマークや完了状況、未公開の成果物も本人の記録で、必要な権限を持つ運営が運用上必要な範囲で確認する場合があります。共有プロフィールには、本人が公開を選んだ記録だけを表示します。',
  ],
  [
    '5. 外部サービス',
    'サイトの配信とデータ保存にはSites・Cloudflare・Vercelを利用します。Googleログインと確認メールの配信を有効にした場合は、Googleとメール配信サービスに処理に必要な情報を渡します。メール配信にはResendを使用する構成です。パスワードの平文は保存しません。',
  ],
  [
    '6. 保存と削除',
    'ログインのためにCookieを使います。投稿の削除で通常の公開を停止しますが、不正利用の調査や復旧に必要な記録は残る場合があります。退会・訂正・削除の希望は、登録メールアドレスからお問い合わせください。本人確認後、法令や運用上必要な保存の有無を確認して対応します。',
  ],
  [
    '7. 運営者とお問い合わせ',
    'MON-ai／愛知県豊田市東梅坪町10-4-9／info@mon-ai.jp。情報の扱いに重要な変更がある場合は、サイトで案内します。',
  ],
] as const;
export default function Privacy() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-bold">プライバシーポリシー</h1>
        <p className="mt-4 text-sm text-quiet">最終改定日：2026年9月5日</p>
        <div className="mt-10 grid gap-8">
          {sections.map(([title, body]) => (
            <section key={title} className="border-t border-rule pt-6">
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="mt-4 leading-8 text-quiet">{body}</p>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
