import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { canonicalPublicPath } from '@/lib/site-paths';
export const metadata = {
  title: 'プライバシーポリシー｜AIstock',
  alternates: { canonical: canonicalPublicPath('/privacy') },
};
const sections = [
  [
    '1. 現在の公開状態',
    'このサイトは制作実績として閲覧用に公開しています。会員登録、ログイン、投稿、DM、問い合わせなどの新たな受付は終了しています。配信に伴うアクセス情報は、サイトの保守・不正利用の防止に使用する場合があります。',
  ],
  [
    '2. 既存データ',
    '運用中に保存された会員情報、学習記録、投稿、同意記録などは、この変更によって削除していません。従来の公開範囲を維持し、不正利用の防止・障害対応に必要な範囲で管理します。',
  ],
  [
    '3. 公開される情報',
    '公開済みの投稿・返信・画像、公開を選んだプロフィールやフォロー関係を表示します。登録メールや非公開ログイン名を新たに公開することはありません。',
  ],
  [
    '4. 非公開の学習記録',
    '自分用ノート、保存一覧、未公開の成果物、DM、会員情報は非公開のまま保管します。ポートフォリオへの変更によって公開範囲を広げることはありません。会員向け画面は利用を停止しています。',
  ],
  [
    '5. 外部サービス',
    'サイトの配信とデータ保存にはSites・Cloudflare・Vercelを利用します。Googleログインや新規登録の処理は停止しています。教科書内の外部サービスを利用する場合は、その提供元の条件を確認してください。',
  ],
  [
    '6. 端末内の保存',
    '教科書のチェック状態など、一部の閲覧補助機能は端末内に保存します。ブラウザーの設定から削除できます。過去のログイン情報が端末に残っていても、新たな投稿・送信はできません。',
  ],
  [
    '7. 管理者',
    'MON-ai。このサイトでお問い合わせは受け付けていません。情報の扱いに重要な変更がある場合は、サイトで案内します。',
  ],
  [
    'プロフィール・フォロー・いいね・DM',
    '公開済みの記録は従来の公開条件を維持します。非公開プロフィール、DM、通報内容は一般公開しません。新しい情報の送信・編集はできません。',
  ],
] as const;
export default function Privacy() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-bold">プライバシーポリシー</h1>
        <p className="mt-4 text-sm text-quiet">最終改定日：2026年9月29日</p>
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
