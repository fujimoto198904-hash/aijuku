# AIstock — 無料のAI勉強コミュニティ

「何から始めればいい？」から、最初の「できた」へ。みんなの投稿を見て、気になる使い方を保存し、無料のWeb教科書で試せるアプリです。運営はMON-ai。旧・藤本実学塾とAitockを、この一つの本体へ統合しています。

## 開発・公開の現在地

- 統合後の目標URL：`https://mon-ai.jp/aistock`
- 本番切替は未実施。既存公開先は`https://mon-ai.jp/aijuku`
- GitHub：`https://github.com/fujimoto198904-hash/aijuku`（mainが正本）
- 既存SitesプロジェクトIDを維持し、D1とR2で動作します。
- ローカル統合、実会員の初回登録、本番公開は別々に検証します。

## 開発

Node.js 22.13以上と、コミット済みのnpm lockfileを使います。

```bash
npm ci
npm run db:migrate:local
npm run doctor
npm run dev
```

`db:migrate:local`はローカルD1だけを対象にします。`npm run verify`で教科書・認証・コミュニティ・UIの基本条件・停止中の有料API・ビルドを検証します。`npm run check:ui`はナビゲーション・キャッシュ禁止・文字色の検査です。lintは独立した検査です。

## どこを編集するか

| 場所 | 内容 |
| --- | --- |
| `app/`・`components/` | フィード、検索、学ぶ、会員ページ |
| `lib/textbook-lessons/` | 全730課題・73章の完成本文。統合で上書きしない |
| `lib/official-posts.ts` | 実在教材への公式紹介。架空の生徒投稿ではない |
| `db/`・`drizzle/` | D1のデータ操作と追加マイグレーション |
| `features/paid-school/` | 停止した有料画面の復元用 |
| `archives/` | 旧Aitockソース。Git・ビルド・公開対象外 |

保存、自分用ノート、教材の完了記録はD1へ。投稿画像はR2へ保管し、公開状態を確認して配信します。自分用ノートは公開投稿と独立しています。

マイページは投稿グリッド・保存・学習・成果物・設定の切替式です。公開プロフィール、フォロー、いいね、コメント、リンク共有、承認付きDMもD1で管理します。仕様と公開前の確認項目は[交流機能](docs/AISTOCK_SOCIAL.md)を参照してください。公式AI10人と投稿例をローカルに準備するには、マイグレーション後に `npx tsx scripts/seed_official_local.ts` を実行します。実会員の認証アカウントは作りません。

無料登録の主な入口は、ユーザー名（半角英数字・`_`・`-`、3〜24文字）と8文字以上のパスワード、規約同意です。メール・本名は不要。登録後は確認ステップなしで元のページへ戻ります。公開プロフィールと復旧コードは、後からマイページで任意設定できます。コードの発行・再発行には現在のパスワードを使い、`/account/recover`でコードによるパスワード再設定ができます。

ユーザー名登録は既存の`AUTH_PASSWORD_PEPPER`とD1（0017まで）が必要です。Google・メール登録は別の任意の入口で、秘密設定と実際の本人確認が必要です。未設定の入口は表示しません。秘密情報をGitやチャットへ貼らないでください。本番の登録確認・公開は未実施です。

## 正本ドキュメント

- [統合仕様と本番との境界](docs/AISTOCK_INTEGRATION.md)
- [フィードのデザインと操作](docs/AISTOCK_DESIGN.md)
- [作業フォルダと旧データの保管場所](docs/WORKSPACE_MAP.md)
- [開発・公開の引き継ぎ](docs/HANDOFF.md)
- [カリキュラムの正本](docs/TEXTBOOK_CURRICULUM_MASTER_MAP.md)
- [教材の編集方針](docs/TEXTBOOK_TEACHING_METHOD.md)
- [練習データ](docs/DEMO_DATA_PACKAGES.md)

旧学校の料金・登録方法・公開記録は`docs/history/`に保管しています。現行仕様ではありません。
