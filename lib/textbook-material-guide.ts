import type { TextbookLesson } from '@/lib/textbook-lessons/types';

type MaterialGuideLesson = Pick<
  TextbookLesson,
  'carryIn' | 'files' | 'recommendedMode'
>;

export type TextbookMaterialGuide = {
  badge: string;
  summary: string;
  steps: readonly string[];
  modeNote: string;
  alternative: string | null;
  failureNote: string | null;
  promptLead: string;
};

function isCopyableTextFile(file: string) {
  return file.startsWith('課題/') && file.endsWith('.txt');
}

/**
 * 教科書共通の材料案内。inputMethodの定型文ではなく、その課題で
 * 実際に表示するTXT・添付資料・前課題の完成物から案内を作る。
 */
export function getTextbookMaterialGuide(
  lesson: MaterialGuideLesson,
): TextbookMaterialGuide {
  const hasCarryIn = Boolean(lesson.carryIn);
  const hasTextFiles = lesson.files.some(isCopyableTextFile);
  const hasFilesToAttach = lesson.files.some(
    (file) => !isCopyableTextFile(file),
  );
  const hasAnyMaterial = hasCarryIn || hasTextFiles || hasFilesToAttach;

  if (!hasAnyMaterial) {
    return {
      badge: '材料：なし',
      summary: '材料なし。そのまま一言送る',
      steps: ['「まずこう言ってみる」をそのまま送る'],
      modeNote:
        lesson.recommendedMode === 'work'
          ? 'Workが表示されるならそこで始めます。なければChatへ同じ一言を送って進めます。'
          : 'Chatの入力欄を使います。',
      alternative: null,
      failureNote: null,
      promptLead: '材料はいりません。この一言をそのまま送ります。',
    };
  }

  const summaryParts: string[] = [];
  const steps: string[] = [];
  if (hasCarryIn) {
    summaryParts.push('前の完成物を使う');
    steps.push('上に書かれた方法で、前の完成物を用意する');
  }
  if (hasTextFiles) {
    summaryParts.push('TXTはコピー');
    steps.push('TXTはこのページで中身をコピーし、入力欄へ貼る');
  }
  if (hasFilesToAttach) {
    summaryParts.push('資料はZIPから添付');
    steps.push('ZIPを展開し、上で指定された資料だけを添付する');
  }
  steps.push('材料がそろったら「まずこう言ってみる」を送る');

  const badge = hasCarryIn
    ? lesson.files.length > 0
      ? '材料：引継ぎ＋今回の資料'
      : '材料：前の完成物'
    : hasTextFiles && hasFilesToAttach
      ? '材料：TXT＋添付資料'
      : hasTextFiles
        ? '材料：TXTを貼る'
        : '材料：資料を添付';

  const promptLead =
    hasCarryIn && lesson.files.length === 0
      ? '上に書かれた前の完成物を用意してから、この一言を送ります。'
      : hasCarryIn
        ? '上に書かれた前の完成物と今回の材料をそろえてから、この一言を送ります。'
        : hasTextFiles && hasFilesToAttach
          ? 'TXTを貼り、指定資料の添付名を確認してから、この一言を送ります。'
          : hasTextFiles
            ? 'TXTの中身を貼り、その下にこの一言を続けます。'
            : '指定資料の添付名を確認してから、この一言を送ります。';

  return {
    badge,
    summary: summaryParts.join(' ／ '),
    steps,
    modeNote:
      lesson.recommendedMode === 'work'
        ? 'Workが表示されるならそこで続けます。なければChatへ同じ内容を送って進めます。'
        : 'Chatの入力欄を使います。',
    alternative: hasFilesToAttach
      ? 'ドラッグできない時は、入力欄のクリップまたはファイル選択を使います。スマホは「ファイル」から共有できます。'
      : hasTextFiles
        ? 'コピーしにくい時は、TXTをファイルのまま添付しても構いません。'
        : null,
    failureNote:
      hasTextFiles || hasFilesToAttach
        ? 'AIが資料を読めない時は、必要部分を貼るか添付し直します。読めない内容を推測させません。'
        : null,
    promptLead,
  };
}
