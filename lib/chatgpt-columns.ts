/**
 * ChatGPT / Codex 入門コラムの静的な正本。
 *
 * 製品仕様は変わるため、料金、上限、画面上の位置は固定して断定しない。
 * 更新時は公式資料を確認し、sourceIds と chatgptColumnSources を合わせて直す。
 */

export const chatgptColumnCategoryIds = [
  'getting-started',
  'permissions',
  'models-and-plans',
  'skills-and-plugins',
  'schedules',
  'projects-and-files',
  'memory-and-settings',
  'web-and-browser',
  'local-cloud-and-git',
  'github-and-review',
] as const;

export type ChatgptColumnCategoryId = (typeof chatgptColumnCategoryIds)[number];

export const chatgptColumnSourceIds = [
  'use-chatgpt',
  'prompting',
  'permission-modes',
  'models',
  'pricing',
  'skills-and-plugins',
  'plugins',
  'mcp',
  'automations',
  'projects',
  'artifacts-viewer',
  'image-inputs',
  'memories',
  'personalize',
  'browser',
  'web-search',
  'computer-use',
  'notifications',
  'environment-modes',
  'local-environment',
  'cloud-environment',
  'cloud',
  'git-worktrees',
  'github',
  'local-security',
  'github-about',
  'github-repositories',
  'git-about',
  'mdn-web',
] as const;

export type ChatgptColumnSourceId = (typeof chatgptColumnSourceIds)[number];

export type ChatgptColumnSource = {
  id: ChatgptColumnSourceId;
  label: string;
  url: `https://${string}`;
};

export type ChatgptColumnCategory = {
  id: ChatgptColumnCategoryId;
  label: string;
  description: string;
};

export type ChatgptColumn = {
  id: number;
  slug: string;
  category: ChatgptColumnCategoryId;
  title: string;
  lead: string;
  answer: string;
  explanation: string;
  steps: readonly string[];
  example: string;
  caution: string;
  sourceIds: readonly ChatgptColumnSourceId[];
  keywords: readonly string[];
  starter?: boolean;
};

export const chatgptColumnSources = [
  {
    id: 'use-chatgpt',
    label: 'ChatGPTの使い方｜OpenAI公式',
    url: 'https://learn.chatgpt.com/docs/use-chatgpt',
  },
  {
    id: 'prompting',
    label: 'プロンプトの基本｜OpenAI公式',
    url: 'https://learn.chatgpt.com/docs/prompting',
  },
  {
    id: 'permission-modes',
    label: 'アクセス権の設定｜OpenAI公式',
    url: 'https://learn.chatgpt.com/docs/permission-modes',
  },
  {
    id: 'models',
    label: 'モデルの選び方｜OpenAI公式',
    url: 'https://learn.chatgpt.com/docs/models',
  },
  {
    id: 'pricing',
    label: 'プランと利用量｜OpenAI公式',
    url: 'https://learn.chatgpt.com/docs/pricing',
  },
  {
    id: 'skills-and-plugins',
    label: 'スキルとプラグイン｜OpenAI公式',
    url: 'https://learn.chatgpt.com/docs/skills-and-plugins',
  },
  {
    id: 'plugins',
    label: 'プラグインの使い方｜OpenAI公式',
    url: 'https://learn.chatgpt.com/docs/plugins',
  },
  {
    id: 'mcp',
    label: 'MCPによる外部連携｜OpenAI公式',
    url: 'https://learn.chatgpt.com/docs/extend/mcp',
  },
  {
    id: 'automations',
    label: 'スケジュール機能｜OpenAI公式',
    url: 'https://learn.chatgpt.com/docs/automations',
  },
  {
    id: 'projects',
    label: 'プロジェクトの使い方｜OpenAI公式',
    url: 'https://learn.chatgpt.com/docs/projects',
  },
  {
    id: 'artifacts-viewer',
    label: '作成ファイルの確認｜OpenAI公式',
    url: 'https://learn.chatgpt.com/docs/artifacts-viewer',
  },
  {
    id: 'image-inputs',
    label: '画像を見せる方法｜OpenAI公式',
    url: 'https://learn.chatgpt.com/docs/image-inputs',
  },
  {
    id: 'memories',
    label: 'メモリの使い方｜OpenAI公式',
    url: 'https://learn.chatgpt.com/docs/customization/memories',
  },
  {
    id: 'personalize',
    label: 'ChatGPTの個人設定｜OpenAI公式',
    url: 'https://learn.chatgpt.com/docs/personalize',
  },
  {
    id: 'browser',
    label: 'ブラウザの使い方｜OpenAI公式',
    url: 'https://learn.chatgpt.com/docs/browser',
  },
  {
    id: 'web-search',
    label: 'Web検索の使い方｜OpenAI公式',
    url: 'https://learn.chatgpt.com/docs/web-search',
  },
  {
    id: 'computer-use',
    label: '画面操作の使い方｜OpenAI公式',
    url: 'https://learn.chatgpt.com/docs/computer-use',
  },
  {
    id: 'notifications',
    label: '通知の設定｜OpenAI公式',
    url: 'https://learn.chatgpt.com/docs/notifications',
  },
  {
    id: 'environment-modes',
    label: '作業環境の違い｜OpenAI公式',
    url: 'https://learn.chatgpt.com/docs/environments/modes',
  },
  {
    id: 'local-environment',
    label: 'ローカル環境の使い方｜OpenAI公式',
    url: 'https://learn.chatgpt.com/docs/environments/local-environment',
  },
  {
    id: 'cloud-environment',
    label: 'クラウド環境の準備｜OpenAI公式',
    url: 'https://learn.chatgpt.com/docs/environments/cloud-environment',
  },
  {
    id: 'cloud',
    label: 'Codex Cloudの使い方｜OpenAI公式',
    url: 'https://learn.chatgpt.com/docs/cloud',
  },
  {
    id: 'git-worktrees',
    label: 'Git Worktreeの使い方｜OpenAI公式',
    url: 'https://learn.chatgpt.com/docs/environments/git-worktrees',
  },
  {
    id: 'github',
    label: 'CodexとGitHubの連携｜OpenAI公式',
    url: 'https://learn.chatgpt.com/docs/third-party/github',
  },
  {
    id: 'local-security',
    label: 'ローカル作業の安全性｜OpenAI公式',
    url: 'https://learn.chatgpt.com/docs/enterprise/chatgpt-work-local-security',
  },
  {
    id: 'github-about',
    label: 'GitHubとは｜GitHub公式',
    url: 'https://docs.github.com/en/get-started/start-your-journey/what-is-github',
  },
  {
    id: 'github-repositories',
    label: 'リポジトリとは｜GitHub公式',
    url: 'https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories',
  },
  {
    id: 'git-about',
    label: 'Gitとは｜Git公式',
    url: 'https://git-scm.com/about',
  },
  {
    id: 'mdn-web',
    label: 'Webの仕組み｜MDN公式',
    url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works',
  },
] as const satisfies readonly ChatgptColumnSource[];

export const chatgptColumnCategories = [
  {
    id: 'getting-started',
    label: 'まず使ってみる',
    description: 'ChatGPTに頼む、直す、確かめるための基本です。',
  },
  {
    id: 'permissions',
    label: 'アクセス権と安全',
    description: '任せてよい範囲と、確認が必要な場面を知ります。',
  },
  {
    id: 'models-and-plans',
    label: 'モデルとプラン',
    description: 'モデル、考える深さ、利用量の見方を整理します。',
  },
  {
    id: 'skills-and-plugins',
    label: 'スキルと連携',
    description: 'いつもの手順や外部サービスを安全につなぎます。',
  },
  {
    id: 'schedules',
    label: 'スケジュール',
    description: '決まった仕事を、決まった時や出来事に合わせて動かします。',
  },
  {
    id: 'projects-and-files',
    label: 'プロジェクトと資料',
    description: '会話、資料、成果物を迷わず整理します。',
  },
  {
    id: 'memory-and-settings',
    label: 'メモリと設定',
    description: '覚えてもらうことと、毎回守る指示を分けます。',
  },
  {
    id: 'web-and-browser',
    label: '検索とブラウザ',
    description: '調べる操作と、画面を動かす操作の違いを学びます。',
  },
  {
    id: 'local-cloud-and-git',
    label: '作業場所とGit',
    description: 'Local、Worktree、Cloudと変更履歴の基本です。',
  },
  {
    id: 'github-and-review',
    label: 'GitHubとレビュー',
    description: 'コードを共有し、AIと人で安全に確認します。',
  },
] as const satisfies readonly ChatgptColumnCategory[];

type ChatgptColumnDraft = Omit<ChatgptColumn, 'id' | 'category'>;

type TenColumnDrafts = readonly [
  ChatgptColumnDraft,
  ChatgptColumnDraft,
  ChatgptColumnDraft,
  ChatgptColumnDraft,
  ChatgptColumnDraft,
  ChatgptColumnDraft,
  ChatgptColumnDraft,
  ChatgptColumnDraft,
  ChatgptColumnDraft,
  ChatgptColumnDraft,
];

function defineColumns(
  category: ChatgptColumnCategoryId,
  firstId: number,
  drafts: TenColumnDrafts,
): readonly ChatgptColumn[] {
  return drafts.map((draft, index) => ({
    ...draft,
    id: firstId + index,
    category,
  }));
}

