import type { Metadata } from 'next';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { canonicalPublicPath } from '@/lib/site-paths';

export const metadata: Metadata = {
  title: 'プライバシーポリシー｜藤本実学塾',
  description:
    '藤本実学塾の会員情報、申込情報、学習記録の取扱いについて説明します。',
  alternates: { canonical: canonicalPublicPath('/privacy') },
};

const sections = [
  [
    '1. 取得する情報',
    'ChatGPTによる初回本人確認で提供される利用者識別子、メールアドレス、表示名、ログインID、パスワードとセッショントークンのハッシュ値、会員登録日時、学びたい目的、受講申込、希望日時、対応状況、担当講師、確定日時、会場・Google Meet案内、学習記録、成果物、公開設定、講師確認記録を取得または生成します。運営者のGoogleカレンダー連携では、確認済みGoogleメールアドレス、Google利用者識別子、許可範囲、暗号化した更新用トークン、Google予定ID、同期状態、暗号化したMeet URLを保存します。不正ログイン対策ではIPアドレスそのものを保存せず、秘密情報で保護した識別子と試行回数だけを保存します。初回パスワードに使う生年月日8桁も保存しません。電話番号は取得しません。',
  ],
  [
    '2. 利用目的',
    '無料会員の本人確認と認証、マイページ提供、学習記録の管理、受講希望の受付・確認・連絡、講師確認、本人が選んだ応募用プロフィールのURL共有、授業予定とGoogle Meetの作成、料金等の案内、問い合わせ対応、不正利用の防止、安全な運営と改善、法令上必要な対応のために利用します。',
  ],
  [
    '3. 第三者提供と委託',
    '本人の同意がある場合または法令に基づく場合を除き、個人データを第三者へ提供しません。授業を確定すると、Googleへ固定の授業名、開始・終了日時、個人を直接示さない申込識別子を送信します。受講生の氏名、メールアドレス、学習目的、補足内容は送りません。受講生をGoogle予定の参加者にせず、受講生のGoogleカレンダーにも書き込みません。応募用プロフィールは、本人が共有を有効にし、掲載を選んだ情報だけを表示します。サイト運営、データ保存、メール配信、決済等を外部事業者へ委託する場合は、必要な安全管理を行います。',
  ],
  [
    '4. 安全管理',
    'アクセス権限の分離、本人ごとのデータ制御、通信の保護、秘密情報の分離、操作記録、バックアップ等を行います。パスワードとセッショントークンの原文は保存せず、比較用のハッシュ値だけを保存します。Googleの更新用トークンとMeet URLは暗号化し、接続と申込にひも付けて保護します。Googleカレンダーの接続・解除と申込確定は運営者本人だけが操作できます。デモアカウントのデータ変更はサーバー側で拒否します。',
  ],
  [
    '5. 保存期間',
    '会員機能、受講対応、学習記録、確認履歴に必要な期間、または法令・紛争対応に必要な期間に限って保存します。受講生は共有ページや個別成果物を非公開へ戻せます。退会後は、保持する必要がなくなった情報から順次削除または識別できない形へ処理します。',
  ],
  [
    '6. 開示・訂正・削除等',
    '本人の情報について、利用目的の通知、開示、訂正、利用停止、削除等を希望する場合は、登録メールアドレスから運営本部へ連絡してください。本人確認後、法令に従って対応します。パスワードを忘れた場合のメール相談も同じ窓口で受け付けますが、自動再設定メールと具体的な復旧方法は現在準備中です。',
  ],
  [
    '7. 成果物と外部リンク',
    '成果物ファイルの直接アップロードは現在行わず、受講生が指定した外部URLを記録します。受講生は、顧客情報、社外秘、第三者の個人情報、権利未確認素材を含めず、外部サービス側の共有権限も確認してください。当塾は外部URLの公開範囲や保存期間を管理できないため、必要に応じてリンク先でも共有を停止してください。',
  ],
  [
    '8. 改定',
    '取扱う情報やサービス内容の変更に応じて本方針を改定する場合があります。重要な変更は、サイトまたは登録メールで案内します。',
  ],
  [
    '9. 連絡先',
    '運営本部：藤本実学塾／愛知県豊田市東梅坪町10-4-9／info@mon-ai.jp。個人情報に関する連絡はメールで受け付け、電話での受付は行っていません。',
  ],
] as const;

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="min-h-screen bg-paper text-ink">
        <article className="soft-panel mx-auto my-8 w-[calc(100%_-_2rem)] max-w-[920px] border border-rule bg-paper-white px-6 py-12 sm:my-12 sm:px-10 sm:py-16">
          <p className="text-xs font-semibold tracking-[0.16em] text-sapphire">
            PRIVACY POLICY
          </p>
          <h1 className="text-soft-glow mt-5 font-mincho text-4xl sm:text-5xl">
            プライバシーポリシー
          </h1>
          <p className="mt-5 text-sm leading-7 text-quiet">
            制定日：2026年9月1日／最終改定日：2026年9月3日
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
