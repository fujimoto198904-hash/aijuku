# 豊田Ai塾サイト 引き継ぎ資料

最終整理日: 2026年8月31日

## 1. 最初に把握すること

| 項目 | 内容 |
|---|---|
| 公開サイト | https://toyota-ai-school.mondism.chatgpt.site |
| GitHub | https://github.com/fujimoto198904-hash/aijuku |
| 正式ブランチ | `main` |
| 公開先 | OpenAI Sites |
| 技術構成 | Vinext、React、TypeScript、Tailwind CSS、Cloudflare Workers互換ビルド |
| 対応Node.js | 22.13以上（`.nvmrc`は22.13.0） |

GitHubの`main`をソースコードの正本とします。ただし、GitHubへのpushと公開サイトへの反映は別作業です。コードをpushした後に、Sitesへの公開を行ってください。

`.openai/hosting.json`には現在のSitesプロジェクトIDが入っています。これは秘密鍵ではありませんが、別サイトへ誤公開しないため削除・書き換えをしないでください。このファイルだけでは公開権限は得られません。

## 2. 別Macへの移行

### 必要なアカウント

- このGitHubリポジトリへアクセスできるGitHubアカウント（匿名cloneはできません）
- 現在のSitesプロジェクトを操作できるChatGPT／Codexアカウント
- GitHubとChatGPT／Codexの2段階認証・復旧手段

GitHubの権限とSitesの権限は別です。GitHubだけ使えても公開はできず、Sitesだけ使えてもGitHubへpushできません。別のChatGPTワークスペースでは、現在と同じSites URLを操作できない場合があります。

### 初回セットアップ

```bash
git clone https://github.com/fujimoto198904-hash/aijuku.git
cd aijuku
nvm install
nvm use
npm ci
npm run doctor
npm run dev
```

`nvm`を使わない場合は、Node.js 22.13以上をインストールします。ローカル表示は http://localhost:3000 です。保存場所は任意で、現在のGoogle Driveやユーザーフォルダへの依存はありません。

### 最初の動作確認

次のページをPC幅とスマートフォン幅で確認します。

- `/`
- `/reserve`
- `/mypage`
- `/level-test`
- `/downloads/toyota-ai-school-start-guide.pdf`

その後、`npm run verify`が成功することを確認します。

## 3. 現在のフォルダ構成

| 場所 | 役割・主な編集内容 |
|---|---|
| `app/page.tsx` | トップページの構成・大きな見出し |
| `app/reserve/page.tsx` | 予約ページの説明 |
| `app/mypage/page.tsx` | マイページのデモ表示 |
| `app/level-test/page.tsx` | テストページの説明 |
| `components/reservation-form.tsx` | 予約日時・人数・レンタル選択のデモ |
| `components/level-test.tsx` | Lv.10テスト問題、正解、合格点 |
| `components/site-header.tsx` | ヘッダーとナビゲーション |
| `components/site-footer.tsx` | フッター |
| `components/mission-explorer.tsx` | ミッション表示 |
| `lib/site-content.ts` | レベル、教材例、FAQ、料金などの主要データ |
| `app/globals.css` | 色、余白、共通デザイン |
| `public/` | OG画像、favicon、配布ファイル |
| `scripts/doctor.mjs` | 別Mac移行・公開前の環境確認 |
| `scripts/build_start_guide.py` | スタートガイドPDFの生成 |
| `AGENTS.md` | 別MacでCodexが自動参照する運用ルール |
| `.openai/hosting.json` | 現在のSites公開先 |

次のフォルダは自動生成物なので、編集・共有・Git追加をしません。

- `node_modules/`
- `dist/`
- `.next/`
- `.vinext/`
- `.wrangler/`
- `output/`
- `tmp/`

別Macへフォルダを丸ごとコピーせず、GitHubからcloneして`npm ci`を実行してください。Apple SiliconとIntel Macの間で`node_modules`を使い回さないでください。

## 4. 現在できていること

| 機能 | 状態 |
|---|---|
| 一般公開された紹介サイト | 稼働中 |
| PC・スマートフォン表示 | 対応済み |
| 料金、時間、会場、学習方法の案内 | 表示済み |
| 100レベルの段階説明 | 表示済み |
| 代表ミッションの閲覧 | 対応済み |
| PDF・チェックリストのダウンロード | 対応済み |
| 予約フォーム | 操作体験デモ |
| Lv.10テスト | 4択10問、8問以上で合格、即時採点 |
| マイページ | 画面体験デモ |

### 正式運用前に未実装のもの

- 会員登録・ログイン
- 受講生データベース
- 予約送信、空席管理、確認メール、変更・キャンセル
- 月謝とPC・アカウントレンタル代の決済
- テスト結果と受験履歴の保存
- 証明書の自動発行
- 運営用管理画面
- レベル1〜100の教材本文すべて
- Amazon KDP用のChatGPT版・Claude版書籍本体
- 利用規約、プライバシーポリシー、特定商取引法表記