const unsortedChatgptColumns = [
  ...defineColumns('getting-started', 1, [
    {
      slug: 'chat-work-codex',
      title: 'Chat・Work・Codexは、どう使い分ける？',
      lead: '名前は似ていますが、向いている仕事が少し違います。',
      answer:
        '短いやり取りはChat、まとまった成果物づくりはWork、コードや開発作業はCodexが目安です。',
      explanation:
        '大切なのは名前を覚えることより、今ほしい結果に合う入口を選ぶことです。合わなければ途中で変えてかまいません。',
      steps: [
        '今ほしいものを一言で決める',
        '会話・成果物・開発のどれかを選ぶ',
        '合わなければ別の方法へ切り替える',
      ],
      example: '質問ならChat、資料を仕上げたいならWorkを選びます。',
      caution:
        '使える機能や表示名は、利用環境やプランによって変わることがあります。',
      sourceIds: ['use-chatgpt'],
      keywords: ['ChatGPT', 'Chat', 'Work', 'Codex', '使い分け'],
      starter: true,
    },
    {
      slug: 'prompt-basics',
      title: 'プロンプトって、そもそも何？',
      lead: '難しい命令文ではなく、AIへ渡すお願いや材料のことです。',
      answer:
        '質問、お願い、目標、参考資料は、どれもプロンプトになります。きれいな文章より、してほしいことが伝わる方が大切です。',
      explanation:
        'AIは、受け取った言葉や資料を手がかりに答えます。短くても、目的がはっきりしていれば始められます。',
      steps: [
        'してほしいことを書く',
        '必要な材料を貼るか添付する',
        '結果を見て追加で頼む',
      ],
      example: 'このメールを、取引先へ送る丁寧な文章に直してください。',
      caution: '個人情報や社外秘は、利用ルールを確認してから渡してください。',
      sourceIds: ['prompting'],
      keywords: ['プロンプト', '頼み方', '質問', '指示'],
      starter: true,
    },
    {
      slug: 'prompt-four-parts',
      title: '頼み方は、4つに分けると伝わりやすい',
      lead: '目的、材料、完成形、守ってほしいこと。この4つで十分です。',
      answer:
        '何を作るか、何を使うか、どんな形にするか、何を変えないかを順に書くと、やり直しが減ります。',
      explanation:
        '長い文章にする必要はありません。4つを箇条書きにすると、自分でも条件を確かめやすくなります。',
      steps: [
        '目的を書く',
        '材料とほしい完成形を書く',
        '変えてはいけない点を書く',
      ],
      example:
        '社内告知を作る。添付メモを使う。300字以内。日付と料金は変えない。',
      caution: '分からない条件は無理に決めず、AIに質問してもらって構いません。',
      sourceIds: ['prompting'],
      keywords: ['目的', '材料', '完成形', '条件', 'プロンプト'],
      starter: true,
    },
    {
      slug: 'what-is-chatgpt',
      title: 'ChatGPTは、何ができるもの？',
      lead: '相談するだけでなく、文章、資料、画像、調査などを一緒に進められます。',
      answer:
        'ChatGPTは、言葉や添付した資料をもとに、質問へ答えたり、案を作ったり、成果物づくりを手伝ったりするAIです。',
      explanation:
        '何でも自動で正解にする道具ではありません。人が目的と材料を伝え、結果を確かめながら使う仕事相手と考えると分かりやすくなります。',
      steps: [
        '身近な困りごとを一つ選ぶ',
        'してほしいことと材料を伝える',
        '答えを確認し、必要な修正を頼む',
      ],
      example: 'このメモから、今日やることを三つに整理してください。',
      caution:
        '重要な事実、数字、判断は、元資料や公式情報と照らして確認してください。',
      sourceIds: ['use-chatgpt', 'prompting'],
      keywords: ['ChatGPT', 'AI', 'できること', '初心者'],
      starter: true,
    },
    {
      slug: 'iterate-the-answer',
      title: '一度で決めず、会話しながら直す',
      lead: '最初の答えは、完成品ではなく、たたき台でもかまいません。',
      answer:
        '良かった点と直したい点を続けて伝えると、前の内容をもとに改善できます。',
      explanation:
        'ゼロから頼み直すより、『ここは残す』『ここだけ直す』と伝える方が、希望する形へ近づけやすくなります。',
      steps: [
        '最初の案を出してもらう',
        '残す点と直す点を伝える',
        '最後に全体を読み直す',
      ],
      example:
        '内容はこのまま、少し短くして、見出しだけ親しみやすくしてください。',
      caution: '修正が増えたら、最後に条件をまとめ直すと混乱を防げます。',
      sourceIds: ['prompting'],
      keywords: ['修正', '会話', '改善', 'たたき台'],
      starter: true,
    },
    {
      slug: 'rough-notes-are-enough',
      title: '箇条書きのメモでも頼める',
      lead: '文章になる前のメモも、AIにとっては立派な材料です。',
      answer:
        '単語や箇条書きを渡し、誰向けの何に整えたいかを伝えれば使えます。',
      explanation:
        '人に見せる前の雑なメモほど、整理に時間がかかります。その最初の整頓をAIへ任せられます。',
      steps: [
        '手元のメモをそのまま貼る',
        '読む相手と用途を書く',
        '足りない情報を質問してもらう',
      ],
      example: 'この箇条書きを、初めて来るお客様向けの案内文にしてください。',
      caution: '事実の抜けは、AIに想像で埋めさせず自分で確認してください。',
      sourceIds: ['prompting'],
      keywords: ['メモ', '箇条書き', '文章化', '初心者'],
      starter: true,
    },
    {
      slug: 'prompt-with-files',
      title: 'ファイルを添付した方が早い仕事',
      lead: '元の資料があるなら、説明し直すよりそのまま渡せる場合があります。',
      answer: '文書、表、PDF、画像などを添付し、どこを見て何を作るか伝えます。',
      explanation:
        '材料と目的がそろうほど、会話だけで内容を説明する手間が減ります。元資料との比較もしやすくなります。',
      steps: [
        '使ってよいファイルを選ぶ',
        '見る場所と作るものを書く',
        '完成後に元資料と見比べる',
      ],
      example: '添付の議事録から、担当者と期限だけを表にしてください。',
      caution: '添付できる形式や容量は、利用環境によって異なることがあります。',
      sourceIds: ['use-chatgpt', 'prompting'],
      keywords: ['添付', 'ファイル', 'PDF', '表', '資料'],
      starter: true,
    },
    {
      slug: 'name-the-reader',
      title: '誰が読むかを書くと、答えが変わる',
      lead: '同じ内容でも、お客様向けと社内向けでは言葉が違います。',
      answer:
        '読む人の知識、立場、読む場面を一言加えると、説明の長さや言葉選びを合わせやすくなります。',
      explanation:
        'AIは読み手を知らないままでは、無難な文章を作りがちです。相手が見えると、伝わり方を調整できます。',
      steps: [
        '読む人を決める',
        'いつどこで読むかを足す',
        '読み手になったつもりで確認する',
      ],
      example:
        'パソコンが苦手な新入社員向けに、専門用語なしで説明してください。',
      caution:
        '相手を決めつける表現になっていないか、人が最後に確認してください。',
      sourceIds: ['prompting'],
      keywords: ['読み手', '対象者', '文章', '伝え方'],
      starter: true,
    },
    {
      slug: 'protect-what-must-not-change',
      title: '「ここは変えないで」を先に伝える',
      lead: 'AIに任せる部分と、人が決めた部分を分けておきます。',
      answer:
        '固有名詞、数字、引用、社内ルールなど、変わると困る箇所を明記します。',
      explanation:
        '自由に直してよい範囲も一緒に示すと、AIは手を入れる場所を判断しやすくなります。',
      steps: [
        '変えてはいけない箇所を選ぶ',
        '自由に直せる範囲を伝える',
        '完成後に固定箇所を照合する',
      ],
      example: '商品名と価格は変えず、説明文だけ読みやすくしてください。',
      caution: '数字や契約条件は、指示していても必ず元資料と照合してください。',
      sourceIds: ['prompting'],
      keywords: ['制約', '数字', '固有名詞', '確認'],
    },
    {
      slug: 'verify-output',
      title: 'AIが作ったものは、開いて確かめる',
      lead: '「できました」と表示されても、中身の確認はまだ残っています。',
      answer: '文章なら読み、表なら数字を見比べ、ファイルなら実際に開きます。',
      explanation:
        'AIは間違えることがあります。使う人の目で見て、目的を満たしたか確かめて初めて完成です。',
      steps: [
        '完成品を実際に開く',
        '元資料と大事な箇所を比べる',
        '誤りを直してから共有する',
      ],
      example: '作成したPDFを開き、文字切れと日付と連絡先を確認します。',
      caution:
        'プレビュー機能や対応形式は、使う画面によって異なる場合があります。',
      sourceIds: ['artifacts-viewer', 'prompting'],
      keywords: ['確認', 'プレビュー', '成果物', 'ファイル'],
      starter: true,
    },
  ]),

  ...defineColumns('local-cloud-and-git', 81, [
    {
      slug: 'local-worktree-cloud',
      title: 'Local・Worktree・Cloudは、何が違う？',
      lead: 'どこでファイルを扱い、どの作業と分けるかが違います。',
      answer:
        'Localは今のフォルダ、Worktreeは同じGitプロジェクトの別作業場、Cloudは離れた専用環境で進める方式です。',
      explanation:
        '一人で今の作業を直す、並行して試す、端末から離して任せるなど、目的に合わせて場所を選びます。',
      steps: [
        '今のフォルダを直接直してよいか考える',
        '並行作業や遠隔実行が必要か見る',
        '結果をどこで確認するか決める',
      ],
      example:
        '小さな修正はLocal、別案はWorktree、長い調査はCloudを検討します。',
      caution:
        '使える環境や機能は、アプリ、プラン、組織設定によって異なる場合があります。',
      sourceIds: ['environment-modes'],
      keywords: ['Local', 'Worktree', 'Cloud', '作業環境'],
      starter: true,
    },
    {
      slug: 'local-basics',
      title: 'Localは、今のフォルダを直接使う',
      lead: '自分のパソコンにある実際のファイルを見ながら作業します。',
      answer:
        'Localでは、選んだプロジェクトの現在のフォルダで読み取り、編集、確認を進めます。',
      explanation:
        '結果がすぐ手元へ反映される一方、途中のファイルへ直接変更が入るため、対象を確かめて頼みます。',
      steps: [
        '正しいプロジェクトを開く',
        '未保存や途中の変更を確認する',
        '変更後に差分と動作を見る',
      ],
      example: '今開発しているサイトの文字を一か所だけ直します。',
      caution: 'Localはオフラインや端末内だけのAI処理を意味しません。',
      sourceIds: ['environment-modes', 'local-environment', 'local-security'],
      keywords: ['Local', 'フォルダ', 'ローカル', '編集'],
      starter: true,
    },
    {
      slug: 'worktree-basics',
      title: 'Worktreeは、作業用の別コピー',
      lead: '今の作業を残したまま、同じプロジェクトの別案を進められます。',
      answer:
        'Git Worktreeは、同じリポジトリから別の作業フォルダを作り、変更を分けて進める仕組みです。',
      explanation:
        '複数の仕事が同じファイルへ混ざりにくくなり、終わった差分だけを確認して取り込めます。',
      steps: [
        '元の作業状態を確認する',
        '新しいWorktreeを作る',
        '完成後に差分を確認して取り込む',
      ],
      example:
        '公開中の修正を保ちながら、新しいデザインを別のWorktreeで試します。',
      caution:
        'Worktreeは自動バックアップではありません。必要な変更はGitで記録してください。',
      sourceIds: ['git-worktrees', 'git-about'],
      keywords: ['Worktree', 'Git', '並行作業', '別コピー'],
      starter: true,
    },
    {
      slug: 'worktree-needs-git',
      title: 'Worktreeを使うには、Gitのプロジェクトが必要',
      lead: 'ただのフォルダでは、変更を枝分かれさせる土台がありません。',
      answer:
        'WorktreeはGitの機能なので、対象がGitリポジトリとして管理されている必要があります。',
      explanation:
        'Gitがどのファイルを追い、どこから分かれたかを記録することで、別作業場を安全に作れます。',
      steps: [
        '対象がGitリポジトリか確認する',
        '元になる状態を確認する',
        'Worktreeを作って作業する',
      ],
      example:
        '写真だけの普通のフォルダではなく、Git管理されたサイトで使います。',
      caution:
        'Git管理を始める前に、秘密情報や大容量ファイルを記録しない設定を確認してください。',
      sourceIds: ['git-worktrees', 'git-about'],
      keywords: ['Worktree', 'Git', 'リポジトリ', '前提'],
    },
    {
      slug: 'handoff-worktree',
      title: 'Handoffは、作業場所を移すこと',
      lead: '会話と変更を保ちながら、LocalとWorktreeの間を移せる場合があります。',
      answer:
        'Handoffを使うと、同じ仕事を現在のフォルダから別作業場へ、または戻す形で引き継げます。',
      explanation:
        '途中までの説明をやり直さず、作業場所だけを変えたい時に役立ちます。移動後の状態は必ず確認します。',
      steps: [
        '現在の変更と実行中の作業を見る',
        '移動先を選んでHandoffする',
        '移動後に会話と差分を確認する',
      ],
      example: '今のフォルダで始めた大きな改修を、途中からWorktreeへ移します。',
      caution:
        '実行中の作業が止まる場合や、移らないファイルがあるため、事前に状態を確認してください。',
      sourceIds: ['git-worktrees'],
      keywords: ['Handoff', 'Local', 'Worktree', '引き継ぎ'],
    },
    {
      slug: 'gitignore-and-worktree',
      title: '.gitignoreのファイルが、別作業場に来ない理由',
      lead: 'Gitが記録していないファイルは、Worktreeへ自動で渡らないことがあります。',
      answer:
        '設定ファイルや生成物など、Gitの追跡外にしたファイルは、別のWorktreeに同じように現れるとは限りません。',
      explanation:
        'Worktreeはフォルダ丸ごとのコピーではなく、Gitが管理する内容から別の作業場を作るためです。',
      steps: [
        '足りないファイルが追跡対象か見る',
        '秘密情報か生成物かを判断する',
        '必要なら安全な共有方法を決める',
      ],
      example: '.envがない時は、Gitへ入れず、決められた方法で設定します。',
      caution:
        '秘密情報をWorktreeへ渡すために、安易にGitへ追加しないでください。',
      sourceIds: ['git-worktrees', 'git-about'],
      keywords: ['.gitignore', 'Worktree', '追跡外', '環境変数'],
    },
    {
      slug: 'cloud-basics',
      title: 'Cloudは、離れた専用環境で作業する',
      lead: '自分のパソコンとは別の隔離された環境で、Codexへ仕事を任せます。',
      answer:
        'Cloudでは、選んだリポジトリの状態から専用環境を作り、コードの編集やテストを進めます。',
      explanation:
        '複数の仕事を並行しやすく、自分の端末を直接使わず進められます。結果は差分として確認します。',
      steps: [
        '対象のリポジトリと開始状態を選ぶ',
        '目的と確認方法を伝える',
        '返ってきた差分とテスト結果を見る',
      ],
      example: '別の改善案をCloudへ任せ、完成後に変更だけを確認します。',
      caution:
        'Cloudで作業できるリポジトリや機能は、接続設定やプランで異なる場合があります。',
      sourceIds: ['cloud', 'cloud-environment'],
      keywords: ['Cloud', 'Codex', '隔離環境', '差分'],
      starter: true,
    },
    {
      slug: 'cloud-setup',
      title: 'Cloudの最初に、セットアップが必要な理由',
      lead: '新しい作業環境には、プロジェクトを動かす準備がまだありません。',
      answer:
        '必要なソフトや依存関係を入れ、テストやビルドが動く状態にするため、セットアップ手順を用意します。',
      explanation:
        '自分のパソコンではすでに入っている道具も、毎回作るCloud環境には入っていない場合があります。',
      steps: [
        '必要な実行環境を洗い出す',
        '再現できるセットアップ手順を書く',
        '新しい環境でビルドやテストを試す',
      ],
      example: 'npm ciを実行してからテストする手順を、Cloud環境へ設定します。',
      caution: 'セットアップへAPIキーなどの秘密情報を直接書かないでください。',
      sourceIds: ['cloud-environment', 'cloud'],
      keywords: ['Cloud', 'セットアップ', '依存関係', 'ビルド'],
    },
    {
      slug: 'cloud-network',
      title: 'Cloudのネット接続は、最初から自由ではない',
      lead: '安全のため、エージェントが使えるネットワークを制限できる仕組みです。',
      answer:
        'Cloud環境では、セットアップ時と作業中でネット接続の扱いが異なり、作業中は初期状態で制限される案内があります。',
      explanation:
        '外部から悪い指示を受けたり、情報を外へ送ったりする危険を減らすためです。必要な接続だけを検討します。',
      steps: [
        '本当に外部接続が必要か確認する',
        '必要な接続先を狭くする',
        '取得内容と結果を確認する',
      ],
      example:
        '公式パッケージの取得だけをセットアップ時に行い、作業中の接続は増やしません。',
      caution:
        '現在の初期設定や許可方法は変わる可能性があるため、公式案内を確認してください。',
      sourceIds: ['cloud-environment', 'cloud'],
      keywords: ['Cloud', 'ネットワーク', 'インターネット', '安全'],
    },
    {
      slug: 'localhost-vs-public-url',
      title: 'localhostは、自分のパソコンだけの確認用',
      lead: '画面が開いても、そのまま他の人へ公開されているわけではありません。',
      answer:
        'localhostは、今使っている端末自身を指す特別な場所です。公開URLとは別なので、公開作業と公開先の確認が必要です。',
      explanation:
        '開発中の画面と、インターネット上で誰でも見られる画面は別々に動きます。片方の成功だけで公開完了とは言えません。',
      steps: [
        'localhostで動作を確認する',
        '決められた公開先へ反映する',
        '公開URLを別の画面で開いて確認する',
      ],
      example:
        'localhost:3000で直った後、実際のサイトURLでも同じ表示か見ます。',
      caution:
        '公開方法はサービスごとに違います。ローカル表示を公開済みとは案内しないでください。',
      sourceIds: ['mdn-web', 'local-environment'],
      keywords: ['localhost', '公開URL', 'Web', 'ローカル'],
      starter: true,
    },
  ]),

  ...defineColumns('github-and-review', 91, [
    {
      slug: 'git-basics',
      title: 'Gitは、変更の記録を残す仕組み',
      lead: 'いつ、何を変えたかを追い、必要なら比べたり戻したりできます。',
      answer:
        'Gitは、ファイルの変更履歴を記録し、複数の作業を分けて管理するための仕組みです。',
      explanation:
        'ただのコピーとは違い、変更のまとまりや枝分かれを記録できます。Codexの差分確認にも使われます。',
      steps: [
        '管理するプロジェクトを決める',
        '変更内容を差分で確認する',
        '意味のある区切りで記録する',
      ],
      example: '見出しを直した変更と、料金を直した変更を別の記録にします。',
      caution:
        'Gitは自動で正しい変更を選びません。記録前に差分を確認してください。',
      sourceIds: ['git-about'],
      keywords: ['Git', '変更履歴', '差分', '管理'],
      starter: true,
    },
    {
      slug: 'repository-basics',
      title: 'リポジトリは、変更履歴付きの保管場所',
      lead: 'プロジェクトのファイルと、その変更の記録をまとめます。',
      answer:
        'リポジトリは、コードや資料、その変更履歴を一つの単位として管理する場所です。',
      explanation:
        'Codexへ『どのサイトを直すか』を伝える時も、対象のリポジトリが仕事の境界になります。',
      steps: [
        '対象のリポジトリ名を確認する',
        '中のファイルと説明を読む',
        '正しいリポジトリで作業する',
      ],
      example: '会社サイトと予約システムを別のリポジトリで管理します。',
      caution: '公開リポジトリへ秘密情報や個人情報を入れないでください。',
      sourceIds: ['github-repositories', 'git-about'],
      keywords: ['リポジトリ', 'Git', '保管場所', 'プロジェクト'],
      starter: true,
    },
    {
      slug: 'branch-basics',
      title: 'ブランチは、本番を壊さず試す作業線',
      lead: '現在の完成版から枝分かれし、別の変更を進めます。',
      answer:
        'ブランチを使うと、元の状態を保ちながら新しい機能や修正を別に記録できます。',
      explanation:
        '完成して確認した変更だけを後でまとめられるため、途中の作業が本番へ混ざりにくくなります。',
      steps: [
        '元になる状態を確認する',
        '目的が分かるブランチを作る',
        '完成後に差分を確認して統合する',
      ],
      example: '新しい申込画面を専用ブランチで作り、確認後にmainへ入れます。',
      caution:
        'ブランチを作っただけでは公開されません。統合と公開は別の作業です。',
      sourceIds: ['git-about', 'git-worktrees', 'github-repositories'],
      keywords: ['ブランチ', 'Git', 'main', '統合'],
      starter: true,
    },
    {
      slug: 'commit-basics',
      title: 'コミットは、作業の区切りを残す記録',
      lead: '変更をひとまとめにし、何をしたか名前を付けて残します。',
      answer:
        'コミットは、確認した変更のまとまりをGitの履歴へ記録する操作です。',
      explanation:
        '小さく意味のある区切りで残すと、後から原因を探したり、必要な変更だけを確認したりしやすくなります。',
      steps: [
        '変更差分を確認する',
        '一つの目的に関係する変更を選ぶ',
        '内容が分かる言葉で記録する',
      ],
      example:
        '『申込ボタンの文言を修正』という一つの変更としてコミットします。',
      caution:
        'コミットしても、GitHubへの送信やサイト公開まで終わったとは限りません。',
      sourceIds: ['git-about'],
      keywords: ['コミット', 'Git', '変更', '記録'],
      starter: true,
    },
    {
      slug: 'github-basics',
      title: 'GitHubは、何をする場所？',
      lead: 'Gitで管理したプロジェクトを、共有し、相談し、確認できるサービスです。',
      answer:
        'GitHubでは、リポジトリを保管し、変更の提案、レビュー、共同作業などを行えます。',
      explanation:
        'Gitが変更を記録する仕組みで、GitHubはその記録をチームやサービスと扱いやすくする場所です。',
      steps: [
        'GitHubのアカウントと組織を確認する',
        '対象のリポジトリを開く',
        '変更と権限を確認して共同作業する',
      ],
      example: 'Codexが作った変更をGitHubへ提案し、担当者が内容を確認します。',
      caution:
        'リポジトリが公開か非公開かを確認し、秘密情報を置かないでください。',
      sourceIds: ['github-about', 'github-repositories'],
      keywords: ['GitHub', 'Git', '共同作業', 'リポジトリ'],
      starter: true,
    },
    {
      slug: 'github-connect',
      title: 'Codexへ見せるGitHubリポジトリは選べる',
      lead: 'GitHub全体ではなく、仕事に必要なリポジトリへ接続を絞ります。',
      answer:
        'CodexのCloudやレビューを使う時は、接続を許可したGitHubリポジトリから対象を選びます。',
      explanation:
        '必要な場所だけへアクセスを限定すると、別案件や秘密のコードを誤って扱う危険を減らせます。',
      steps: [
        '接続するGitHubアカウントを確認する',
        '必要なリポジトリだけを選ぶ',
        '不要になった接続を見直す',
      ],
      example: '今回直す会社サイトのリポジトリだけをCodexへ許可します。',
      caution:
        '接続設定や必要な権限は、組織の管理方法によって異なる場合があります。',
      sourceIds: ['cloud', 'github'],
      keywords: ['GitHub連携', 'Codex', 'リポジトリ', '権限'],
      starter: true,
    },
    {
      slug: 'codex-review',
      title: 'GitHubで「@codex review」と書くと、何が起きる？',
      lead: '変更内容をCodexへ確認してもらう合図として使えます。',
      answer:
        '接続されたリポジトリのプルリクエストで、Codexへコードレビューを依頼できます。',
      explanation:
        '人が見落としやすい不具合や注意点を、変更差分に沿って探す補助になります。',
      steps: [
        '対象のプルリクエストを開く',
        'レビューを依頼するコメントを書く',
        '指摘の根拠を確認して対応を決める',
      ],
      example:
        '修正案を出した後、@codex review とコメントして確認を依頼します。',
      caution: '利用にはGitHub連携や対象リポジトリの設定が必要です。',
      sourceIds: ['github'],
      keywords: ['@codex review', 'GitHub', 'コードレビュー', 'プルリクエスト'],
    },
    {
      slug: 'automatic-code-review',
      title: '自動レビューを設定する前に、権限を確認',
      lead: 'すべての変更を自動で見てもらうには、リポジトリ側の設定が必要です。',
      answer:
        '自動レビューを有効にするには、GitHub接続に加え、対象リポジトリで必要な権限が求められます。',
      explanation:
        'チーム全体のレビューの流れを変える設定なので、誰でも勝手に有効にできないよう管理されます。',
      steps: [
        '対象リポジトリと権限を確認する',
        'チームのレビュー方法を決める',
        '小さな変更で自動レビューを試す',
      ],
      example: '管理者と相談し、特定のリポジトリだけで自動レビューを始めます。',
      caution:
        '必要な権限や設定画面は変わる場合があるため、現在の公式手順を確認してください。',
      sourceIds: ['github'],
      keywords: ['自動レビュー', 'GitHub', '管理者権限', '設定'],
    },
    {
      slug: 'agents-review-rules',
      title: 'AGENTS.mdで、レビューの見方を伝える',
      lead: 'そのプロジェクトで特に守る点を、Codexへ共有できます。',
      answer:
        'AGENTS.mdへ確認方法や注意する領域を書くと、Codexのレビューでもプロジェクト固有のルールを使えます。',
      explanation:
        '一般的な正しさだけでなく、『公開前にこの検査をする』など、チームの完成条件へ合わせられます。',
      steps: [
        '必ず守る確認項目を選ぶ',
        '短く具体的にAGENTS.mdへ書く',
        '実際のレビューで反映を確かめる',
      ],
      example: '料金変更では、表示と申込画面の両方を確認する、と書きます。',
      caution:
        '古いルールを残すと誤った確認につながるため、プロジェクトと一緒に更新してください。',
      sourceIds: ['github', 'personalize'],
      keywords: ['AGENTS.md', 'レビュー', 'ルール', 'Codex'],
    },
    {
      slug: 'ai-review-needs-tests',
      title: 'AIレビューだけで、テストを省かない',
      lead: 'レビューは助言であり、実際に動くことの証明ではありません。',
      answer:
        'Codexの指摘を参考にしながら、自動テスト、ビルド、画面確認、人の承認も組み合わせます。',
      explanation:
        'コードを読んで分かる問題と、実行して初めて出る問題は違います。複数の確認で完成を判断します。',
      steps: [
        'AIレビューの指摘を確認する',
        '必要なテストとビルドを実行する',
        '重要な変更を人が最終確認する',
      ],
      example:
        'レビューで問題なしでも、申込画面を開き、送信直前まで操作します。',
      caution:
        'AIの『問題ありません』を、公開や安全性の保証として扱わないでください。',
      sourceIds: ['github', 'prompting'],
      keywords: ['AIレビュー', 'テスト', 'ビルド', '人の確認'],
      starter: true,
    },
  ]),
  ...defineColumns('projects-and-files', 51, [
    {
      slug: 'project-vs-chat',
      title: 'プロジェクトと普通のチャットは、何が違う？',
      lead: '一度だけの会話か、資料を共有しながら続ける仕事かで選びます。',
      answer:
        '単発の質問はチャット、同じ資料や前提を使って複数の仕事を続けるならプロジェクトが向いています。',
      explanation:
        'プロジェクトへ関係する会話や資料をまとめると、次にどこから始めるか迷いにくくなります。',
      steps: [
        '一度で終わる仕事か考える',
        '続く仕事ならプロジェクトを作る',
        '成果物ごとにチャットを分ける',
      ],
      example:
        '会社案内の質問はChat、採用サイト一式の制作はプロジェクトにします。',
      caution:
        'プロジェクトで共有される文脈や機能は、利用環境によって異なる場合があります。',
      sourceIds: ['projects', 'use-chatgpt'],
      keywords: ['プロジェクト', 'チャット', '資料', '継続'],
      starter: true,
    },
    {
      slug: 'reuse-files-in-project',
      title: '同じ資料を何度も使うなら、プロジェクトへ',
      lead: '毎回ファイルを探して添付する手間を減らせます。',
      answer:
        '継続して使う方針書や元データは、関係するプロジェクトにまとめると、複数のチャットで扱いやすくなります。',
      explanation:
        '仕事ごとの材料置き場を決めると、古い資料や別案件のファイルを誤って使う事故も減らせます。',
      steps: [
        '繰り返し使う資料を選ぶ',
        '関係するプロジェクトへまとめる',
        '更新日や正本を分かる名前にする',
      ],
      example:
        'ブランドルールと商品一覧を、サイト制作プロジェクトで共有します。',
      caution:
        '機密資料を入れる前に、組織の利用ルールと共有範囲を確認してください。',
      sourceIds: ['projects'],
      keywords: ['プロジェクト', 'ファイル', '資料', '再利用'],
    },
    {
      slug: 'local-project',
      title: 'ローカルプロジェクトは、フォルダとつながる',
      lead: '自分のパソコンにある作業フォルダを、Codexの仕事場として開けます。',
      answer:
        'ローカルプロジェクトでは、選んだフォルダのファイルを読み、許可された範囲で編集やコマンド実行を行えます。',
      explanation:
        'コピーして貼るだけでなく、実際のプロジェクトを見ながら修正と確認を進められる点が普通の会話との違いです。',
      steps: [
        '対象のフォルダを確認する',
        'ローカルプロジェクトとして開く',
        'アクセス範囲を見てから依頼する',
      ],
      example:
        'ホームページのフォルダを開き、該当ページだけを直してもらいます。',
      caution:
        'ローカルでもデータが完全に端末外へ出ないという意味ではありません。',
      sourceIds: ['projects', 'local-environment', 'local-security'],
      keywords: ['ローカル', 'プロジェクト', 'フォルダ', 'Codex'],
      starter: true,
    },
    {
      slug: 'split-chats-by-output',
      title: '成果物ごとにチャットを分ける',
      lead: '一つの長い会話へ全部入れるより、後から見つけやすくなります。',
      answer:
        '同じプロジェクト内でも、資料作成、調査、修正など、完成させたいものごとにチャットを分けます。',
      explanation:
        '目的の違う話が混ざらないため、AIも前提を取り違えにくく、人も履歴を追いやすくなります。',
      steps: [
        '今回の完成品を一つ決める',
        '専用のチャットを作る',
        '分かる名前を付けて残す',
      ],
      example: '料金表の修正と、採用記事の作成は別のチャットにします。',
      caution:
        '関連する資料は同じプロジェクトへ置き、無関係な案件を混ぜないでください。',
      sourceIds: ['projects'],
      keywords: ['チャット', '成果物', '整理', 'プロジェクト'],
    },
    {
      slug: 'pin-is-navigation',
      title: 'ピン留めしても、AIの権限は増えない',
      lead: 'ピン留めは、よく使う会話を見つけやすくする整理機能です。',
      answer:
        'チャットをピン留めしても、読めるファイルや操作できる範囲が広がるわけではありません。',
      explanation:
        '画面上の並び方と、AIへ与えるアクセス権は別です。安全設定を変えたことにはなりません。',
      steps: [
        'よく使うチャットを選ぶ',
        'ピン留めして上へ置く',
        '権限は別の設定で確認する',
      ],
      example:
        '毎日の相談チャットを上へ置いても、他のフォルダは自動で読めません。',
      caution:
        '共有範囲や権限を確かめる時は、ピンではなくプロジェクトとアクセス設定を見ます。',
      sourceIds: ['projects', 'permission-modes'],
      keywords: ['ピン留め', '整理', '権限', 'チャット'],
    },
    {
      slug: 'archive-finished-chat',
      title: '終わったチャットは、削除よりアーカイブ',
      lead: '一覧をすっきりさせながら、必要な履歴を残せます。',
      answer:
        'もう使わないが記録として残したいチャットは、削除せずアーカイブすると後から戻せます。',
      explanation:
        '削除は取り戻せない場合があります。迷う段階では、見えない場所へ整理する方が安全です。',
      steps: [
        '本当に不要か確認する',
        '迷うものはアーカイブする',
        '必要になったら一覧から戻す',
      ],
      example: '完了した制作相談をアーカイブし、進行中の会話だけを表示します。',
      caution:
        '保存期間や復元方法は、利用する画面の現在の案内を確認してください。',
      sourceIds: ['projects', 'personalize'],
      keywords: ['アーカイブ', '削除', '履歴', '整理'],
    },
    {
      slug: 'attach-files-safely',
      title: 'ファイルを添付する前の3秒確認',
      lead: '目的の資料か、余計な情報が入っていないかを見ます。',
      answer:
        'ファイル名、中身、共有してよい範囲を確認し、今回必要なものだけを添付します。',
      explanation:
        'フォルダごと渡すより必要な資料へ絞る方が、情報漏れとAIの読み違いを減らせます。',
      steps: [
        'ファイルを自分で開く',
        '秘密情報や別案件の内容を確認する',
        '必要なファイルだけ添付する',
      ],
      example: '顧客一覧ではなく、個人情報を外した集計表だけを添付します。',
      caution:
        '添付後に消せるかどうかへ頼らず、送る前に内容を確認してください。',
      sourceIds: ['use-chatgpt', 'prompting'],
      keywords: ['添付', 'ファイル', '個人情報', '安全'],
      starter: true,
    },
    {
      slug: 'image-input-tips',
      title: '画像を渡す時は「どこを見るか」も書く',
      lead: 'スクリーンショットだけより、見てほしい場所を伝える方が正確です。',
      answer:
        '画像を添付し、対象の部分、知りたいこと、ほしい結果を一緒に書きます。',
      explanation:
        '画像には多くの情報があります。注目する場所を絞ると、AIが別の部分へ気を取られにくくなります。',
      steps: [
        '必要な範囲が見える画像を用意する',
        '見る場所を言葉で示す',
        '何を答えてほしいか書く',
      ],
      example: '右上の赤いエラー表示を見て、次に確認する設定を教えてください。',
      caution:
        '画像内の小さな文字や隠れた情報は、正しく読めないことがあります。',
      sourceIds: ['image-inputs'],
      keywords: ['画像', 'スクリーンショット', '添付', 'エラー'],
      starter: true,
    },
    {
      slug: 'image-input-vs-generation',
      title: '画像を見せることと、画像を作ることは別',
      lead: '画像入力は確認、画像生成は新しく作る・直す機能です。',
      answer:
        '手元の画像を調べてほしい時は画像入力、新しい絵を作る、写っている物を変える時は画像生成を使います。',
      explanation:
        '目的を分けて伝えると、『説明してほしいのに画像が変わった』という行き違いを防げます。',
      steps: [
        '見てほしいか作ってほしいか決める',
        '元画像があれば添付する',
        '変えてよい範囲を伝える',
      ],
      example:
        'この画面の問題を説明して、なら画像入力。背景だけ青にして、なら画像編集です。',
      caution: '人物や著作物を扱う時は、利用目的と権利を確認してください。',
      sourceIds: ['image-inputs'],
      keywords: ['画像入力', '画像生成', '画像編集', '違い'],
    },
    {
      slug: 'preview-created-files',
      title: '作ったPDFや表は、プレビューで中身を見る',
      lead: 'ファイル名ができていても、レイアウトや数字が正しいとは限りません。',
      answer:
        '対応するプレビューで開き、文字切れ、ページ数、表の値、見た目を確かめます。',
      explanation:
        '生成したファイルは、元データが正しくても表示時に崩れることがあります。実際に見る確認が必要です。',
      steps: [
        '成果物をプレビューで開く',
        '重要な数字とレイアウトを見る',
        '必要なら直して再度開く',
      ],
      example: 'PDFの各ページを見て、見出しが切れていないか確認します。',
      caution:
        'プレビューできる形式や機能は、利用する画面によって変わる場合があります。',
      sourceIds: ['artifacts-viewer'],
      keywords: ['PDF', '表', 'プレビュー', 'レイアウト', '確認'],
      starter: true,
    },
  ]),

  ...defineColumns('memory-and-settings', 61, [
    {
      slug: 'memory-basics',
      title: 'メモリは、何を覚えてくれる？',
      lead: '今後の会話でも役立つ好みや前提を、再利用するための仕組みです。',
      answer:
        '話し方の好みや継続して使う情報などを、次の会話でも参考にできる場合があります。',
      explanation:
        '毎回同じ自己紹介をする手間を減らせます。ただし、必ずすべてを永久に覚える保管庫ではありません。',
      steps: [
        '今後も使う情報か考える',
        '覚えてほしい内容を短く伝える',
        '保存された内容を時々確認する',
      ],
      example:
        '説明は専門用語を減らし、先に結論を伝えてほしい、と覚えてもらいます。',
      caution: 'パスワード、秘密鍵、機密情報はメモリへ保存しないでください。',
      sourceIds: ['memories'],
      keywords: ['メモリ', '記憶', '好み', '継続'],
      starter: true,
    },
    {
      slug: 'chatgpt-vs-codex-memory',
      title: 'ChatGPTのメモリと、Codexのメモリは別',
      lead: '同じ名前でも、保存場所や使われ方が同じとは限りません。',
      answer:
        'ChatGPTの個人設定として使うメモリと、ローカルCodexが保存するメモリは分けて扱われます。',
      explanation:
        '片方で覚えた内容が、もう片方へ必ず自動で届くとは考えず、それぞれの設定を確認します。',
      steps: [
        '今使っている画面を確認する',
        'その画面のメモリ設定を見る',
        '必要な指示が反映されたか試す',
      ],
      example:
        'ChatGPTで覚えた好みが、ローカルCodexでも同じかを別に確認します。',
      caution:
        '提供状況や初期設定は変わる場合があるため、現在の案内を確認してください。',
      sourceIds: ['memories'],
      keywords: ['ChatGPT', 'Codex', 'メモリ', '違い'],
    },
    {
      slug: 'memory-is-not-guaranteed',
      title: 'メモリは、必ず覚える保管庫ではない',
      lead: '保存が遅れたり、内容によっては記録されなかったりします。',
      answer:
        'メモリは会話を助ける機能です。絶対に守るルールや失ってはいけない情報の置き場には向きません。',
      explanation:
        'AIが使いやすい形で選んで保存するため、人が管理する正式な文書とは役割が違います。',
      steps: [
        '覚えてほしい内容を伝える',
        'メモリ一覧で保存を確認する',
        '重要事項は別の正本にも残す',
      ],
      example: '好みはメモリ、契約条件は管理された文書へ保存します。',
      caution:
        '保存されたと決めつけず、必要な場面では元の情報を確認してください。',
      sourceIds: ['memories'],
      keywords: ['メモリ', '保存', '正本', '確認'],
      starter: true,
    },
    {
      slug: 'memory-and-secrets',
      title: 'メモリへ秘密情報を入れない',
      lead: '便利だからこそ、覚えさせる内容を選びます。',
      answer:
        'パスワード、APIキー、本人確認情報、顧客の秘密などはメモリへ保存しません。',
      explanation:
        '今後の会話で再利用される仕組みなので、長く残す必要のない秘密情報とは相性がよくありません。',
      steps: [
        '内容に秘密がないか見る',
        '必要なら伏せ字や別管理にする',
        'メモリ一覧を定期的に確認する',
      ],
      example:
        '『経理を担当している』は保存しても、口座の認証情報は保存しません。',
      caution:
        '誤って保存した可能性がある時は、メモリと元の会話の両方を確認してください。',
      sourceIds: ['memories'],
      keywords: ['メモリ', '秘密情報', 'パスワード', 'APIキー'],
      starter: true,
    },
    {
      slug: 'memory-vs-agents-md',
      title: 'メモリとAGENTS.mdは、役割が違う',
      lead: '好みを覚える場所と、プロジェクトで守る決まりを分けます。',
      answer:
        '個人の傾向はメモリ、コードの確認方法や編集ルールなど、必ず守るプロジェクト指示はAGENTS.mdなどへ残します。',
      explanation:
        '正式な指示をファイルとして共有すると、人や会話が変わっても同じルールを確認できます。',
      steps: [
        '個人の好みか共通ルールか分ける',
        '共通ルールは管理された文書へ書く',
        '作業前に読み込まれているか確認する',
      ],
      example:
        '『短く説明して』は好み、『公開前にverify実行』はAGENTS.mdへ書きます。',
      caution:
        'メモリだけを、必須の品質ルールや安全ルールの正本にしないでください。',
      sourceIds: ['memories', 'personalize', 'projects'],
      keywords: ['メモリ', 'AGENTS.md', 'ルール', 'プロジェクト'],
      starter: true,
    },
    {
      slug: 'custom-instructions',
      title: 'カスタム指示に書くと便利なこと',
      lead: '毎回変わらない話し方や、仕事上の前提を伝えられます。',
      answer:
        '回答の長さ、言葉の難しさ、役割など、複数の会話で共通してほしい希望を設定します。',
      explanation:
        'その都度同じお願いを書く手間を減らせます。案件固有の条件は、各プロジェクトやチャットへ書きます。',
      steps: [
        '毎回伝えている希望を探す',
        '短く具体的に設定する',
        '新しい会話で反映を確かめる',
      ],
      example: '結論を先に書き、専門用語には短い説明を付ける、と設定します。',
      caution:
        '契約条件や顧客情報など、案件ごとの重要事項を一括設定へ混ぜないでください。',
      sourceIds: ['personalize'],
      keywords: ['カスタム指示', '個人設定', '話し方', '前提'],
    },
    {
      slug: 'personality-vs-capability',
      title: '性格設定で、できる仕事は増える？',
      lead: '話し方は変わりますが、機能や権限が増えるわけではありません。',
      answer:
        '性格設定は、口調や伝え方の雰囲気を調整するものです。モデルの能力やアクセス権とは別です。',
      explanation:
        '親しみやすい口調にしても、使えないツールが使えるようになったり、正確さが保証されたりはしません。',
      steps: [
        '好みの話し方を選ぶ',
        '短い質問で雰囲気を試す',
        '能力や権限は別の設定で確認する',
      ],
      example: '丁寧な口調へ変えても、Webアクセスの許可は別に設定します。',
      caution: '口調の自信強さを、答えの正確さと取り違えないでください。',
      sourceIds: ['personalize', 'permission-modes'],
      keywords: ['性格', '口調', '能力', '権限'],
      starter: true,
    },
    {
      slug: 'settings-differ-by-surface',
      title: '同じ設定が見つからない時は、画面の違いを確認',
      lead: 'Web、デスクトップ、CLI、IDEで、同じ項目が並ぶとは限りません。',
      answer:
        'まず利用中の画面とアプリの版を確認し、その環境向けの公式案内を見ます。',
      explanation:
        '機能が段階的に提供されたり、組織の管理者が設定を制限したりするため、画面差が生まれます。',
      steps: [
        'Webかアプリかを確認する',
        'アプリを必要に応じて更新する',
        '自分の環境向けの案内を見る',
      ],
      example:
        '説明どおりのボタンがない時、まずデスクトップ版かWeb版かを見ます。',
      caution:
        '画面の位置を固定して案内せず、機能名と目的を中心に説明してください。',
      sourceIds: ['personalize', 'notifications', 'models'],
      keywords: ['設定', 'Web', 'デスクトップ', 'CLI', 'IDE'],
    },
    {
      slug: 'notifications-basics',
      title: '通知は、何を知らせてくれる？',
      lead: '作業の完了、質問、許可が必要な時などに気づきやすくします。',
      answer:
        '利用する画面や設定に応じて、完了や確認待ちをデスクトップ、Web、メールなどで知らせる場合があります。',
      explanation:
        '長い作業中に画面を見続けなくても、次に人が動く場面を知る助けになります。',
      steps: [
        '必要な通知の種類を決める',
        '使う画面で通知を設定する',
        'テストして届き方を確認する',
      ],
      example: 'Codexが質問した時だけ、デスクトップ通知を受け取ります。',
      caution:
        '通知手段や項目は、OS、画面、プランによって異なる場合があります。',
      sourceIds: ['notifications'],
      keywords: ['通知', '完了', '質問', '許可'],
    },
    {
      slug: 'review-personal-settings',
      title: '個人設定は、ときどき見直す',
      lead: '前に便利だった設定が、今の仕事には合わないことがあります。',
      answer:
        '性格、カスタム指示、メモリ、通知などを見直し、今も必要な内容だけを残します。',
      explanation:
        '仕事や役割が変わっても古い前提が残ると、毎回の答えにずれが出やすくなるからです。',
      steps: [
        '設定とメモリの一覧を見る',
        '古い内容や不要な通知を外す',
        '新しい会話で結果を確かめる',
      ],
      example: '担当が変わったら、以前の部署向けのカスタム指示を更新します。',
      caution:
        '削除の影響が分からない設定は、内容を記録してから変更してください。',
      sourceIds: ['personalize', 'memories', 'notifications'],
      keywords: ['個人設定', '見直し', 'メモリ', '通知'],
    },
  ]),

  ...defineColumns('web-and-browser', 71, [
    {
      slug: 'web-search-basics',
      title: 'Web検索は、今の情報を探す道具',
      lead: 'ニュース、料金、営業時間など、変わりやすい情報を確認する時に使います。',
      answer:
        'Web検索を使うと、公開されているページを探し、回答へ出典を付けられる場合があります。',
      explanation:
        'AIが以前に学んだ知識だけで答えるより、現在の公式情報へ当たる方が変化に強くなります。',
      steps: [
        '何を最新確認したいか書く',
        'できれば公式情報を優先してもらう',
        '出典を開いて内容と日付を見る',
      ],
      example: '今日時点の料金を、公式ページで確認して出典を付けてください。',
      caution:
        '検索結果の文章は正しいとは限りません。重要事項は元ページを確認してください。',
      sourceIds: ['web-search'],
      keywords: ['Web検索', '最新情報', '出典', '公式情報'],
      starter: true,
    },
    {
      slug: 'web-search-vs-browser',
      title: 'Web検索とブラウザ操作は、別の仕事',
      lead: '情報を探すことと、ページを開いて操作することを分けます。',
      answer:
        'Web検索は情報を見つける道具、ブラウザはページを開き、クリックや入力などを行う道具です。',
      explanation:
        '調べるだけなら検索で足りることがあります。予約や画面確認など、操作が必要な時にブラウザを使います。',
      steps: [
        '知りたいだけか操作したいか決める',
        '検索かブラウザを選ぶ',
        '操作結果は画面で確認する',
      ],
      example: '営業時間を調べるなら検索、予約枠を開くならブラウザです。',
      caution:
        '購入、送信、予約など影響のある操作は、確定前に内容を確認してください。',
      sourceIds: ['web-search', 'browser'],
      keywords: ['Web検索', 'ブラウザ', '違い', '操作'],
      starter: true,
    },
    {
      slug: 'browser-basics',
      title: '内蔵ブラウザは、普段のブラウザと別の部屋',
      lead: '履歴やログイン状態を、そのまま共有するとは限りません。',
      answer:
        'ChatGPTの内蔵ブラウザは、普段使っているブラウザとは別のプロファイルとして動きます。',
      explanation:
        '作業を分けて安全に扱うためです。普段ログイン済みのサイトでも、内蔵ブラウザでは再ログインが必要な場合があります。',
      steps: [
        '内蔵ブラウザを開く',
        '必要なサイトだけログインする',
        '作業後にログイン状態を確認する',
      ],
      example:
        '普段のChromeで開ける管理画面でも、内蔵ブラウザでは別にログインします。',
      caution:
        'ログイン情報やCookieが普段のブラウザと共有されると決めつけないでください。',
      sourceIds: ['browser'],
      keywords: ['内蔵ブラウザ', 'プロファイル', 'ログイン', 'Cookie'],
      starter: true,
    },
    {
      slug: 'browser-extension-tabs',
      title: '今開いているタブを使うなら、ブラウザ拡張',
      lead: '普段のブラウザにあるタブやログイン状態を使いたい時の選択肢です。',
      answer:
        '対応するブラウザ拡張を使うと、すでに開いているタブをChatGPTへ渡して操作できる場合があります。',
      explanation:
        '内蔵ブラウザとは別に、普段のブラウザ上で作業する方法です。どのタブを渡すかを確認して使います。',
      steps: [
        '対応する拡張を確認する',
        '対象のタブだけを選ぶ',
        '操作範囲を見てから依頼する',
      ],
      example:
        'ログイン済みの管理画面タブを指定し、表示だけ確認してもらいます。',
      caution:
        '対応ブラウザや提供状況は変わる場合があります。機密タブを誤って選ばないでください。',
      sourceIds: ['browser'],
      keywords: ['ブラウザ拡張', 'タブ', 'Chrome', 'ログイン'],
    },
    {
      slug: 'computer-use-basics',
      title: 'Computer Useは、画面を見て操作する機能',
      lead: '人が行うように、画面を見てクリックや入力を進めます。',
      answer:
        '対応する環境で、アプリやWebの画面を見ながら操作し、結果を確認できます。',
      explanation:
        '専用の連携がない古い画面や、見た目を確かめる作業でも使えます。ただし、人と同じように操作ミスも起こりえます。',
      steps: [
        '対象のアプリやページを開く',
        '行う操作と止まる場所を伝える',
        '結果を画面で確認する',
      ],
      example: '公開ページを開き、スマホ幅でボタンが見えるか確認します。',
      caution:
        '対応OS、地域、アプリ、プランなどによって利用できない場合があります。',
      sourceIds: ['computer-use'],
      keywords: ['Computer Use', '画面操作', 'クリック', '入力'],
      starter: true,
    },
    {
      slug: 'plugin-vs-computer-use',
      title: 'データ取得は連携、見た目の操作はComputer Use',
      lead: '同じサービスでも、仕事に合う入口を選ぶと安定します。',
      answer:
        '決まったデータを読む・更新するならプラグインやMCP、画面を見て操作するならComputer Useが目安です。',
      explanation:
        '専用連携は構造化された情報を扱いやすく、画面操作は人にしか見えない表示を扱いやすいからです。',
      steps: [
        '必要なのがデータか画面か分ける',
        '使える専用連携を先に確認する',
        '必要な時だけ画面操作を使う',
      ],
      example: '顧客一覧の取得は連携、ボタンの崩れ確認はComputer Useにします。',
      caution: 'どちらでも、必要な権限と変更内容を確認してください。',
      sourceIds: ['computer-use', 'plugins', 'mcp'],
      keywords: ['Computer Use', 'プラグイン', 'MCP', '使い分け'],
    },
    {
      slug: 'browser-site-permission',
      title: '初めてのサイトで、許可を求められる理由',
      lead: 'AIが別のサイトへ勝手に広がらないよう、対象を人が確認します。',
      answer:
        'サイトへ入る前や操作を広げる時に、どのページへアクセスするかの確認が入る場合があります。',
      explanation:
        '似た名前の偽サイトや、依頼と関係のない外部ページへ進む危険を減らすためです。',
      steps: [
        'サイト名とURLを見る',
        '今回の仕事に必要か考える',
        '必要なサイトだけ許可する',
      ],
      example: '支払い画面へ移る前に、公式サイトのドメインか確認します。',
      caution:
        'Webページ内の指示を、ユーザーからの命令として扱わないでください。',
      sourceIds: ['browser', 'computer-use'],
      keywords: ['サイト許可', 'URL', 'ブラウザ', '安全'],
      starter: true,
    },
    {
      slug: 'confirm-consequential-actions',
      title: '予約・購入・送信の前に、確認が入る理由',
      lead: '押した後に取り消しにくい操作を、人が最後に判断するためです。',
      answer:
        '支払い、予約確定、公開、メッセージ送信などは、内容を確認してから人が実行または承認します。',
      explanation:
        'AIが名前、金額、宛先を取り違えても、確定前なら止められます。最後の一手を分ける安全策です。',
      steps: [
        '相手、内容、金額を確認する',
        '取り消し方法を確かめる',
        '問題がなければ確定する',
      ],
      example:
        '予約フォームへの入力は任せても、送信前に日時と人数を確認します。',
      caution:
        '確認を省く常時許可は、影響を理解した狭い作業だけにしてください。',
      sourceIds: ['browser', 'computer-use'],
      keywords: ['予約', '購入', '送信', '確認', '決済'],
      starter: true,
    },
    {
      slug: 'browser-downloads',
      title: 'ブラウザで保存したファイルは、どこへ行く？',
      lead: '保存先は、利用するブラウザや設定で変わります。',
      answer:
        'デスクトップではダウンロード先を設定できる場合があります。保存後は、ファイル名と実際の場所を確認します。',
      explanation:
        'AIが『保存した』と答えても、人が探せる場所にあるとは限りません。成果物の受け渡し先まで確認します。',
      steps: [
        '現在のダウンロード先を見る',
        '保存したファイルを実際に開く',
        '必要なフォルダへ整理する',
      ],
      example: 'PDFを保存した後、ダウンロード一覧から開いて中身を確認します。',
      caution: '保存先や自動保存の動作は、OSやアプリの設定で異なります。',
      sourceIds: ['browser', 'artifacts-viewer'],
      keywords: ['ダウンロード', '保存先', 'ブラウザ', 'ファイル'],
    },
    {
      slug: 'browser-limitations',
      title: 'AIでも、すべてのサイトを操作できるわけではない',
      lead: 'ログイン、画像認証、アップロードなどで止まることがあります。',
      answer:
        'サイト側が自動操作を止めていたり、内蔵ブラウザが対応していない操作があったりします。',
      explanation:
        '止まった時は失敗ではなく、安全やサイトの決まりによる場合があります。人が引き継げる形にします。',
      steps: [
        'どの画面で止まったか確認する',
        '人が必要な操作だけ行う',
        '終わった場所からAIへ戻す',
      ],
      example: '画像認証だけ人が行い、ログイン後の画面確認を続けてもらいます。',
      caution:
        '内蔵ブラウザではファイルの自動アップロードに対応しない場合があります。',
      sourceIds: ['browser', 'computer-use'],
      keywords: ['ブラウザ', '制限', 'ログイン', 'CAPTCHA', 'アップロード'],
      starter: true,
    },
  ]),

  ...defineColumns('models-and-plans', 21, [
    {
      slug: 'model-vs-reasoning',
      title: 'モデルと「考える深さ」は別の設定',
      lead: 'どのAIを使うかと、どれくらい時間をかけて考えるかを分けて選びます。',
      answer:
        'モデルは得意分野や速さなどの土台、考える深さは一つの依頼へ使う推論量の目安です。',
      explanation:
        '同じモデルでも、軽い質問と難しい設計では必要な考え方が違います。二つを分けると無駄を減らせます。',
      steps: [
        'まず標準のモデルを選ぶ',
        '仕事の難しさに合わせて深さを選ぶ',
        '結果と待ち時間を見て調整する',
      ],
      example: '誤字直しは軽め、複数案を比べる設計は深めから試します。',
      caution: '選べるモデルや設定名は、時期やプランで変わることがあります。',
      sourceIds: ['models'],
      keywords: ['モデル', '推論', '考える深さ', '設定'],
      starter: true,
    },
    {
      slug: 'choose-reasoning',
      title: '迷ったら、標準の深さから始める',
      lead: 'いつも一番深く考えさせる必要はありません。',
      answer:
        'まず標準設定で試し、抜けや誤りが多い時だけ深くします。速さを優先したい簡単な仕事は軽めで十分な場合があります。',
      explanation:
        '深く考えるほど良いとは限りません。仕事に合う速さと質のバランスを見つける方が実用的です。',
      steps: [
        '標準設定で一度試す',
        '不足している点を確認する',
        '必要な時だけ深さを上げる',
      ],
      example: '一覧の並べ替えは標準、難しい原因調査は一段深くします。',
      caution: '深い推論は、回答までの時間や利用量が増える場合があります。',
      sourceIds: ['models'],
      keywords: ['推論', '標準', '速さ', '品質'],
      starter: true,
    },
    {
      slug: 'deeper-reasoning-cost',
      title: '深く考えると、何が増える？',
      lead: '難しい仕事に強くなる一方で、待ち時間や利用量も増えやすくなります。',
      answer:
        '複雑な問題では深い推論が役立つことがありますが、簡単な作業まで重くすると効率が落ちます。',
      explanation:
        '大切なのは最大設定にすることではなく、必要な品質に届く最小の設定を選ぶことです。',
      steps: [
        '仕事を簡単・普通・難しいに分ける',
        '合う深さで試す',
        '時間と結果を比べて決める',
      ],
      example: '短い要約は軽く、条件が多い事業計画の比較は深く考えさせます。',
      caution:
        '利用量の数え方や上限は変わるため、現在の案内を確認してください。',
      sourceIds: ['models', 'pricing'],
      keywords: ['推論', '利用量', '待ち時間', '効率'],
    },
    {
      slug: 'model-names-change',
      title: 'モデル名が変わっても、慌てなくていい',
      lead: '新しいモデルの追加や、古いモデルの入れ替えは起こります。',
      answer:
        '名前だけで選ばず、速さ、得意な仕事、考える深さを見て、今の目的に合うものを選びます。',
      explanation:
        '固定のモデル名を覚えるより、『軽い作業』『複雑な作業』という選び方を身につける方が長く使えます。',
      steps: [
        '公式のモデル説明を開く',
        '今の仕事に合う特徴を見る',
        '小さな課題で試して比べる',
      ],
      example: '新しい名前が出ても、まず同じ短い課題で結果と速さを比べます。',
      caution:
        '記事内で特定のモデル名や終了日を長期間の前提にしないでください。',
      sourceIds: ['models'],
      keywords: ['モデル名', '変更', '比較', '選び方'],
    },
    {
      slug: 'change-model-interface',
      title: 'モデルを変える場所が見つからない時',
      lead: '使う画面によって、選び方や表示場所が違います。',
      answer:
        'デスクトップやWebでは入力欄付近の選択、CLIではコマンドなど、利用する画面に合う方法を確認します。',
      explanation:
        '同じChatGPTやCodexでも、デスクトップ、Web、CLI、IDEでは操作方法が同じとは限りません。',
      steps: [
        '今使っている画面を確認する',
        'その画面向けの公式案内を見る',
        '現在選ばれているモデルを確かめる',
      ],
      example: 'CLIでは画面のボタンではなく、モデル選択のコマンドを使います。',
      caution:
        'ボタンの位置や名称は更新されるため、位置を固定して覚えないでください。',
      sourceIds: ['models'],
      keywords: ['モデル変更', 'デスクトップ', 'Web', 'CLI', 'IDE'],
    },
    {
      slug: 'local-cloud-model',
      title: 'LocalとCloudで、モデル設定は同じ？',
      lead: '作業場所とモデルの選び方は、別の設定です。',
      answer:
        'Local、Worktree、Cloudは作業する環境の違いです。選べるモデルや初期値は、使う画面や環境で異なる場合があります。',
      explanation:
        '『どこで動くか』と『どのモデルが考えるか』を分けると、設定の意味を取り違えません。',
      steps: [
        '作業環境を先に選ぶ',
        'その環境で選べるモデルを見る',
        '結果と利用量を確認する',
      ],
      example:
        '同じプロジェクトでも、LocalとCloudで選択肢をそれぞれ確認します。',
      caution:
        '現在のCloud側の初期モデルなど、変わりやすい仕様は公式案内を見てください。',
      sourceIds: ['models', 'environment-modes'],
      keywords: ['Local', 'Cloud', 'モデル', '環境'],
    },
    {
      slug: 'free-plan-basics',
      title: '無料プランで、どこまでできる？',
      lead: 'まず試せる機能はありますが、利用量や使える機能には違いがあります。',
      answer:
        '無料でも始められる範囲を確認し、必要な機能や利用量が足りなくなった時に有料プランを検討します。',
      explanation:
        '最初から契約を決めるより、自分の課題を一つ試すと、必要な機能が見えやすくなります。',
      steps: [
        '公式の現在のプラン表を見る',
        'やりたい課題を一つ試す',
        '不足が出た時だけ変更を考える',
      ],
      example: '短い文章作成から始め、上限や必要機能が分かってから検討します。',
      caution:
        '無料で使える機能、回数、上限は変わるため、固定した数字で案内しません。',
      sourceIds: ['pricing'],
      keywords: ['無料プラン', '有料プラン', '上限', '機能'],
      starter: true,
    },
    {
      slug: 'tokens-and-credits',
      title: 'トークンとクレジットは、何が違う？',
      lead: '一方はAIが読む・書く量、もう一方は利用枠を表す考え方です。',
      answer:
        'トークンは処理する文章などの量を数える単位です。クレジットは製品内で追加利用などに使われる枠として扱われます。',
      explanation:
        '普段は細かな計算より、長い資料や深い推論ほど利用量が増えやすいと覚えておけば十分です。',
      steps: [
        '現在の利用状況を開く',
        'どの作業で増えたかを見る',
        '重い作業の設定を見直す',
      ],
      example:
        '長い資料を何度も読み直す仕事は、短い質問より利用量が増えやすくなります。',
      caution:
        '単位や消費方法は製品・プラン・時期で変わるため、現在の表示を優先してください。',
      sourceIds: ['pricing', 'models'],
      keywords: ['トークン', 'クレジット', '利用量', '上限'],
    },
    {
      slug: 'chatgpt-vs-api-billing',
      title: 'ChatGPTの契約と、APIの料金は別',
      lead: 'ChatGPTを有料で使っていても、API利用が同じ契約に含まれるとは限りません。',
      answer:
        'ChatGPTのプランと、開発者向けAPIの利用は別の仕組みです。APIキーを使う開発では、API側の料金を確認します。',
      explanation:
        '同じOpenAIのサービスでも、画面で使う契約と、プログラムから呼び出す利用を分けて管理するためです。',
      steps: [
        'ChatGPT内の作業かAPI開発か分ける',
        '該当する料金案内を見る',
        '利用量の確認先を分ける',
      ],
      example:
        'ChatGPT Plusの契約だけを見て、API開発の費用を0円とは判断しません。',
      caution:
        '料金や含まれる範囲は変わるため、作業前に現在の公式案内を確認してください。',
      sourceIds: ['pricing'],
      keywords: ['ChatGPT', 'API', '料金', '課金', 'APIキー'],
      starter: true,
    },
    {
      slug: 'usage-dashboard',
      title: '今の利用量は、どこで確かめる？',
      lead: '体感ではなく、アカウントに表示される利用状況を見ます。',
      answer:
        '設定や利用状況の画面で、残りの枠や使用状況を確認します。WorkとCodexなどで利用枠を共有する場合もあります。',
      explanation:
        '上限へ近づくと使い方を調整できます。人から聞いた数字より、自分の画面の表示が確実です。',
      steps: [
        '利用状況の画面を開く',
        '対象の期間と機能を確認する',
        '必要なら作業量や設定を調整する',
      ],
      example: '大きな課題を始める前に、現在の利用枠を確認します。',
      caution:
        '表示項目や集計方法は、プランや更新によって変わることがあります。',
      sourceIds: ['pricing'],
      keywords: ['利用量', 'ダッシュボード', '上限', 'プラン'],
    },
  ]),

  ...defineColumns('skills-and-plugins', 31, [
    {
      slug: 'skill-basics',
      title: 'スキルは「いつものやり方」をまとめたもの',
      lead: '何度も使う手順や決まりを、再利用しやすくします。',
      answer:
        'スキルは、特定の仕事をどう進めるかを書いた指示と、必要な資料や道具をまとめた仕組みです。',
      explanation:
        '毎回同じ説明を入力し直さなくてよくなり、人や日が変わっても同じ流れで始めやすくなります。',
      steps: [
        '繰り返している仕事を一つ選ぶ',
        '手順と守ることを書き出す',
        '実際の仕事で試して直す',
      ],
      example: '毎週の報告書を、同じ順番と書式で作る手順をスキルにします。',
      caution:
        '一度作って終わりではなく、仕事の変化に合わせて内容を見直します。',
      sourceIds: ['skills-and-plugins'],
      keywords: ['スキル', '手順', '再利用', '定型作業'],
      starter: true,
    },
    {
      slug: 'create-a-skill',
      title: '「スキルを作成」では、何を作る？',
      lead: 'AIへ覚えさせる魔法ではなく、繰り返し使える仕事の説明書を作ります。',
      answer:
        '対象の仕事、進め方、必要な材料、完成の確認方法をまとめ、実際に呼び出せる形へ整えます。',
      explanation:
        '普段の仕事を言葉にするため、最初は小さな一つの作業から始めると失敗しにくくなります。',
      steps: [
        '一つの仕事に範囲を絞る',
        '普段の手順と完成条件を伝える',
        '試した結果をもとに修正する',
      ],
      example:
        '請求書チェックだけを行うスキルを作り、確認項目を少しずつ足します。',
      caution:
        'パスワードやAPIキーなどの秘密情報を、スキル本文へ保存しないでください。',
      sourceIds: ['skills-and-plugins'],
      keywords: ['スキル作成', '説明書', '手順', '完成条件'],
    },
    {
      slug: 'skill-good-fit',
      title: 'スキルに向く仕事、向かない仕事',
      lead: '同じ流れを何度も使う仕事ほど、スキルが役立ちます。',
      answer:
        '定期報告やチェックのような繰り返し作業は向いています。一度だけの相談や、毎回条件が全く違う仕事は会話だけでも十分です。',
      explanation:
        '作る手間より、繰り返し減らせる手間の方が大きい時に、スキル化する価値があります。',
      steps: [
        '同じ説明を何度しているか数える',
        '共通する手順を探す',
        '小さな範囲でスキル化する',
      ],
      example: '一度だけの挨拶文はChat、毎月の数字確認はスキルにします。',
      caution:
        '判断が毎回大きく変わる仕事を、無理に固定手順へ押し込めないでください。',
      sourceIds: ['skills-and-plugins'],
      keywords: ['スキル', '繰り返し', '定型作業', '向き不向き'],
    },
    {
      slug: 'invoke-a-skill',
      title: 'スキルを呼び出す「@」と「$」',
      lead: '使う画面によって、スキルを指定する記号が違う場合があります。',
      answer:
        'ChatGPTでは@、Codexでは$を使って、利用したいスキルを明示できる案内があります。',
      explanation:
        'AIが自動で選ぶ場合もありますが、使いたい手順が決まっている時は名前を指定すると分かりやすくなります。',
      steps: [
        '入力欄で記号を入力する',
        '一覧からスキルを選ぶ',
        '続けて今回の材料や目的を書く',
      ],
      example: '$skill-creator を選び、作りたい定型作業を続けて説明します。',
      caution:
        '記号や対応画面は変更される場合があるため、現在の公式案内を確認してください。',
      sourceIds: ['skills-and-plugins'],
      keywords: ['@', '$', 'スキル', '呼び出し', 'ChatGPT', 'Codex'],
    },
    {
      slug: 'skill-vs-plugin',
      title: 'スキルとプラグインは、何が違う？',
      lead: 'スキルは仕事の進め方、プラグインは機能をまとめて追加する箱です。',
      answer:
        'スキルは再利用する手順が中心です。プラグインは、スキルに加えて外部接続や画面部品などを含められます。',
      explanation:
        '手順をそろえたいならスキル、外部サービスや複数の機能をまとめて追加したいならプラグインが目安です。',
      steps: [
        '必要なのが手順か機能か分ける',
        '中に含まれるものを確認する',
        '小さな仕事で動作を試す',
      ],
      example:
        '報告文の書き方はスキル、外部データ取得も含むならプラグインを検討します。',
      caution:
        'プラグインとMCPは同じものではありません。プラグインがMCP接続を含むことがあります。',
      sourceIds: ['skills-and-plugins', 'plugins', 'mcp'],
      keywords: ['スキル', 'プラグイン', '違い', 'MCP'],
      starter: true,
    },
    {
      slug: 'plugin-basics',
      title: 'プラグインを入れると、何が増える？',
      lead: 'ChatGPTやCodexへ、まとまった機能を追加できます。',
      answer:
        'プラグインにはスキル、外部サービスとの接続、MCP、専用画面などが含まれる場合があります。',
      explanation:
        '一つずつ設定する代わりに、特定の仕事に必要な機能をまとめて導入しやすくする仕組みです。',
      steps: [
        '提供元と説明を読む',
        '必要な権限や接続先を確認する',
        '導入後に新しいチャットで試す',
      ],
      example:
        '外部サービスを使うプラグインでは、導入後にそのサービスへ接続します。',
      caution:
        '利用できるプラグインや対応画面は、プランや組織設定で異なる場合があります。',
      sourceIds: ['plugins'],
      keywords: ['プラグイン', '導入', '機能追加', '外部サービス'],
    },
    {
      slug: 'connector-basics',
      title: 'コネクターは、外部サービスへの接続口',
      lead: '別のサービスにある情報を、許可した範囲で使えるようにします。',
      answer:
        'コネクターを通して、ChatGPTやCodexが外部のデータや操作へアクセスできる場合があります。',
      explanation:
        '毎回コピーして貼る手間を減らせますが、どの情報を読めるか、何を操作できるかの確認が必要です。',
      steps: [
        'つなぐサービスを確認する',
        '求められる権限を読む',
        '必要な範囲だけ許可する',
      ],
      example: '資料保管サービスをつなぎ、指定した資料だけを探してもらいます。',
      caution:
        '接続しただけで、すべてのデータや操作が自動的に許可されるわけではありません。',
      sourceIds: ['plugins', 'mcp'],
      keywords: ['コネクター', '外部サービス', '接続', '権限'],
    },
    {
      slug: 'mcp-basics',
      title: 'MCPを一言でいうと？',
      lead: 'AIと、外部の道具や情報をつなぐ共通のつなぎ方です。',
      answer:
        'MCPは、AIが使えるツールや情報源を決まった形で受け渡すための仕組みです。',
      explanation:
        'サービスごとに全く別の接続を作る負担を減らし、利用できる道具を分かりやすく追加できます。',
      steps: [
        '何につなぐMCPか確認する',
        '使える道具と必要な権限を見る',
        '読み取りだけの小さな操作から試す',
      ],
      example: '社内の検索ツールをMCPでつなぎ、許可された資料を探します。',
      caution:
        'MCP自体が安全を保証するわけではありません。提供元と権限を確認してください。',
      sourceIds: ['mcp'],
      keywords: ['MCP', 'ツール', '情報源', '接続'],
      starter: true,
    },
    {
      slug: 'plugin-signin-permissions',
      title: 'ログインと、データへの許可は別',
      lead: 'サインインできたからといって、すべての情報を渡したわけではありません。',
      answer:
        '本人確認のためのログインと、そのサービスのデータを読む・操作する権限は別に確認します。',
      explanation:
        '『誰が使うか』と『何をさせるか』を分けることで、必要以上のアクセスを避けられます。',
      steps: [
        'ログイン先が正しいか見る',
        '求められる権限を一つずつ読む',
        '不要な接続は後で解除する',
      ],
      example:
        'ChatGPTでサインインした後も、外部サービスのアクセス範囲を確認します。',
      caution: '説明を読まずに広い権限を許可しないでください。',
      sourceIds: ['plugins'],
      keywords: ['ログイン', 'サインイン', '権限', 'データ'],
    },
    {
      slug: 'plugin-safety',
      title: 'プラグインを入れる前の3つの確認',
      lead: '提供元、権限、実行する命令を見てから使います。',
      answer:
        '信頼できる提供元か、必要以上の権限を求めていないか、フックなどで何を実行するかを確認します。',
      explanation:
        'プラグインは便利な一方、外部サービスや端末で操作する力を持つ場合があります。中身を知って使うことが大切です。',
      steps: [
        '提供元と更新情報を見る',
        '権限と外部接続を確認する',
        '安全なテストで動作を見る',
      ],
      example: 'いきなり本番データを使わず、コピーした資料で試します。',
      caution:
        'コマンドを自動実行するフックは、内容を理解してから有効にしてください。',
      sourceIds: ['plugins'],
      keywords: ['プラグイン', '安全', 'フック', '提供元', '権限'],
      starter: true,
    },
  ]),

  ...defineColumns('schedules', 41, [
    {
      slug: 'schedule-basics',
      title: 'スケジュール機能で、何ができる？',
      lead: '決まった時刻やきっかけで、同じ仕事を自動で始められます。',
      answer:
        '定期的な確認、報告、資料づくりなどを、あらかじめ決めた予定に合わせて実行できます。',
      explanation:
        '忘れやすい繰り返し作業を減らせます。ただし、無人で動くため、内容と権限を先に整える必要があります。',
      steps: [
        '繰り返したい仕事を一つ選ぶ',
        '実行する時刻やきっかけを決める',
        '初回の結果と通知を確認する',
      ],
      example: '平日の朝に、その日の予定を短くまとめてもらいます。',
      caution:
        '利用できる予定の種類や画面は、プランや環境で異なる場合があります。',
      sourceIds: ['automations'],
      keywords: ['スケジュール', '定期実行', '自動化', '予定'],
      starter: true,
    },
    {
      slug: 'schedule-new-or-same-chat',
      title: '毎回新しく作る？ 同じ会話へ戻る？',
      lead: '欲しい結果によって、予定の置き場所を選びます。',
      answer:
        '毎回独立した結果がほしいなら単独の予定、前回の続きとして確認したいなら既存のチャットに結びつけます。',
      explanation:
        '履歴を引き継ぐかどうかで、AIが使う文脈と、後から見返す場所が変わります。',
      steps: [
        '前回の内容が必要か考える',
        '単独か既存チャットか選ぶ',
        '一度動かして結果の残り方を見る',
      ],
      example:
        '毎日の新しい記事収集は単独、同じ案件の進捗確認は既存チャットにします。',
      caution:
        '保存される履歴や選択肢は、使う画面によって異なる場合があります。',
      sourceIds: ['automations'],
      keywords: ['スケジュール', 'チャット', '履歴', '継続'],
    },
    {
      slug: 'schedule-local',
      title: 'Localの予定実行中は、パソコンを動かしておく',
      lead: '自分の端末で動く予定は、端末とアプリが使える状態である必要があります。',
      answer:
        'ローカルプロジェクトの予定は、自分のパソコン上で実行されます。端末が停止していると予定どおり動けません。',
      explanation:
        '端末内のフォルダや道具を使える代わりに、その作業場所そのものが稼働している必要があります。',
      steps: [
        'Localで動く予定か確認する',
        '実行時刻に端末とアプリを動かしておく',
        '完了通知と結果を確認する',
      ],
      example: '夜に端末を閉じるなら、朝のローカル作業は起動後の時刻にします。',
      caution:
        'スリープ時などの動作は環境で変わるため、実際の端末で試してください。',
      sourceIds: ['automations'],
      keywords: ['Local', 'スケジュール', 'パソコン', 'アプリ'],
      starter: true,
    },
    {
      slug: 'schedule-web',
      title: 'Webの予定実行は、パソコンのフォルダを直接触れない',
      lead: 'Webで動く予定と、自分の端末で動く予定は作業場所が違います。',
      answer:
        'Webの予定では、アップロードした資料や利用できるツールを使えますが、端末のフォルダへ直接入ることはできません。',
      explanation:
        '自分のパソコンが閉じていても動かせる一方、必要な材料はWeb側から使える形で準備します。',
      steps: [
        'Webで使える資料を用意する',
        '端末内だけのファイル参照を外す',
        'テスト実行で材料を読めるか確かめる',
      ],
      example: 'ローカルの売上表ではなく、予定へ添付した表を使って集計します。',
      caution: '対応する添付やツールは、利用環境によって異なる場合があります。',
      sourceIds: ['automations'],
      keywords: ['Web', 'スケジュール', 'ローカルファイル', '添付'],
    },
    {
      slug: 'test-before-schedule',
      title: '定期実行する前に、一度手動で試す',
      lead: 'うまく動かない指示を、そのまま毎日繰り返さないためです。',
      answer:
        'まず普通のチャットで同じ依頼を実行し、材料、出力、確認方法がそろってから予定にします。',
      explanation:
        '手動なら、その場で不足へ答えられます。完成した指示だけを無人実行へ移すと失敗を減らせます。',
      steps: [
        '通常のチャットで依頼する',
        '質問や失敗をもとに指示を直す',
        '安定してから予定へ登録する',
      ],
      example: '朝の報告を一度作り、長さと情報源を直してから毎日にします。',
      caution:
        '一度成功しても、外部サービスや資料の変更で失敗することがあります。',
      sourceIds: ['automations', 'prompting'],
      keywords: ['テスト', 'スケジュール', '手動実行', '確認'],
      starter: true,
    },
    {
      slug: 'write-a-schedule-prompt',
      title: '予定へ入れる指示に、書いておくこと',
      lead: 'いつ、何を使い、どこまで進め、何を知らせるかを決めます。',
      answer:
        '目的、材料、完成形、失敗時の止まり方、通知する条件を短く書きます。',
      explanation:
        '無人実行ではその場の聞き返しに答えられません。迷う場面を先に決めておくと安全です。',
      steps: [
        '成功した状態を書く',
        '使ってよい材料と範囲を書く',
        '止まる条件と通知を書く',
      ],
      example: '新着がある時だけ3件まとめ、見つからなければ何も送らない。',
      caution:
        '確認なしの投稿、購入、削除などを安易に予定へ入れないでください。',
      sourceIds: ['automations', 'prompting'],
      keywords: ['スケジュール', '指示', '通知', '停止条件'],
    },
    {
      slug: 'event-trigger',
      title: 'メール受信などを、開始のきっかけにできる？',
      lead: '対応するサービスでは、時刻以外の出来事から始められる場合があります。',
      answer:
        '対象プランや組織で利用できる場合、アプリのイベントをきっかけに予定を動かせます。',
      explanation:
        '毎分見に行く代わりに、『届いた時』だけ動かせるため、必要な場面へ合わせやすくなります。',
      steps: [
        '使いたいサービスが対応するか確認する',
        '対象イベントと必要な権限を選ぶ',
        'テスト用の出来事で動作を見る',
      ],
      example: '特定の種類のメールが届いた時だけ、内容を分類します。',
      caution:
        'イベント起動の提供範囲は、プラン、地域、管理者設定などで変わります。',
      sourceIds: ['automations'],
      keywords: ['イベント', 'メール', 'トリガー', '自動化'],
    },
    {
      slug: 'time-vs-event-trigger',
      title: '時刻指定とイベント指定を、一つに混ぜない',
      lead: '一つの予定は、一つの始まり方にすると分かりやすくなります。',
      answer:
        '時間で始める予定と、何かが起きた時に始める予定は分けて作ります。',
      explanation:
        '公式案内では、一つのタスクへイベント起動と時間指定を同時に組み合わせない形になっています。',
      steps: [
        '開始条件を時刻かイベントに決める',
        '必要なら二つの予定へ分ける',
        '重複して動かないか確認する',
      ],
      example: '毎朝の集計と、メール到着時の分類を別々の予定にします。',
      caution:
        '対応条件は更新される場合があるため、作成画面の案内を優先してください。',
      sourceIds: ['automations'],
      keywords: ['時刻', 'イベント', 'トリガー', 'スケジュール'],
    },
    {
      slug: 'schedule-in-worktree',
      title: '定期作業をWorktreeへ分ける理由',
      lead: '普段の開発を邪魔せず、決まった作業を別の作業場で進められます。',
      answer:
        'Gitのプロジェクトでは、予定をWorktreeで動かし、現在の作業フォルダと変更を分けられます。',
      explanation:
        '同じ時間に別の作業をしていても、ファイルの上書きや途中変更の混在を減らせます。',
      steps: [
        'Gitのプロジェクトか確認する',
        'Worktreeで予定を作る',
        '結果の差分を見て取り込む',
      ],
      example: '毎週の依存関係確認を、普段の開発とは別のWorktreeで動かします。',
      caution:
        'Worktreeの変更は、自動で本番へ入るとは限りません。差分を確認してください。',
      sourceIds: ['automations', 'git-worktrees'],
      keywords: ['Worktree', 'Git', 'スケジュール', '分離'],
    },
    {
      slug: 'schedule-minimum-permissions',
      title: '無人で動く予定ほど、権限を狭くする',
      lead: '人が見ていない時間にも動くため、できることを必要最小限にします。',
      answer:
        '読み取る場所、変更する場所、Web接続先を絞り、必要のないフルアクセスは避けます。',
      explanation:
        '誤った指示や外部情報の影響があっても、被害が広がりにくい範囲に閉じ込めるためです。',
      steps: [
        '必要な操作だけを書き出す',
        '最小のアクセス権で試す',
        '失敗時の通知と停止条件を決める',
      ],
      example: '報告書の読み取りだけなら、送信や削除の権限は与えません。',
      caution:
        '重要な送信、決済、削除は、予定だけに任せず人の確認を入れてください。',
      sourceIds: ['automations', 'permission-modes'],
      keywords: ['無人実行', '最小権限', 'スケジュール', '安全'],
      starter: true,
    },
  ]),

  ...defineColumns('permissions', 11, [
    {
      slug: 'permission-menu',
      title: 'チャット欄の「アクセス権」は何？',
      lead: 'AIがどこまで作業してよいかを決める安全設定です。',
      answer:
        'ファイルの編集、コマンドの実行、インターネット利用などを、どこまで任せるか選びます。',
      explanation:
        '質問へ答えるだけの設定ではなく、端末や外部サービスへ働きかける範囲を決めるものです。',
      steps: [
        '今回の仕事に必要な操作を考える',
        '最小限のアクセス権を選ぶ',
        '確認が出たら内容を読んで決める',
      ],
      example:
        '文章相談だけなら、ファイル編集やWeb操作まで許可する必要はありません。',
      caution:
        '設定名や表示場所は、アプリや管理者設定によって変わる場合があります。',
      sourceIds: ['permission-modes'],
      keywords: ['アクセス権', '権限', '安全', '承認'],
      starter: true,
    },
    {
      slug: 'approval-mode',
      title: '「承認を求める」は、何を守る設定？',
      lead: '大きな操作の前に、いったん人へ確認を戻します。',
      answer:
        '普段の作業は進めつつ、インターネット利用や作業範囲の外へ出る操作などで確認を求める考え方です。',
      explanation:
        'すべてを止めるのではなく、影響が広がるところだけ人が判断できます。迷うときの基本設定に向きます。',
      steps: [
        '承認を求める設定を選ぶ',
        '表示された操作と対象を読む',
        '必要な操作だけ許可する',
      ],
      example:
        'Webへ接続する確認が出たら、目的のサイトかを見てから許可します。',
      caution: '確認画面を読まずに続けて許可すると、安全設定の意味が薄れます。',
      sourceIds: ['permission-modes'],
      keywords: ['承認', '確認', 'アクセス権', '安全'],
      starter: true,
    },
    {
      slug: 'approve-for-me',
      title: '「自動で承認」は、何でも自由にする設定ではない',
      lead: '承認の回数を減らしても、作業範囲そのものが広がるとは限りません。',
      answer:
        '承認の方法と、AIが入れる作業範囲は別です。自動承認を選んでも、サンドボックスの境界は残ります。',
      explanation:
        '『止まらず進める』ことと『どこへでも入れる』ことを分けて考えると、設定を選びやすくなります。',
      steps: [
        '作業範囲を先に確認する',
        '任せてもよい定型作業だけに使う',
        '結果と変更内容を後で確認する',
      ],
      example: '同じフォルダ内の決まった整形を続ける時に使います。',
      caution:
        '表示される選択肢は、利用環境や組織のルールで異なることがあります。',
      sourceIds: ['permission-modes'],
      keywords: ['自動承認', 'サンドボックス', '権限', '範囲'],
    },
    {
      slug: 'full-access-risk',
      title: 'フルアクセスを気軽に選ばない',
      lead: '便利なぶん、間違えた時の影響も大きくなります。',
      answer:
        'フルアクセスでは、より広いファイルやネットワーク操作が可能になります。必要な時だけ、対象を確かめて使います。',
      explanation:
        'AIの誤解や、Webページに紛れた悪意ある指示が、削除や情報流出につながる可能性を小さくするためです。',
      steps: [
        '他の設定で足りないか考える',
        '対象と目的を狭く決める',
        '変更内容を人が確認する',
      ],
      example:
        '広いフォルダを扱う前に、必要な一つのプロジェクトだけへ絞ります。',
      caution:
        '秘密情報や重要データがある端末では、特に慎重に判断してください。',
      sourceIds: ['permission-modes'],
      keywords: ['フルアクセス', '危険', '情報流出', '削除'],
      starter: true,
    },
    {
      slug: 'sandbox-vs-approval',
      title: 'サンドボックスと承認は、何が違う？',
      lead: '一つは作業できる場所、もう一つは途中で人に聞く決まりです。',
      answer:
        'サンドボックスはAIが触れられる範囲を決め、承認は特定の操作で止まって確認するタイミングを決めます。',
      explanation:
        'この二つを分けると、『許可したのに動かない』『自動なのに範囲外へ出られない』理由が分かります。',
      steps: [
        '触れられる範囲を確認する',
        '承認が必要な操作を確認する',
        '仕事に合う組み合わせを選ぶ',
      ],
      example: '部屋の広さがサンドボックス、扉を開ける前の声かけが承認です。',
      caution: '製品や組織の設定によって、選べる組み合わせは異なります。',
      sourceIds: ['permission-modes'],
      keywords: ['サンドボックス', '承認', '作業範囲', '権限'],
      starter: true,
    },
    {
      slug: 'why-web-needs-approval',
      title: 'なぜWebへつなぐ時に確認が出るの？',
      lead: '端末の中だけの作業より、情報が外へ動く可能性が増えるからです。',
      answer:
        'Web接続では情報の取得だけでなく、外部サイトへの送信や操作が起こりえます。その境目で確認が入ります。',
      explanation:
        '接続先、送る内容、行う操作を人が見れば、思わぬ公開や送信を防ぎやすくなります。',
      steps: [
        '接続先の名前を読む',
        '送る情報がないか確かめる',
        '目的に必要な時だけ許可する',
      ],
      example:
        '公式情報を調べるための接続か、内容を投稿する操作かを見分けます。',
      caution: '検索結果やWebページの文章も、正しい指示とは限りません。',
      sourceIds: ['permission-modes', 'web-search'],
      keywords: ['インターネット', 'Web', '承認', '送信'],
    },
    {
      slug: 'setting-vs-current-chat',
      title: '設定を変えても、今の作業が変わらない時',
      lead: '設定と、その場で動いているチャットの状態が別になっていることがあります。',
      answer:
        '権限や機能を設定で有効にしても、現在のチャットへすぐ反映されない場合があります。新しいチャットで確かめます。',
      explanation:
        '安全のため、会話を始めた時の条件が途中で勝手に広がらない作りになっている場合があるからです。',
      steps: [
        '設定が保存されたか確認する',
        '新しいチャットを開く',
        '必要な機能が使えるか試す',
      ],
      example:
        'プラグインを入れた後、新しいチャットから呼び出せるか確認します。',
      caution:
        '反映方法は機能や画面によって違うため、公式案内も確認してください。',
      sourceIds: ['plugins', 'permission-modes'],
      keywords: ['設定', '反映', '新しいチャット', '権限'],
    },
    {
      slug: 'os-vs-app-permission',
      title: 'MacやWindowsの許可と、ChatGPTの許可は別',
      lead: 'アプリで許可しても、パソコン側の許可がなければ動かない場合があります。',
      answer:
        '画面操作などでは、OSのアクセシビリティや画面収録と、ChatGPT内の承認の両方が関係します。',
      explanation:
        'OSは端末全体を守り、ChatGPTの設定は一つの作業を守ります。役割が違うため、別々に確認します。',
      steps: [
        'ChatGPT内の許可を確認する',
        'OS側の必要な権限を確認する',
        '小さな操作で動作を試す',
      ],
      example: '画面は見えるのにクリックできない時、OSの操作権限を確認します。',
      caution: '必要のないアプリや範囲までOS権限を広げないでください。',
      sourceIds: ['computer-use'],
      keywords: ['Mac', 'Windows', 'OS', 'アクセシビリティ', '画面収録'],
    },
    {
      slug: 'always-allow',
      title: '「常に許可」を選ぶ前に見ること',
      lead: '同じ確認を減らせますが、次から自動で進む範囲が広がります。',
      answer:
        '対象の操作、アプリ、サイト、期間を読み、今後も任せてよいものだけを常時許可します。',
      explanation:
        '一度だけ必要な操作まで常時許可すると、後の別作業でも確認なしに動く可能性があります。',
      steps: [
        '今回だけか繰り返すか考える',
        '許可される対象を読む',
        '不要になったら設定を戻す',
      ],
      example: '毎回使う安全な定型操作だけに絞り、購入や送信は都度確認します。',
      caution:
        '個人情報、決済、削除を伴う操作は、立ち会って確認する方が安全です。',
      sourceIds: ['computer-use', 'permission-modes'],
      keywords: ['常に許可', '自動操作', '確認', '安全'],
    },
    {
      slug: 'local-is-not-offline',
      title: '「ローカル」は、完全オフラインという意味ではない',
      lead: '作業場所が自分の端末でも、AIの処理まで端末内だけとは限りません。',
      answer:
        'Localは主に、現在のパソコン上のフォルダで作業する方式を表します。必要な文章や画面情報がOpenAIのサービスへ送られる場合があります。',
      explanation:
        '『どこでファイルを操作するか』と『AIがどこで処理するか』は別の話です。機密情報は組織のルールに従います。',
      steps: [
        '扱う情報の機密度を確認する',
        '必要な範囲だけAIへ渡す',
        '組織の設定と方針を確かめる',
      ],
      example: 'ローカル作業でも、顧客名を伏せた資料だけを使います。',
      caution:
        'Localを『データが端末外へ一切出ない設定』とは説明しないでください。',
      sourceIds: ['local-security', 'environment-modes'],
      keywords: ['ローカル', 'オフライン', 'データ', '機密情報'],
      starter: true,
    },
  ]),
] satisfies readonly ChatgptColumn[];

export const chatgptColumns: readonly ChatgptColumn[] = [
  ...unsortedChatgptColumns,
].sort((left, right) => left.id - right.id);

const chatgptColumnBySlug = new Map(
  chatgptColumns.map((column) => [column.slug, column] as const),
);

export function getChatgptColumn(slug: string): ChatgptColumn | undefined {
  return chatgptColumnBySlug.get(slug);
}

export function getChatgptColumnCategory(
  id: string,
): ChatgptColumnCategory | undefined {
  return chatgptColumnCategories.find((category) => category.id === id);
}

export function getRelatedChatgptColumns(
  column: ChatgptColumn,
  limit = 3,
): readonly ChatgptColumn[] {
  if (limit <= 0) return [];

  const keywords = new Set(column.keywords);

  return chatgptColumns
    .filter((candidate) => candidate.slug !== column.slug)
    .map((candidate) => ({
      candidate,
      score:
        (candidate.category === column.category ? 10 : 0) +
        candidate.keywords.filter((keyword) => keywords.has(keyword)).length,
    }))
    .sort(
      (left, right) =>
        right.score - left.score || left.candidate.id - right.candidate.id,
    )
    .slice(0, Math.floor(limit))
    .map(({ candidate }) => candidate);
}
