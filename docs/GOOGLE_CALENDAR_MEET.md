# Google Calendar / Google Meet 運用メモ

## できること

運営者が申込を「確定」した時に、指定したオーナー本人のGoogleカレンダーへ授業予定を自動登録します。日時の基準は日本時間（`Asia/Tokyo`）です。

| 申込種類 | 自動登録する内容 |
| --- | --- |
| 家庭教師型（オンライン） | 50分の予定と、申込ごとのGoogle Meetを作成 |
| 家庭教師型（対面） | 2026年10月1日以降の日時に、60分の予定を作成。Meetは作成しない |
| 対面・教科書自習式 | 対象外。月額申込と日々の来場予約は別に管理 |

同じ申込を再度確定する場合は、申込IDに紐づく同じ予定を更新し、二重登録を防ぎます。オンライン授業はMeet URLの発行を確認できるまで、申込の確定を完了しません。

## 安全面の境界

- 保存先は、認証したGoogleアカウントの`primary`（メインカレンダー）にコード上で固定しています。画面やAPIの入力から別のカレンダーは選べません。
- OAuthは、所有するカレンダーの予定を操作する`calendar.events.owned`権限を求めます。Google側の権限自体は`primary`限定ではないため、本サイトの実装が保存先を`primary`に制限します。
- Sitesの`GOOGLE_CALENDAR_OWNER_EMAIL`に設定した本人アカウントだけを接続できます。その他のGoogleアカウントは拒否します。
- 受講生を参加者に追加せず、`sendUpdates=none`で保存します。受講生のGoogleカレンダーへの書き込みも行いません。
- 予定名と説明は定型文です。会員のメール、学習目標、備考はGoogleカレンダーへ送りません。
- GoogleのリフレッシュトークンとMeet URLは暗号化してD1へ保存します。秘密値やMeet URLをログに出しません。
- OAuthとD1を使う正本はSites側です。Vercel側からは正規の管理ページへ移動します。

## Google Cloudの初回設定

1. Google Cloudで本サイト用のプロジェクトを選び、**Google Calendar API**を有効にします。
2. Google Auth Platformでブランディング、対象ユーザー、データアクセスを設定します。Workspace内限定で使える場合は「内部」、使えない場合は「外部」にし、公開状態に合わせて接続する本人をテストユーザーへ追加します。
3. OAuth 2.0クライアントを**Webアプリケーション**として作成します。
4. 承認済みのリダイレクトURIに、次を完全一致で登録します。

```text
https://mon-ai.jp/aijuku/api/admin/google-calendar/callback
```

この連携はサーバー側OAuthフローのため、認証コードをブラウザのJavaScriptから使いません。クライアントシークレットはソースやチャットに貼らず、Sitesの秘密環境値にだけ保存します。

外部向けOAuth画面を「Testing」のまま運用すると、Calendar権限を含むリフレッシュトークンは原則7日で期限切れになります。継続運用の前に、対象ユーザーと必要なGoogleの審査条件を確認し、適切な公開状態にします。

## Sitesの秘密環境値

Sitesの実行環境にだけ、次の4値を設定します。実値はGit、ドキュメント、スクリーンショットに残しません。

```text
GOOGLE_CALENDAR_CLIENT_ID=<WebクライアントID>
GOOGLE_CALENDAR_CLIENT_SECRET=<Webクライアントシークレット>
GOOGLE_CALENDAR_OWNER_EMAIL=<予定の保存先とする本人メール>
GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY=<32バイトの暗号鍵>
```

`GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY`は、64文字の16進数、または32バイトをBase64 URL形式にした値を使います。本番で使い始めた後に鍵だけを入れ替えると、保存済みのGoogle認証情報とMeet URLを復号できなくなります。鍵の変更は、再接続と旧データの移行手順を決めてから行います。

## 接続・再接続・解除

### 接続

1. Sitesの本番D1に必要なマイグレーションを適用し、4つの秘密環境値を設定したビルドを公開します。
2. デモではないオーナーアカウントで`/admin`を開きます。
3. 「Googleカレンダーを接続する」を押し、`GOOGLE_CALENDAR_OWNER_EMAIL`と同じGoogleアカウントで許可します。
4. 管理画面が「接続済み」となり、想定したアカウントが表示されたことを確認します。

### 再接続

Google側で許可が無効になった場合や、書き込み権限を確認できない場合は、管理画面に再接続が必要と表示されます。「Googleへ再接続する」から同じ本人アカウントを許可し直します。接続できるまで、オンラインと対面授業の申込確定は行いません。

### 解除

管理画面の「連携を解除する」を開き、解除ボタンを押します。Googleの許可を取り消し、保存したトークンを使えない状態にします。**すでにGoogleカレンダーへ作成した予定は消えません。**

## 検証手順

### ローカル

```bash
npm ci
npm run db:migrate:local
npm run verify
```

`npm run verify`の成功は、ローカルのコード、データ定義、ビルドが通ったことの確認です。Google本番アカウントへの接続や実際の予定作成を確認したことにはなりません。

### Sites公開後

1. 本番D1のマイグレーション、4つの秘密環境値、Sitesの公開結果をそれぞれ確認します。
2. オーナーで接続し、管理画面で「接続済み」と対象アカウントを確認します。
3. 専用の検証用申込で、将来のオンライン授業を確定します。`primary`に50分の予定が1件だけ作成され、個別のMeetが付き、参加者が0人であることをGoogleカレンダー上で確認します。
4. 同じ申込の日時を変更し、新規予定が増えず、元の予定が更新されることを確認します。
5. 会員本人のマイページから、その申込のMeet URLだけを開けることを確認します。
6. 2026年9月30日の対面授業は確定できず、2026年10月1日以降は60分・Meetなしで登録できることを確認します。
7. 対面・教科書自習式を確定しても、Googleカレンダーに予定が増えないことを確認します。

## まだできないこと

- Googleカレンダーから空き時間を読み取って、予約可能な枠を自動表示すること
- 受講生をGoogleカレンダーの参加者へ追加すること、またはGoogleから招待メールを送ること
- 申込の取消や連携解除を、作成済みのGoogleカレンダー予定の削除へ自動反映すること
- 対面・教科書自習式の毎日の来場予約を、繰り返し予定として登録すること

## Google公式資料

- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [OAuth 2.0のリフレッシュトークン期限](https://developers.google.com/identity/protocols/oauth2#expiration)
- [Google Calendar APIを有効化する](https://developers.google.com/workspace/calendar/api/quickstart/js#enable_the_api)
- [Google Calendar APIのOAuthスコープ](https://developers.google.com/workspace/calendar/api/auth)
- [Events: insert—`primary`とGoogle Meet作成の仕様](https://developers.google.com/workspace/calendar/api/v3/reference/events/insert)
