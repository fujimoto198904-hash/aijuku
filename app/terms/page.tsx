import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { canonicalPublicPath } from '@/lib/site-paths';
export const metadata = {
  title: '利用規約｜AIstock',
  alternates: { canonical: canonicalPublicPath('/terms') },
};
const sections = [
  [
    '1. サービスについて',
    'AIstockはMON-aiが運営する無料のAI学習コミュニティです。Web教科書とコラムの閲覧、会員登録、質問・回答・投稿、学習記録に料金はかかりません。ChatGPTなど外部サービスの利用料金は、各提供元の条件によります。',
  ],
  [
    '2. 会員登録とログイン',
    '利用可能な登録方法は登録画面に表示します。メール登録ではメールアドレスを確認し、Google登録ではGoogleの本人確認を行います。登録時にニックネーム、8文字以上のパスワード、規約への同意が必要です。ログイン情報を他人と共有しないでください。既存のアカウントと学習記録は引き継いで利用できます。',
  ],
  [
    '3. 投稿の公開範囲',
    '公開した質問・回答・使い方・勉強の記録・画像は誰でも閲覧できます。自分用ノートや保存した投稿の一覧は非公開です。共有するときは、内容と公開用の名前を確認します。メールアドレスやログインIDを自動で公開することはありません。個人情報、顧客情報、社外秘、他人の権利を侵害する内容を投稿しないでください。',
  ],
  [
    '4. 投稿と回答',
    '自分の経験や考えとして、相手を尊重して投稿してください。会員同士と運営が回答できますが、すべての質問への回答や回答時期を約束するものではありません。運営の投稿・回答には「MON-ai 運営」と表示します。誹謗中傷、なりすまし、迷惑な宣伝、不正アクセスを禁止します。',
  ],
  [
    '5. 削除・利用停止',
    '投稿者は自分の投稿や返信を削除して公開を停止できます。運営は、規約に反する投稿などを非公開にする場合があります。削除した投稿は通常の閲覧画面から見えなくなりますが、不正利用の調査・復旧のための記録が残る場合があります。',
  ],
  [
    '6. 教材と学習記録',
    '教材と投稿は学習を助けるためのものです。AIの出力や回答には誤りがあり得ます。仕事への利用、外部への送信・公開は自分で確認してください。「完了」は本人の学習記録です。保存済みの成果物や運営の確認記録は、公的資格や採用結果を保証するものではありません。',
  ],
  [
    '7. 権利と共有',
    '投稿や成果物の権利は投稿者等に帰属します。投稿者は、サービス内で表示・配信するために必要な範囲で運営に利用を許可します。公開した内容は第三者に保存される可能性があります。URL共有プロフィールは、本人が共有を選んだ記録だけが表示されます。',
  ],
  [
    '8. 変更・退会・連絡先',
    '保守や障害対応などによりサービスを停止・変更する場合があります。重要な変更はサイトで案内します。退会やアカウントに関する相談は、登録メールアドレスから info@mon-ai.jp へお送りください。運営：MON-ai／愛知県豊田市東梅坪町10-4-9。',
  ],
] as const;
export default function Terms() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-bold">利用規約</h1>
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
