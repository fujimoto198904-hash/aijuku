/**
 * Web教科書の「料金プラン」と「作業環境」の目安。
 *
 * 料金と作業環境は別の軸である。Codexは有料プラン名ではないため、
 * 料金マークとCodex向きの目印を一つの区分に混ぜない。
 */

export type TextbookPlanAccess = 'free' | 'paid-recommended';

export type TextbookAccessProfile = {
  plan: TextbookPlanAccess;
  /** Workでも進められるが、実コード・実ファイルの操作ではCodexが特に向く課題 */
  codexRecommended: boolean;
  planReason: string;
  codexReason: string | null;
};

export type TextbookAccessTask = {
  id: string;
  track: 'common' | 'department' | 'industry' | 'generation';
  action: string;
  tags: readonly string[];
};

/**
 * 画像・音声・動画の反復生成、定期実行、外部接続、公開、
 * 長いコード制作は利用量や接続条件の影響が大きい。
 * 「有料限定」と断定せず、始める前の確認が必要な「有料版推奨」とする。
 */
const paidFeatureTags = new Set([
  '定期実行',
  '外部接続',
  '連携',
  'AI実行基盤',
  '公開',
]);

const mediaTags = new Set([
  '画像',
  '画像編集',
  'ロゴ',
  'キャラクター',
  '作曲',
  '音楽',
  '音声',
  '音声編集',
  '音響演出',
  'BGM',
  'ジングル',
  '動画',
  '動画設計',
  '短尺動画',
  '縦型動画',
  '音声番組',
  'サムネイル',
]);

const mediaCreationPattern =
  /作る|作り|描く|描こう|仕上げる|生成する|編集する|撮影する|録音する|作曲する/;

function taskNumber(taskId: string): number | null {
  const common = /^Lv\.(\d{1,3})$/.exec(taskId);
  if (common) return Number(common[1]);

  const specialist = /^[A-Z]{2,4}-(\d{2})$/.exec(taskId);
  return specialist ? Number(specialist[1]) : null;
}

/** 教科書の手順で、実コード・実ファイルの編集と動作確認を行う範囲。 */
export function isCodexPracticeTask(taskId: string): boolean {
  const common = /^Lv\.(\d{1,3})$/.exec(taskId);
  if (common) {
    const level = Number(common[1]);
    return (level >= 61 && level <= 71) || (level >= 76 && level <= 200);
  }

  const specialist = /^(WEB|GAM|APP)-(\d{2})$/.exec(taskId);
  if (!specialist) return false;

  const number = Number(specialist[2]);
  if (specialist[1] === 'WEB') return number >= 6;
  return number >= 3;
}

export function getTextbookAccessProfile(
  task: TextbookAccessTask,
): TextbookAccessProfile {
  const codexRecommended = isCodexPracticeTask(task.id);
  const matchedFeatureTags = task.tags.filter((tag) =>
    paidFeatureTags.has(tag),
  );
  const hasMediaTag = task.tags.some((tag) => mediaTags.has(tag));
  const actionWithoutNegativeCreation = task.action
    .replaceAll('作り直さない', '')
    .replaceAll('生成しない', '')
    .replaceAll('編集しない', '');
  const usesRepeatedMedia =
    hasMediaTag &&
    (task.track === 'generation' ||
      mediaCreationPattern.test(actionWithoutNegativeCreation));
  const plan: TextbookPlanAccess =
    codexRecommended || matchedFeatureTags.length > 0 || usesRepeatedMedia
      ? 'paid-recommended'
      : 'free';

  const planReason =
    plan === 'free'
      ? 'ChatGPTの無料版で始めやすい課題です。上限に達したら、時間を置いて続けます。'
      : codexRecommended
        ? 'ファイル変更を何度も行うため、有料版がおすすめです。使える量はプラン画面で確認してください。'
        : usesRepeatedMedia
          ? '画像・音声・動画を何度も作り直すため、有料版がおすすめです。'
          : 'プランによって使えない機能があります。始める前にプラン画面を確認してください。';

  return {
    plan,
    codexRecommended,
    planReason,
    codexReason: codexRecommended
      ? '実際のファイルやコードを扱うなら、Codexがおすすめです。'
      : null,
  };
}

/** 管理画面や検査スクリプトで、課題IDが規約内かを確認する。 */
export function hasRecognizedTaskNumber(taskId: string): boolean {
  return taskNumber(taskId) !== null;
}
