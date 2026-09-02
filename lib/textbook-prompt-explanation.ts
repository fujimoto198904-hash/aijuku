import type { TextbookLesson } from './textbook-lessons/types';

export type TextbookPromptExplanation = {
  reason: string;
  advice: string;
};

const asksBeforeMakingPattern =
  /(?:一つずつ|一個ずつ|順番に).{0,12}(?:聞いて|質問して)|(?:先に|最初に).{0,12}(?:聞いて|質問して)|(?:分からない|足りない|未記入).{0,12}(?:聞いて|質問して)/;
const comparesOptionsPattern =
  /(?:複数|いくつか|何|[二三四五六七八九十0-9]+).{0,6}(?:案|候補).{0,20}(?:比べ|比較|選)|(?:案|候補)(?:同士)?を.{0,6}(?:比べ|比較)|(?:案|候補)から.{0,6}(?:選|採用)/;
const pausesBeforeActionPattern =
  /まだ.{0,20}(?:送|公開|投稿|実行|予約|発注|契約|支払|配信|配布|接続|登録|申請|削除)|(?:下書き|草案).{0,12}(?:止まり|のまま)|人.{0,12}(?:確認|承認).{0,12}(?:してから|するまで)/;
const preventsGuessingPattern =
  /勝手|足さない|推測しない|埋めない|でっち上げ|捏造|(?:資料|根拠|事実)にない.{0,8}(?:足|書|入)|事実.{0,8}(?:作|変え)/;
const specifiesShapePattern =
  /表(?:に|で|へ|形式|として)|表を.{0,6}(?:作|出|並|まとめ)|一覧|箇条書き|JSON|CSV|Markdown|PDF|スライド|ページ|列|カード|リスト|台本|見出し|項目/i;

/**
 * 730課題へ同じ説明文を重複保存せず、実際の最初の一言と教材設定から
 * 初学者向けの短い解説を組み立てる。
 */
export function getTextbookPromptExplanation(
  lesson: TextbookLesson,
): TextbookPromptExplanation {
  const prompt = lesson.firstWord;
  const asksBeforeMaking = asksBeforeMakingPattern.test(prompt);
  const comparesOptions = comparesOptionsPattern.test(prompt);
  const pausesBeforeAction = pausesBeforeActionPattern.test(prompt);
  const preventsGuessing = preventsGuessingPattern.test(prompt);
  const specifiesShape = specifiesShapePattern.test(prompt);

  let opening: string;
  if (asksBeforeMaking) {
    opening = 'いきなり答えを作らせず、足りない情報を先に質問させる形です。';
  } else if (comparesOptions) {
    opening =
      '一案だけで決めず、候補を同じ条件で出して比べられるようにしています。';
  } else if (lesson.carryIn) {
    opening =
      '前の課題で作った物を土台にするので、同じ説明を繰り返さず、続きから頼める形です。';
  } else if (lesson.inputMethod === 'paste') {
    opening =
      '詳しい事実は貼り付ける本文に任せ、AIにしてほしい作業を先に決めています。';
  } else if (
    lesson.inputMethod === 'attach' ||
    lesson.inputMethod === 'mixed'
  ) {
    opening =
      '詳しい事実は渡す資料に任せ、AIにしてほしい作業を先に決めています。';
  } else {
    opening =
      '作りたい物を普段の言葉で伝え、最初のたたき台を出してもらうための文です。';
  }

  let purpose: string;
  if (pausesBeforeAction) {
    purpose =
      '最後で作業を止めているのは、AIの案と人の最終判断を分けるためです。';
  } else if (preventsGuessing) {
    purpose =
      '「勝手に足さない・決めない」まで伝え、もっともらしい作り話を防ぎます。';
  } else if (specifiesShape) {
    purpose =
      '返してほしい形も伝えることで、あとから見比べて直しやすくしています。';
  } else if (lesson.carryIn && !opening.startsWith('前の課題')) {
    purpose = '前の完成品を使うので、毎回白紙からやり直す必要がありません。';
  } else {
    purpose =
      '最初から完璧を狙わず、出てきた物を見てから直せる余白を残しています。';
  }

  const firstTip = lesson.improvementTips[0];
  const advice = firstTip
    ? `もし「${firstTip.title}」と感じたら、次はこう伝えます：${firstTip.say}`
    : '暗記は不要です。コピーして試し、返答を見て「違う所」を一つだけ言い直せば十分です。';

  return {
    reason: `${opening}${purpose}`,
    advice,
  };
}