予約フォームの入力内容は送信されません。マイページはサンプルデータです。テスト結果は再読み込みすると消えます。正式募集を始める前に、この区別を必ず説明してください。

## 5. 日常の編集とGitHubへの保存

### 作業を始める

```bash
git checkout main
git pull --ff-only
npm ci
npm run dev
```

### 修正を確認する

```bash
npm run verify
git status
git diff
```

`npm run verify`は移行設定と本番ビルドを検査します。`npm run lint`は、導入済みUI部品や既存コードに由来するアクセシビリティ・内部リンク等の既知エラーを現在表示します。Mac固有の故障ではなく、別途整理する改善項目です。公開可否はまず`npm run verify`と実画面で判断します。

### GitHubへ保存する

```bash
git add .
git commit -m "変更内容を簡潔に記載"
git push origin main
```

他のMacでも作業するため、作業終了時に必ずpushします。作業開始前には必ずpullし、同じファイルを複数のMacで同時編集しないでください。

## 6. Sitesへの公開

1. GitHubへ最新コードをpushします。
2. Codex Desktopでこのリポジトリを開きます。
3. 現在の`.openai/hosting.json`を使って、ビルド・検証・Sitesへの公開を依頼します。
4. 公開後、公開URLをログアウト状態またはシークレットウィンドウで開きます。
5. トップ、予約、マイページ、テスト、PDFダウンロードを確認します。

Codexへ依頼する例:

> 最新のmainを確認し、npm run verifyが成功したら、現在の豊田Ai塾Sitesプロジェクトへ一般公開してください。GitHubにも未反映の変更があれば先にpushしてください。

`sites`というGitリモートはSites内部の短期認証に使われる場合があります。Gitのリモート設定はGitHubへ保存されないため、別Macに存在しなくても正常です。トークンをリモートURL、設定ファイル、資料に保存しないでください。

現在の公開先はOpenAI Sitesです。Vercelは利用可能でも、現時点の本番公開先には使っていません。意図せず二重運用にしないでください。

## 7. 配布PDFを更新する場合

PDFの再生成はサイト編集には必須ではありません。必要な時だけ実行します。Python 3.9以上を使用してください。

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-docs.txt
npm run build:guide
```

スクリプトはMacの日本語フォントを自動探索します。見つからない場合は、使用するTTFまたはTTCを指定します。

```bash
TOYOTA_AI_JP_FONT="/日本語フォントへのパス.ttf" npm run build:guide
```

生成先は`public/downloads/toyota-ai-school-start-guide.pdf`です。生成後はPDFを開き、文字化け、画像切れ、改ページを目視確認してからGitへ追加します。

## 8. 秘密情報と個人情報

- APIキー、パスワード、GitHubトークン、決済キーをGitへ追加しません。
- `.env.local`などの`.env*`はGit対象外です。`.env.example`には変数名と安全な見本値だけを書きます。
- `NEXT_PUBLIC_`で始まる環境変数はブラウザから見えるため、秘密情報を入れません。
- Sitesの短期認証トークンをファイル・チャット・メールへ貼り付けません。
- 本番予約で個人情報を取得する前に、保存先、閲覧権限、削除手順、バックアップ、規約を決めます。
- レンタルPCは利用者ごとにブラウザプロフィールを分離し、利用後のログアウト・履歴・ダウンロード・保存パスワードの消去手順を用意します。

## 9. よくある問題

### `npm ci`または起動に失敗する

```bash
node -v
npm -v
npm ci
```

Node.jsが22.13未満なら`.nvmrc`のバージョンへ切り替えます。

### 3000番ポートが使われている

```bash
npm run dev -- --port 3001
```

### GitHubへpushできない

新しいMacでGitHubへログインし、リポジトリへの書き込み権限を確認します。認証トークンをリポジトリ内へ保存しないでください。

### GitHubへpushしたのに公開サイトが変わらない

GitHubへの保存後にSitesへの公開が必要です。公開後も古い場合は、シークレットウィンドウか強制再読み込みで確認します。

### Sitesへ公開できない

同じSitesプロジェクトを操作できるChatGPT／Codexアカウントであること、`.openai/hosting.json`が存在すること、`npm run verify`が成功することを確認します。

### PDFの日本語が表示されない

`TOYOTA_AI_JP_FONT`へ別Macにある日本語TTF/TTCの絶対パスを設定します。

## 10. 引き継ぎ完了チェック

- [ ] 新しいMacでGitHubへログインした
- [ ] 現在のSitesを操作できるChatGPT／Codexアカウントでログインした
- [ ] リポジトリをcloneした
- [ ] `npm ci`が完了した
- [ ] `npm run doctor`が成功した
- [ ] ローカルサイトを開けた
- [ ] 4ページとPDFを確認した
- [ ] 文章を1か所変更し、元に戻す操作を試した
- [ ] `npm run verify`が成功した
- [ ] GitHubへcommit・pushできた
- [ ] Sitesへ一般公開できた
- [ ] シークレットウィンドウとスマートフォンで公開サイトを確認した
- [ ] GitHubとChatGPT／Codexの2段階認証・復旧方法を確認した
