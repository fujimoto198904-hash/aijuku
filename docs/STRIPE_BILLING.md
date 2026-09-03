# Stripe課金運用メモ

## 現在地（2026年9月3日）

藤本実学塾の課金実装は、現在**Stripeサンドボックス専用**です。ライブキーをコードが拒否し、`STRIPE_BILLING_MODE=test`、テスト用サーバーキー、アカウントID、Webhook署名シークレットのすべてが揃うまで、マイページは従来どおり「決済未接続」と表示します。

- Stripeアカウント: `acct_1UBZJvD8iUMy4IW9`（MON-AIサンドボックス）
- テスト顧客: 0件
- テスト請求・テストサブスクリプション: 未作成
- GitHub `main` `d206a62`とSites保存済みバージョン16に基盤コードを公開済み。本番D1のStripe用5表は全て0件
- SitesのStripe用4環境変数は未設定。本番Webhook URLはHTTP 503と`private, no-store`を返し、課金無効を確認済み
- StripeサンドボックスのWebhook送信先`we_1UBbYkD8iUMy4IW9IpJCsXkU`は「藤本実学塾 Sites サンドボックス」としてアクティブ。署名シークレットのSites設定と実イベント送信は未実施
- Stripeダッシュボードの公開事業者情報にサンドボックス用の仮値が残っている。正式な販売者情報を確定するまでライブ設定へ複製しない
- Git、`.env.example`、D1マイグレーションにStripeのキー実値を保存しない
- Stripe-hosted CheckoutとCustomer Portalを使うため、Stripe.js用の公開可能キーはこの実装に不要

## サンドボックス商品カタログ

| 用途                         | 商品ID                | lookup key                           |           価格 |
| ---------------------------- | --------------------- | ------------------------------------ | -------------: |
| 家庭教師型（対面）60分       | `prod_VBxPjxHgjWfS17` | `aijuku_in_person_tutor_jpy_once_v1` |  10,000円・1回 |
| 家庭教師型（オンライン）50分 | `prod_VBxQZtRActSNeC` | `aijuku_online_tutor_jpy_once_v1`    |   4,000円・1回 |
| 対面・教科書自習式           | `prod_VBxTaTYdf2kkGK` | `aijuku_self_study_jpy_monthly_v1`   | 10,000円・毎月 |
| 通常入会金                   | `prod_VBxUfflPHajbZb` | `aijuku_entrance_fee_jpy_once_v1`    |  10,000円・1回 |

価格はサンドボックス上で「内税」として仮置きしています。自動税計算は有効化していません。商品カテゴリはアカウント既定値の `General - Electronically Supplied Services`を継承しており、対面授業やライブ授業に適切とは確認できていません。事業・税務確認後に、各商品の税区分と税コードを正しく決めます。

税コードは未適用です。Stripe公式カタログと提供内容の文言だけを照合すると、対面は`txcd_20060044` Trainingまたは補習性が強い場合の`txcd_20060059` Tutoring、Google Meetは`txcd_20060045` Training Services - Live Virtualが候補です。講師なしのWeb自習用`txcd_20060058`は、質問可能な現行サービスにそのまま適用しません。これらは税務助言ではなく、税務確認後に最終決定します。

通常入会金は商品のみ用意しました。OPEN記念の先着1,000名は「有料受講の入会申込受付順」で運営判定する現行方針のため、誤請求を避ける目的でCheckoutには含めていません。紙の教科書は「1冊2,000円前後」の計画値であり、在庫、送料、税区分も未確定のため商品化していません。

## サイト側の構成

