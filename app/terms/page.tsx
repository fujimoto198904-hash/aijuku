import type { Metadata } from 'next';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { canonicalPublicPath } from '@/lib/site-paths';

export const metadata: Metadata = {
  title: '無料会員利用規約｜藤本実学塾',
  description: '藤本実学塾の無料会員機能に関する利用条件です。',
  alternates: { canonical: canonicalPublicPath('/terms') },
};

const sections = [
  [
    '1. 対象',
    '本規約は、藤本実学塾が提供する無料会員機能、マイページ、AI実学パスポート、URL共有プロフィールの利用に適用されます。有料受講の契約条件、支払い、変更、取消、返金等は、各申込時に別途提示する条件が優先します。',
  ],
  [
    '2. 無料会員登録',
    '会員登録自体は無料です。登録には本人のChatGPTアカウントを使用します。有料受講を申し込み、当塾が内容を確認して別途案内するまでは、入会金・受講料は発生しません。',
  ],
  [
    '3. アカウント管理',
    '会員は、自分のChatGPTアカウントを第三者に利用させず、本人の情報で本サービスを利用してください。アカウントの不正利用に気づいた場合は、速やかに運営本部へ連絡してください。',
  ],
  [
    '4. 申込の扱い',
    'マイページからの送信は、受講希望の受付です。送信だけでは、日程、会場、講師、Google Meet、料金、契約、決済は確定しません。当塾からの確定案内をもって申込内容を確認します。',
  ],
  [
    '5. 禁止事項',
    '他人になりすます行為、虚偽の成果・所属・確認範囲を登録する行為、顧客情報・社外秘・第三者の個人情報・権利未確認素材を無断掲載する行為、サービス運営を妨げる行為、不正アクセス、法令または公序良俗に反する行為、教材やシステムを無断で複製・再配布する行為を禁止します。',
  ],
  [
    '6. 教材とAI出力',
    'Web教科書は学習支援を目的とします。AIの出力は下書きであり、氏名、数字、期限、権利、公開・送信・契約等は利用者自身が確認してください。公的資格や各AI提供会社の公式認定を示すものではありません。',
  ],
  [
    '7. AI実学パスポート',
    'AI実学パスポートは、受講生が登録した実践記録と、講師・運営が実際に確認した範囲を分けて表示する学習記録です。能力全体、公的資格、勤務先、職歴、雇用適性、採用結果を保証するものではありません。講師確認済みの表示は、記載された範囲を当塾が確認したことだけを意味します。',
  ],
  [
    '8. 成果物の記録と共有',
    '受講生は、成果物を記録または共有するために必要な権利と許可を自ら確認し、未確認事項を明示してください。URL共有プロフィールは検索エンジン非掲載を指定しますが、URLを知る人は閲覧でき、複製を完全には防げません。受講生は掲載項目を選び、不要になった時は共有を停止してください。共有を再開すると新しいURLを発行します。外部URLの共有停止は、リンク先サービスでも別途行う必要があります。',
  ],
  [
    '9. 停止・変更',
    '保守、障害、安全確保、法令対応等のため、会員機能の全部または一部を停止・変更する場合があります。重要な変更は、サイトまたは登録メールで案内します。',
  ],
  [
    '10. 退会',
    '退会を希望する場合は、登録メールアドレスから運営本部へ連絡してください。法令上の保存義務や紛争対応に必要な情報を除き、本人確認後に順次処理します。',
  ],
  [
    '11. お問い合わせ',
    '運営本部：藤本実学塾／愛知県豊田市東梅坪町10-4-9／info@mon-ai.jp。電話での受付は行っていません。',
  ],
] as const;

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="min-h-screen bg-paper text-ink">
        <article className="soft-panel mx-auto my-8 w-[calc(100%_-_2rem)] max-w-[920px] border border-rule bg-paper-white px-6 py-12 sm:my-12 sm:px-10 sm:py-16">
          <p className="text-xs font-semibold tracking-[0.16em] text-sapphire">
            MEMBERSHIP TERMS
          </p>
          <h1 className="text-soft-glow mt-5 font-mincho text-4xl sm:text-5xl">
            無料会員利用規約
          </h1>
          <p className="mt-5 text-sm leading-7 text-quiet">
            制定日：2026年9月1日／最終改定日：2026年9月2日
          </p>
          <div className="mt-12 grid max-w-[68ch] gap-9">
            {sections.map(([title, body]) => (
              <section className="border-t border-rule pt-6" key={title}>
                <h2 className="font-mincho text-2xl">{title}</h2>
                <p className="mt-4 text-base leading-8 text-quiet">{body}</p>
              </section>
            ))}
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
