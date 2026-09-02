/**
 * Web教科書で共有する定数と小さなヘルパー。
 * 課題データへ同じ説明文を730回コピーしないため、共通の案内文はここが正本。
 * (レビュー文書側の対応物は scripts/check_textbook_lessons.ts)
 */

import type { TextbookLesson } from '@/lib/textbook-lessons/types';

export const lessonSections = [
  { id: 'goal', number: '01', label: '今日はこれを作る' },
  { id: 'start', number: '02', label: '材料を渡す' },
  { id: 'prompt', number: '03', label: 'まずこう言ってみる' },
  { id: 'compare', number: '04', label: '出てきた物を実際に触る' },
  { id: 'improve', number: '05', label: '出力を上げるコツ' },
  { id: 'check', number: '06', label: 'やりがちなミス' },
  { id: 'complete', number: '07', label: 'ここまでできたら完成' },
  { id: 'application', number: '08', label: '自分の仕事なら' },
  { id: 'ask', number: '09', label: '困ったら藤本に聞く' },
  { id: 'stepup', number: '10', label: 'ステップアップ' },
] as const;

export type LessonSectionId = (typeof lessonSections)[number]['id'];

export const inputGuides: Record<
  TextbookLesson['inputMethod'],
  {
    title: string;
    description: string;
    steps: readonly string[];
    alternative: string;
  }
> = {
  paste: {
    title: '短い文章は、中身をコピーして貼る',
    description:
      '短いTXTやメモは、ファイル名を伝えるより中身を貼る方が早くて確実です。ChatGPTのChatでもWorkでもできます。',
    steps: [
      '下にあるメモを開く',
      '中身を全部コピーして入力欄へ貼る',
      'その下に「まずこう言ってみる」を続ける',
    ],
    alternative:
      'コピーしにくい時はファイルを添付しても大丈夫です。スマホは共有メニューか、ChatGPTの入力欄にあるクリップ・ファイル選択を使えます。',
  },
  attach: {
    title: 'ZIPを取得・展開し、指定ファイルを入れる',
    description:
      'PDF・Word・Excel・画像はZIPに入っています。ZIPを展開し、必要なファイルだけをChatGPTの入力欄へドラッグします。',
    steps: [
      '下の導線からZIPを取得し、展開する',
      '指定ファイルを入力欄へドラッグする',
      '添付後に「まずこう言ってみる」を送る',
    ],
    alternative:
      'ドラッグできない時は、入力欄のクリップ・ファイル選択を使います。スマホは「ファイル」アプリから共有するか、ChatGPT側のファイル選択を使います。',
  },
  mixed: {
    title: '短文はコピー、書式資料はZIPから入れる',
    description:
      '全部をファイルで渡す必要はありません。短いTXTは中身をコピーし、PDF・Word・Excel・画像はZIPを展開して必要なものだけを入れます。',
    steps: [
      '下の短いメモをコピーして入力欄へ貼る',
      'ZIPを展開し、指定資料を入力欄へドラッグする',
      '全部そろったら「まずこう言ってみる」を送る',
    ],
    alternative:
      'ドラッグできない時はクリップ・ファイル選択へ切り替えます。スマホは「ファイル」アプリから共有するか、ChatGPT側で選択します。',
  },
  none: {
    title: '材料なしで、そのまま話しかける',
    description:
      'この課題は、デモフォルダのファイルを渡さずに始められます。入力欄へ「まずこう言ってみる」を送るだけです。',
    steps: [
      '入力欄を開く',
      '「まずこう言ってみる」をそのまま送る',
      '出てきた物を見てから、続きを足す',
    ],
    alternative:
      '手元に自分のメモがあれば、架空の内容に置き換えて貼っても構いません。実在の個人情報は貼りません。',
  },
};

export const inputMethodLabels: Record<TextbookLesson['inputMethod'], string> =
  {
    paste: '材料：中身を貼る',
    attach: '材料：ファイルを添付',
    mixed: '材料：貼る＋添付',
    none: '材料：なしで始められる',
  };

export const modeGuides: Record<TextbookLesson['recommendedMode'], string> = {
  chat: 'ChatGPTのChatを開き、その入力欄へ材料を渡します。新しいチャットでも、続きのチャットでも構いません。',
  work: 'ChatGPTでWorkが表示される場合は、展開したデモフォルダを開き、その入力欄へ材料を渡します。Workがない場合は、Chatへ同じように貼る・添付し、できたファイルを自分で保存します。',
};

export function humanFileName(file: string) {
  const segments = file.split('/');
  const name = segments[segments.length - 1];
  const folder = segments.slice(0, -1).join('/');
  return folder ? `「${folder}」フォルダの「${name}」` : `「${name}」`;
}

export function normalizeSearch(value: string) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('ja')
    .replace(
      /(?:レベル|level|lv)\.?0*(\d{1,3})/g,
      (_, level: string) => `lv${level.padStart(2, '0')}`,
    )
    .replace(/見積もり|見積り|お見積り|お見積もり/g, '見積')
    .replace(/パワーポイント|パワポ|powerpoint|スライド/g, 'ppt')
    .replace(/エクセル|excel|スプレッドシート/g, 'xlsx')
    .replace(/ホームページ|ウェブサイト|webサイト|サイト制作|hp/g, 'web')
    .replace(/スマホアプリ|携帯アプリ/g, 'アプリ')
    .replace(/ゲーム/g, 'game')
    .replace(/インスタグラム|インスタ|instagram/g, 'igc')
    .replace(/ユーチューブ|youtube/g, 'ytb')
    .replace(/[\p{P}\p{S}\s]+/gu, '');
}

/** チェック状態の端末内保存キー(この端末だけ)。保存失敗は握りつぶして未保存動作にする */
export type StoredChecksResult = {
  checks: boolean[];
  status: 'saved' | 'not-saved' | 'unavailable';
};

export function readStoredChecks(
  taskId: string,
  count: number,
): StoredChecksResult {
  const emptyChecks = () => Array.from({ length: count }, () => false);
  try {
    const raw = window.localStorage.getItem(`aijuku-textbook-checks:${taskId}`);
    if (!raw) return { checks: emptyChecks(), status: 'not-saved' };
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return { checks: emptyChecks(), status: 'not-saved' };
    }
    return {
      checks: Array.from({ length: count }, (_, index) =>
        Boolean(parsed[index]),
      ),
      status: 'saved',
    };
  } catch {
    return { checks: emptyChecks(), status: 'unavailable' };
  }
}

export function writeStoredChecks(taskId: string, checks: boolean[]) {
  try {
    window.localStorage.setItem(
      `aijuku-textbook-checks:${taskId}`,
      JSON.stringify(checks),
    );
    return true;
  } catch {
    return false;
  }
}