- `POST /api/billing/checkout`: 認証済みの非デモ会員が、運営確定済みの自分の申込だけをCheckoutへ進める
- `GET /mypage/billing`: 通常の会員機能を再開せず、停止・退会後の会員にも既存の請求管理だけを提供する。個人パスワード設定済み・無効化されていない本人アカウントと、有効な会員セッションを専用resolverで確認する
- `POST /api/billing/portal`: D1で自分に紐づくStripe Customerが確認できる時だけCustomer Portalを開く。停止・退会後の専用認証を許可するのはこのAPIだけで、Checkoutや通常の会員・管理APIは従来のactive条件を維持する
- `POST /api/billing/webhook`: raw bodyと`Stripe-Signature`を検証し、`event.id`単位の冪等性と、Stripe object単位の期限付きleaseを獲得してからD1を更新する。Checkout Session、Subscription、Customerはlock獲得後にStripe APIから再取得し、新旧イベントの並行処理で状態を巻き戻さない
- 複数objectを同期する場合は、必要なobjectだけをCheckout Session → Subscription → Customerの順序で取得する。CheckoutからCustomerを直接同期する場合も逆方向のlockは取らない。競合中はWebhookを非2xxで再送させ、`event.id`と処理試行番号を組み合わせたownerが一致する時だけ解放し、クラッシュ後はTTL経過後に別の試行ownerで再取得する
- D1のStripe関連5表: `billing_customers`、`billing_checkout_sessions`、`billing_subscriptions`、`stripe_webhook_events`、`stripe_object_sync_locks`。会員との所有関係、決済・契約状態、冪等処理、object leaseを分離保存する
- 金額、通貨、課金間隔はサーバー側の期待値とStripe Priceを都度照合し、ブラウザの送信値を信用しない
- Checkoutの戻りURLは決済完了証明に使わず、署名検証済みWebhookの保存状態だけを画面表示の根拠にする
- StripeがCheckout Sessionを作成しても、D1へのSession保存が成功するまでURLをレスポンスに含めず、URLもログに出さない。Sessionの有効期限はStripe既定の作成後24時間を使い、保存済みの`open` Sessionはローカルの期限時刻だけで新規作成せず、Stripe APIが`expired`を返すまで既存Sessionを再利用する
- 一回払いはCheckout `payment`、自習式はBilling `subscription`。カード番号を藤本実学塾サイトで保持しない
- 非同期決済が失敗したCheckoutは失敗時刻を保存し、同じ申込で新しい世代のCheckoutを安全に作り直せる。月額は会員とサービスの組み合わせを単位に重複契約を防ぐ

## 秘密値と設定

Sitesの実行環境にだけ、次の4値を設定します。

```text
STRIPE_BILLING_MODE=test
STRIPE_ACCOUNT_ID=<テスト対象アカウントID>
STRIPE_SECRET_KEY=<新しいテスト用制限付きキー>
STRIPE_WEBHOOK_SECRET=<テストWebhook署名シークレット>
```

チャット、Git、スクリーンショット、引き継ぎ資料にキー実値を記録しません。キーは可能な限り制限付きとし、Accounts読取、Products / Prices読取、Checkout Sessions作成・読取、Customers作成・読取、Subscriptions読取、Customer Portal Session作成に必要な最小権限だけを付与します。現在は制限付きキーを未作成です。このチャットに入力された標準テスト用シークレットキーは、新しい制限付きキーをSitesへ安全に設定する前にStripe上でローテーションまたは削除します。

Webhookの公開URLは`https://mon-ai.jp/aijuku/api/billing/webhook`です。親VercelがSitesの実行ルートへ内部転送します。既存のサンドボックス送信先は旧Sites直URLで登録されているため、課金有効化前にこの公開URLへ変更し、署名シークレットをSitesへ設定します。APIバージョンは、固定済みの`stripe@22.6.1`とコードに合わせて`2026-08-26.dahlia`を選び、次の10イベントだけを購読します。現在は署名シークレットがSites未設定で、実イベントも送信していません。

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.deleted`

## カスタマーポータルの現在地

テスト環境のポータルは、請求履歴、顧客情報、決済手段の更新、請求期間末のサブスクリプション解約を表示する設定です。見出しは「藤本実学塾｜請求管理」、ブランド色は`#102a36`と`#a94b3a`とし、リポジトリ内のアセットからiconとlogoを設定済みです。ただし、利用規約とプライバシーポリシーの公開リンクは未設定で、ノーコードのポータル共有リンクも有効化していません。サイトはAPIから会員ごとの短期ポータルURLを発行する設計です。

現在の作業ツリーのコードは、テスト環境のCustomer Portal設定`bpc_1UBbJVD8iUMy4IW9MrhzJJpZ`を明示的に使用します。サンドボックス課金の有効化前に、解約時期、請求書履歴、顧客情報変更、決済手段変更、規約リンクの最終状態を同じConfiguration IDで確認します。

## 未実装の課金運用

