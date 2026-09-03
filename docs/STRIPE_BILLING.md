# Stripe課金運用メモ

## 現在地（2026年9月3日）

藤本実学塾の課金実装は、現在**Stripeサンドボックス専用**です。ライブキーをコードが拒否し、`STRIPE_BILLING_MODE=test`、テスト用サーバーキー、アカウントID、Webhook署名シークレットのすべてが揃うまで、マイページは従来どおり「決済未接続」と表示します。

- Stripeアカウント: `acct_1UBZJvD8iUMy4IW9`（MON-AIサンドボックス）
- テスト顧客: 0件
- テスト請求・テストサブスクリプション: 未作成
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

チャット、Git、スクリーンショット、引き継ぎ資料にキー実値を記録しません。キーは可能な限り制限付きとし、少なくとも現在のアカウント照合、Products / Prices読取、Checkout Sessions作成・読取、Customers作成・読取、Subscriptions読取、Customer Portal Session作成に必要な最小権限だけを付与します。

Webhookは、公開後のSites正本の`/api/billing/webhook`をテスト環境の送信先にします。APIバージョンはコードと同じ`2026-07-29.dahlia`に固定し、次のイベントだけを購読します。署名シークレットは送信先ごとに異なるため、新規作成後の値をSitesへ秘密値として設定します。

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

テスト環境の既定ポータルは、請求履歴、顧客情報、決済手段の更新、請求期間末のサブスクリプション解約を表示する設定です。ただし、利用規約とプライバシーポリシーの公開リンクは未設定で、ノーコードのポータル共有リンクも有効化していません。サイトはAPIから会員ごとの短期ポータルURLを発行する設計です。

現在のコードはStripeアカウントの既定ポータル設定を使用します。公開前に、解約時期、請求書履歴、顧客情報変更、決済手段変更、規約リンクを確定し、専用Configuration IDで固定するかを決めます。

## 未実装の課金運用

- 返金、部分返金、チャージバック／不審請求はStripe Dashboard上の状態を正本とし、D1への自動同期・会員画面表示はまだ実装していません
- 対面料金10,000円が「1申込あたり」か「1人あたり」かを確定してから、複数名申込のCheckout数量を決めます。現状は1申込につき数量1です
- 通常入会金の有料化判定、紙教材の販売、領収書・適格請求書の運用は未実装です

## ローカル確認

```bash
npm ci
npm run db:migrate:local
npm run verify
```

`npm run verify`の成功は、ローカルのコード、資料、ビルドが合格した意味です。2026年9月3日にコードとD1テーブルをSites本番へ配備し、Stripe用5表を確認しました。Stripe秘密値は設定せず、課金無効のままです。StripeサンドボックスへのAPI通信、実際のテストカード決済、Webhook受信、Customer Portalは別に確認します。

## ライブ開始の停止条件

次をすべて完了するまで、ライブ決済は有効化しません。

1. このチャットに貼られたテスト用シークレットキーをStripeでローテーションまたは削除し、WorkbenchのAPIアクティビティを確認する
2. 税込総額、対面料金の課金単位、提供時期、変更・取消・返金、月額解約、休会・日割り、入会金の適用判定を確定する
3. 特定商取引法表記、正式な事業者情報、確実に連絡できる電話番号、有料受講規約を事業・法務確認する
4. 商品ごとの税コードとStripe Taxの登録義務を税務確認し、有効な税務登録がある場合だけ自動税計算を判断する
5. 返金・チャージバックの通知、記録、会員案内、運営対応フローを決める
6. 回復可能なD1バックアップを取り、`0010`の本番適用、テストCheckout、成功・失敗・期限切れ、Webhook再送、月額更新、支払失敗、期間末解約、Customer Portalを一般会員で通す
7. サンドボックスQA後に、ライブ用の商品・Price・Webhook・最小権限キーを別途作成し、ライブを拒否する現在のコードをレビュー付きで明示的に変更する

現在の実装・商品作成だけでは、commit、GitHub push、Sites公開、本番D1マイグレーション、ライブ請求のどれも完了していません。
