# 豊田Ai塾 公式サイト

豊田市で立ち上げる、大人向け対面AI塾の公式サイトです。

- 公開サイト: https://toyota-ai-school.mondism.chatgpt.site
- GitHub: https://github.com/fujimoto198904-hash/aijuku
- 正式な引き継ぎ資料: [docs/HANDOFF.md](docs/HANDOFF.md)

## 新しいMacで最初に行うこと

必要なものは、Git、Node.js 22.13以上、npm、GitHubへのアクセス権です。Codexで公開まで行う場合は、現在のSitesプロジェクトを操作できる同じChatGPT／Codexアカウントも必要です。

```bash
git clone https://github.com/fujimoto198904-hash/aijuku.git
cd aijuku
nvm install
nvm use
npm ci
npm run doctor
npm run dev
```

`nvm`を使わない場合は、Node.js 22.13以上を別の方法でインストールしてください。起動後に http://localhost:3000 を開きます。3000番が使用中なら、次のように変更できます。

```bash
npm run dev -- --port 3001
```

環境変数は現在必須ではありません。公開URLを変更したい場合だけ、見本をコピーして編集します。

```bash
cp .env.example .env.local
```

## よく使うコマンド

| コマンド | 用途 |
|---|---|
| `npm run dev` | ローカルで編集画面を起動 |
| `npm run doctor` | Node・必須ファイル・公開先設定を確認 |
| `npm run build` | 本番用ビルド |
| `npm run verify` | 引き継ぎ確認と本番用ビルドをまとめて実行 |
| `npm run lint` | コード検査。現在は既知の警告・エラーあり |
| `npm run build:guide` | スタートガイドPDFを再生成（任意のPython設定が必要） |

## フォルダ案内

```text
app/                     各ページ
  page.tsx               トップページ
  reserve/page.tsx       予約デモ
  mypage/page.tsx        マイページデモ
  level-test/page.tsx    オンラインテスト
components/              フォーム・テスト・共通部品
lib/site-content.ts      レベル、教材例、FAQなどの主要文章
public/                  画像と配布資料
scripts/                 環境確認・PDF生成スクリプト
docs/HANDOFF.md          正式な引き継ぎ資料
AGENTS.md                別MacのCodexが読む運用ルール
.openai/hosting.json     現在のSites公開先（削除・変更しない）
```

`node_modules/`、`dist/`、`.next/`、`.vinext/`、`.wrangler/`、`output/`、`tmp/`は自動生成物です。別Macへコピーせず、必要に応じて再生成します。

## 変更を保存する基本手順

作業開始時:

```bash
git pull --ff-only
npm ci
npm run dev
```

作業完了時:

```bash
npm run verify
git status
git add .
git commit -m "変更内容を簡潔に記載"
git push origin main
```

GitHubへpushしただけでは公開サイトは更新されません。Sitesへの公開は別作業です。詳しい公開方法、現在の実装状況、未実装機能、トラブル対応は[引き継ぎ資料](docs/HANDOFF.md)を参照してください。
