/**
 * Web教科書で共有する定数と小さなヘルパー。
 * 課題データへ同じ表示ロジックを730回コピーしないための正本。
 * 材料の共通案内は lib/textbook-material-guide.ts が持つ。
 */

export const lessonSections = [
  { id: 'goal', number: '01', label: '今日はこれを作る' },
  { id: 'start', number: '02', label: '材料を渡す' },
  { id: 'prompt', number: '03', label: 'ChatGPTに送るプロンプト' },
  { id: 'compare', number: '04', label: 'AIの答えを確認して試す' },
  { id: 'improve', number: '05', label: '仕上がりをよくするコツ' },
  { id: 'check', number: '06', label: 'やりがちなミス' },
  { id: 'complete', number: '07', label: 'ここまでできたら完成' },
  { id: 'application', number: '08', label: '自分の仕事なら' },
  { id: 'ask', number: '09', label: '困ったら講師に聞く' },
  { id: 'stepup', number: '10', label: '次に進みたい方へ' },
] as const;

export type LessonSectionId = (typeof lessonSections)[number]['id'];

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
