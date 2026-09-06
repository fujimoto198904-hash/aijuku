// 新規アップロードのみ適用。保存済み画像を縮小・削除しない。
export const communityMediaLimits = {
  maxBytes: 500_000,
  maxEdge: 1200,
  inputMaxBytes: 12_000_000,
  memberMaxBytes: 50_000_000,
  siteMaxBytes: 2_000_000_000,
  dailyUploads: 20,
  pendingUploads: 5,
} as const;
