import type { TextbookTask } from "@/lib/textbook-catalog";

export const skillDefinitions = [
  {
    key: "ai-dialogue",
    label: "AI対話・指示設計",
    shortLabel: "AI対話",
    description: "目的や条件を言葉にし、AIの出力を確認しながら改善する力",
    patterns: [
      /会話/,
      /プロンプト/,
      /指示/,
      /質問/,
      /メール/,
      /要約/,
      /翻訳/,
      /文章/,
      /議事録/,
    ],
  },
  {
    key: "research",
    label: "調査・根拠確認",
    shortLabel: "調査",
    description: "情報源を確かめ、事実と未確認事項を分けて伝える力",
    patterns: [
      /調査/,
      /検索/,
      /出典/,
      /根拠/,
      /引用/,
      /事実確認/,
      /資料室/,
      /新聞/,
      /レポート/,
    ],
  },
  {
    key: "data",
    label: "データ・表計算",
    shortLabel: "データ",
    description: "データを整え、計算・分析・可視化できる形へ変える力",
    patterns: [
      /データ/,
      /excel/i,
      /スプレッドシート/,
      /表計算/,
      /数式/,
      /ダッシュボード/,
      /分析/,
      /集計/,
      /可視化/,
      /見積/,
      /請求/,
      /経理/,
    ],
  },
  {
    key: "visual-design",
    label: "画像・デザイン",
    shortLabel: "デザイン",
    description: "用途に合わせて、画像・配色・構成を見やすく整える力",
    patterns: [
      /画像/,
      /デザイン/,
      /ロゴ/,
      /ブランド/,
      /漫画/,
      /絵本/,
      /ビジュアル/,
      /写真/,
      /図解/,
      /配色/,
    ],
  },
  {
    key: "content",
    label: "発信・コンテンツ制作",
    shortLabel: "発信",
    description: "相手と媒体に合わせて、伝わるコンテンツを完成させる力",
    patterns: [
      /sns/i,
      /ブログ/,
      /動画/,
      /音声/,
      /ポッドキャスト/,
      /プレゼン/,
      /スライド/,
      /広告/,
      /発信/,
      /出版/,
      /記事/,
      /台本/,
      /コンテンツ/,
    ],
  },
  {
    key: "web-app",
    label: "Web・アプリ制作",
    shortLabel: "Web・アプリ",
    description: "画面だけでなく、操作・保存・利用者まで考えて仕組みを作る力",
    patterns: [
      /web/i,
      /サイト/,
      /アプリ/,
      /ゲーム/,
      /html/i,
      /pwa/i,
      /マイページ/,
      /フォーム/,
      /データベース/,
      /ホームページ/,
    ],
  },
  {
    key: "automation",
    label: "自動化・連携",
    shortLabel: "自動化",
    description: "繰り返す仕事や複数の道具を、安全につなげて動かす力",
    patterns: [
      /自動/,
      /連携/,
      /定期実行/,
      /通知/,
      /ワークフロー/,
      /ai実行基盤/i,
      /受付センター/,
      /外部接続/,
    ],
  },
  {
    key: "safe-operations",
    label: "安全・品質・運用",
    shortLabel: "安全運用",
    description: "権限・確認・公開範囲・復旧まで含めて仕事として運用する力",
    patterns: [
      /安全/,
      /権限/,
      /個人情報/,
      /プライバシー/,
      /著作権/,
      /承認/,
      /監視/,
      /復旧/,
      /運用/,
      /品質/,
      /人の確認/,
      /人が確認/,
      /公開判断/,
      /限定公開/,
    ],
  },
  {
    key: "business-practice",
    label: "業務・現場実践",
    shortLabel: "業務実践",
    description: "AIを自分の担当業務や業界の流れへ置き換えて使う力",
    patterns: [
      /営業/,
      /顧客/,
      /業務/,
      /現場/,
      /会社/,
      /店舗/,
      /採用/,
      /組織/,
      /部門/,
      /経営/,
      /業種/,
    ],
  },
  {
    key: "handoff",
    label: "説明・引き継ぎ",
    shortLabel: "引き継ぎ",
    description: "成果物の使い方・根拠・制約を、他の人へ渡せる形にする力",
    patterns: [
      /引き継/,
      /再利用/,
      /版管理/,
      /共同/,
      /チーム/,
      /説明/,
      /手順/,
      /マニュアル/,
      /第三者/,
    ],
  },
] as const;

export type SkillKey = (typeof skillDefinitions)[number]["key"];

export type SkillDefinition = {
  key: SkillKey;
  label: string;
  shortLabel: string;
  description: string;
};

const fallbackSkill: SkillKey = "ai-dialogue";

export function getSkillDefinition(key: string): SkillDefinition | null {
  const definition = skillDefinitions.find((item) => item.key === key);
  return definition
    ? {
        key: definition.key,
        label: definition.label,
        shortLabel: definition.shortLabel,
        description: definition.description,
      }
    : null;
}

export function inferTaskSkills(task: TextbookTask): SkillKey[] {
  const searchable = [
    task.trackLabel,
    task.courseTitle,
    task.coursePromise,
    task.title,
    task.action,
    task.outcome,
    ...task.tags,
  ].join(" ");

  const scores = skillDefinitions.map((definition) => {
    let score = definition.patterns.reduce(
      (total, pattern) => total + (pattern.test(searchable) ? 1 : 0),
      0,
    );
    if (
      definition.key === "business-practice" &&
      (task.track === "department" || task.track === "industry")
    ) {
      score += 3;
    }
    return { key: definition.key, score };
  });

  const selected = scores
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.key);

  return selected.length > 0 ? selected : [fallbackSkill];
}

export function parseSkillKeys(value: string): SkillKey[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    const valid = new Set(skillDefinitions.map((item) => item.key));
    return parsed.filter(
      (item): item is SkillKey =>
        typeof item === "string" && valid.has(item as SkillKey),
    );
  } catch {
    return [];
  }
}
