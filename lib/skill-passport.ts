export const evidenceSourceTypes = ["curriculum", "prior-work"] as const;
export type EvidenceSourceType = (typeof evidenceSourceTypes)[number];

export const evidenceSourceLabels: Record<EvidenceSourceType, string> = {
  curriculum: "Web教科書の課題",
  "prior-work": "これまでの実務・自主制作",
};

export const evidenceVisibilityValues = ["private", "shared"] as const;
export type EvidenceVisibility = (typeof evidenceVisibilityValues)[number];

export const instructorStatusLabels = {
  pending: "講師確認待ち",
  verified: "講師確認済み",
  changes_requested: "補足・修正待ち",
} as const;

export type InstructorStatus = keyof typeof instructorStatusLabels;

export const externalRelationshipValues = [
  "manager",
  "colleague",
  "client",
  "teacher",
  "project-member",
  "other",
] as const;

export type ExternalRelationship = (typeof externalRelationshipValues)[number];

export const externalRelationshipLabels: Record<ExternalRelationship, string> =
  {
    manager: "上司・責任者",
    colleague: "同僚",
    client: "顧客・依頼者",
    teacher: "社外の講師・指導者",
    "project-member": "共同制作者・プロジェクトメンバー",
    other: "その他",
  };

export const externalObservationOptions = [
  {
    id: "used-output",
    label: "この成果物を実際に見た、または使った",
  },
  {
    id: "met-request",
    label: "依頼や目的に沿う形で完成していた",
  },
  {
    id: "explained",
    label: "本人が作り方・使い方・注意点を説明できた",
  },
  {
    id: "improved-work",
    label: "仕事の速さ・質・分かりやすさの改善を確認した",
  },
  {
    id: "handled-safely",
    label: "確認・公開範囲・機密情報へ配慮していた",
  },
] as const;

export type ExternalObservationId =
  (typeof externalObservationOptions)[number]["id"];

export const externalRatingLabels: Record<number, string> = {
  1: "成果物を見た",
  2: "一部の作業を確認した",
  3: "実際の利用場面で確認した",
  4: "複数回・継続利用を確認した",
};

export const moderationStatusLabels = {
  pending: "運営確認待ち",
  approved: "掲載可",
  rejected: "掲載しない",
} as const;

export type ModerationStatus = keyof typeof moderationStatusLabels;

export function parseObservationIds(value: string): ExternalObservationId[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    const valid = new Set(
      externalObservationOptions.map((option) => option.id),
    );
    return parsed.filter(
      (item): item is ExternalObservationId =>
        typeof item === "string" && valid.has(item as ExternalObservationId),
    );
  } catch {
    return [];
  }
}
