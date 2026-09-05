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

`db:migrate:local`はローカルD1だけを対象にします。`npm run verify`で教科書・認証・コミュニティ・停止中の有料API・ビルドを検証します。lintは独立した検査です。

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

新しいGoogleログイン・メール登録には秘密設定と実際の本人確認が必要です。未設定の環境では「準備中」と表示します。秘密情報をGitやチャットへ貼らないでください。

## 正本ドキュメント

- [統合仕様と本番との境界](docs/AISTOCK_INTEGRATION.md)
- [作業フォルダと旧データの保管場所](docs/WORKSPACE_MAP.md)
- [開発・公開の引き継ぎ](docs/HANDOFF.md)
- [カリキュラムの正本](docs/TEXTBOOK_CURRICULUM_MASTER_MAP.md)
- [教材の編集方針](docs/TEXTBOOK_TEACHING_METHOD.md)
- [練習データ](docs/DEMO_DATA_PACKAGES.md)

旧学校の料金・登録方法・公開記録は`docs/history/`に保管しています。現行仕様ではありません。