- 返金、部分返金、チャージバック／不審請求はStripe Dashboard上の状態を正本とし、D1への自動同期・会員画面表示はまだ実装していません
- 対面料金10,000円が「1申込あたり」か「1人あたり」かを確定してから、複数名申込のCheckout数量を決めます。現状は1申込につき数量1です
- 通常入会金の有料化判定、紙教材の販売、領収書・適格請求書の運用は未実装です
- Stripe Customerには会員IDのmetadataだけを保存し、氏名とメールを事前設定しない設計です。Checkoutでの顧客情報と領収メールの取得・表示をサンドボックスE2Eで確認します
- 現在の利用規約は無料会員向けです。有料受講条件の版と同意時刻を保存するまで、課金を有効化しません

## ライブ開始前に確定する事業情報

次はStripeの設定値ではなく、販売者・運営・法務・税務で先に確定する正本です。

1. 正式販売者が個人か法人か、法的名称、代表者／販売責任者、実活動住所、確実に連絡できる電話番号
2. 各価格が最終税込総額か、対面料金の課金単位、交通費・会場費・送料などの追加負担
3. 契約成立と役務提供の時点、支払期限、未払い時の予約保持・取消条件
4. 単発授業の変更、取消、無断欠席、返金、運営都合中止の期限・金額・手続
5. 月額の開始日、請求基準日、最低期間、自動更新、解約締切、期間末解約、日割り、休会、返金、支払失敗時の利用停止
6. 入会金無料1,000名の判定正本、適用時点、再入会時の扱い
7. 領収書・適格請求書の発行方法と登録番号の有無
8. 販売地域、B2C／B2B、現在の税務登録、Stripe Tax利用の要否
9. 有料受講規約、特定商取引法表記、PrivacyのStripe取扱い追記、最終確認画面、版付き同意記録
10. AI／PC操作教育が特定継続的役務の「パソコン教室」に当たるかの専門家確認

通信販売の表示事項と最終確認画面は、[消費者庁の通信販売広告の説明](https://www.no-trouble.caa.go.jp/what/mailorder/advertising.html)と[最終確認画面の説明](https://www.no-trouble.caa.go.jp/what/mailorder/guidelines.html)を基準に専門家へ確認します。特定継続的役務の該当性は[消費者庁の対象役務の説明](https://www.no-trouble.caa.go.jp/what/continuousservices/)を参照し、自動判定しません。

## ローカル確認

```bash
npm ci
npm run db:migrate:local
npm run verify
```

`npm run verify`の`check:billing`は、外部通信や実秘密値を使わず、ライブキー拒否、課金認可、Webhook署名・API版・モード・アカウント照合、空DBへの全マイグレーション、D1の制約、Webhookとobject leaseの冪等性を検査します。この成功はローカルのコード、資料、ビルドが合格した意味です。2026年9月3日に基盤コードとD1テーブルをSites本番へ配備し、Stripe用5表を確認しました。Stripe秘密値は設定せず、課金無効のままです。StripeサンドボックスへのAPI通信、実際のテストカード決済、Webhook受信、Customer Portalは別に確認します。

## ライブ開始の停止条件

次をすべて完了するまで、ライブ決済は有効化しません。

1. このチャットに貼られたテスト用シークレットキーをStripeでローテーションまたは削除し、WorkbenchのAPIアクティビティを確認する
2. 税込総額、対面料金の課金単位、提供時期、変更・取消・返金、月額解約、休会・日割り、入会金の適用判定を確定する
3. 特定商取引法表記、正式な事業者情報、確実に連絡できる電話番号、有料受講規約を事業・法務確認する
4. 商品ごとの税コードとStripe Taxの登録義務を税務確認し、有効な税務登録がある場合だけ自動税計算を判断する
5. 返金・チャージバックの通知、記録、会員案内、運営対応フローを決める
6. `0010`適用済みの本番D1にStripe用5表があり全0件である現在値を再確認し、回復可能なD1バックアップを取ってから、テストCheckout、成功・失敗・期限切れ、Webhook再送、月額更新、支払失敗、期間末解約、Customer Portalを一般会員で通す
7. サンドボックスQA後に、ライブ用の商品・Price・Webhook・最小権限キーを別途作成し、ライブを拒否する現在のコードをレビュー付きで明示的に変更する

基盤コードのcommit・GitHub push、Sites保存・公開、本番D1への`0010`適用、サンドボックスWebhook送信先の作成は完了しています。Customer Portal Configurationの明示固定、Stripe SDK / APIバージョン更新、`check:billing`はローカル`main`にcommit済みですが、GitHubへは未push・Sitesへは未公開です。Stripe秘密値のSites設定、Webhook実受信、サンドボックスE2E、ライブ請求は完了していません。
