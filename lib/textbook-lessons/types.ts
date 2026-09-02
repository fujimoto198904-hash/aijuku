/**
 * 教科書本文の正本型。
 *
 * - 1章(=1コース10課題)につき1ファイルの正本を `lib/textbook-lessons/<track>/` に置く。
 * - 共有できる案内文(材料の渡し方の一般説明、保存の一般手順、藤本への相談テンプレート等)は
 *   UI側(components/textbook/lesson-shared.ts)とレビュー文書生成(scripts/check_textbook_lessons.ts)が持つ。
 *   ここには課題固有の内容だけを書く。
 * - 検査は `npm run check:lessons`(全体) / `npx tsx scripts/check_textbook_lessons.ts --chapter <key>`(章単位)。
 */

export type TextbookLessonCompletion =
  | {
      /** 本人が開く・使う・比べる・止める・保存する条件。AIの自己申告を証拠にしない */
      completion: readonly string[];
      completionGroups?: undefined;
    }
  | {
      completion?: undefined;
      /** 定期実行等、当日の確認と後日の証拠が分かれる課題だけが使う */
      completionGroups: readonly {
        title: string;
        items: readonly string[];
      }[];
    };

export type TextbookLessonStepUp =
  | {
      kind: 'task';
      /** 任意のステップアップで育てる行き先(成果物が自然に育つ課題) */
      targetTaskId: string;
      /** コースを順番に進む正式な次課題 */
      formalNextTaskId: string;
      title: string;
      carryOver: string;
      adds: string;
      say: string;
    }
  | {
      /** コース終端(共通Lv.200・専門コースの-10)だけが使う総仕上げ */
      kind: 'terminal';
      targetTaskId: null;
      formalNextTaskId: null;
      title: string;
      carryOver: string;
      adds: string;
      say: string;
    };

export type TextbookLesson = {
  /** 最初の完成までの目安(例: 「最初の完成まで 10〜15分」) */
  duration: string;
  /** 今回手元に残る物。ファイル名・画面・動作が浮かぶ言い方 */
  deliverable: string;
  /**
   * 使う材料。生成元の3業種デモに共通する相対パス
   * (lib/demo-data-files.generated.json に実在するもののみ)。公開時は
   * 課題に割り当てた1業種の必要ファイルだけを直接配信する。
   * 材料不要(inputMethod: 'none')または前課題の完成品だけ(carryIn)なら空配列。
   */
  files: readonly string[];
  /** 前課題から引き継いで材料にする完成品の説明(例: 「Lv.01で保存した「AI秘書.md」を貼る」) */
  carryIn?: string;
  /** 材料の渡し方。'none' は材料不要で最初の一言だけで始められる課題 */
  inputMethod: 'paste' | 'attach' | 'mixed' | 'none';
  /** すすめる作業画面。使えない時の代替経路はUI側の共通案内が持つ */
  recommendedMode: 'chat' | 'work';
  /** まずこう言ってみる。現場の人が実際に言いそうな、短く少し雑な一言 */
  firstWord: string;
  /** 最初の一言だけで完成しない課題の、続きの会話(任意) */
  nextPrompts?: readonly {
    when: string;
    say: string;
    afterActions?: readonly string[];
  }[];
  /** 実際に触ること。開く、押す、数字を変える、比べる等の本人操作 */
  tryActions: readonly string[];
  /** 出力を上げるコツ。3つ以内から1つ選ぶ */
  improvementTips: readonly { title: string; say: string }[];
  /** やりがちなミス。その成果物で本当に起きやすい具体的な失敗 */
  mistakes: readonly string[];
  /** Workで保存を頼む一言。Chatでの本人保存はUI共通案内が持つ */
  savePrompt: string;
  /** 自分の仕事なら。一か所だけ置き換えれば応用できる例 */
  application: string;
  stepUp: TextbookLessonStepUp;
} & TextbookLessonCompletion;

export type TextbookTrackId =
  | 'common'
  | 'department'
  | 'industry'
  | 'generation';

/** 10問後に到達する旗艦作品の完成イメージ(1章に最低1つ) */
export type TextbookChapterFlagship = {
  /** 作品名(例: 「初日から使える自分専用AI秘書セット」) */
  title: string;
  /** 何がどう使える状態かの一文 */
  summary: string;
  /** 完成イメージの見せ方 */
  preview: {
    /** files: 完成フォルダの中身 / screen: 画面の見どころ / excerpt: 成果物の抜粋 / flow: 仕事の流れ */
    kind: 'files' | 'screen' | 'excerpt' | 'flow';
    /** プレビューとして描画する行(ファイル名、画面要素、抜粋行等) */
    lines: readonly string[];
  };
};

export type TextbookChapter = {
  /** 章キー(例: 'common-01'、'department-mgt'、'industry-sal'、'generation-img') */
  key: string;
  track: TextbookTrackId;
  /** カタログのコースコード(例: 'Lv.01–10'、'01') */
  courseCode: string;
  flagship: TextbookChapterFlagship;
  /** この章の10課題。キーは課題ID */
  lessons: Readonly<Record<string, TextbookLesson>>;
};
