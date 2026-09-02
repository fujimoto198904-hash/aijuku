import type {
  TextbookLesson,
  TextbookLessonCompletion,
  TextbookLessonStepUp,
} from './types';

type ImprovementTipSeed = readonly [title: string, say: string];

type NextPromptSeed = {
  when: string;
  say: string;
  afterActions?: readonly string[];
};

type StepSeed = {
  title: string;
  carryOver: string;
  adds: string;
  say: string;
  /** 自然な発展先を正式な次課題と変えたい時だけ指定する */
  targetTaskId?: string;
};

export type LessonSeed = {
  id: string;
  deliverable: string;
  firstWord: string;
  tryActions: readonly string[];
  tips: readonly ImprovementTipSeed[];
  mistakes: readonly string[];
  application: string;
  saveAs: string;
  step: StepSeed;
  files?: readonly string[];
  carryIn?: string;
  inputMethod?: TextbookLesson['inputMethod'];
  recommendedMode?: TextbookLesson['recommendedMode'];
  duration?: string;
  nextPrompts?: readonly NextPromptSeed[];
  completion?: readonly string[];
  completionGroups?: TextbookLessonCompletion extends infer _T
    ? readonly { title: string; items: readonly string[] }[]
    : never;
  savePrompt?: string;
};

function formalNextTaskIdFor(taskId: string): string | null {
  if (taskId === 'Lv.200' || taskId.endsWith('-10')) return null;

  const common = /^Lv\.(\d+)$/.exec(taskId);
  if (common) return `Lv.${Number(common[1]) + 1}`;

  const specialist = /^([A-Z]+)-(\d{2})$/.exec(taskId);
  if (specialist) {
    return `${specialist[1]}-${String(Number(specialist[2]) + 1).padStart(2, '0')}`;
  }

  throw new Error(`次の課題IDを計算できません: ${taskId}`);
}

function buildStepUp(taskId: string, step: StepSeed): TextbookLessonStepUp {
  const formalNextTaskId = formalNextTaskIdFor(taskId);
  if (formalNextTaskId === null) {
    return {
      kind: 'terminal',
      targetTaskId: null,
      formalNextTaskId: null,
      title: step.title,
      carryOver: step.carryOver,
      adds: step.adds,
      say: step.say,
    };
  }

  return {
    kind: 'task',
    targetTaskId: step.targetTaskId ?? formalNextTaskId,
    formalNextTaskId,
    title: step.title,
    carryOver: step.carryOver,
    adds: step.adds,
    say: step.say,
  };
}

/**
 * 章本文の定型配線だけをまとめる補助関数。
 * 受講者が読む固有部分は LessonSeed で必ず課題ごとに書く。
 */
export function lesson(seed: LessonSeed): TextbookLesson {
  const files = seed.files ?? [];
  const inputMethod =
    seed.inputMethod ?? (files.length > 0 || seed.carryIn ? 'attach' : 'none');
  const recommendedMode =
    seed.recommendedMode ??
    (files.length > 0 || seed.carryIn || seed.nextPrompts?.length
      ? 'work'
      : 'chat');
  const duration =
    seed.duration ??
    (seed.nextPrompts?.length
      ? '最初の完成まで 25〜40分'
      : '最初の完成まで 10〜20分');

  const completionPart: TextbookLessonCompletion = seed.completionGroups
    ? { completionGroups: seed.completionGroups }
    : {
        completion: seed.completion ?? [
          `${seed.saveAs}を自分で開き、今回作った内容が見えることを確かめた`,
          `${seed.saveAs}の一か所を自分で変え、保存後に開き直して変更が残っていた`,
        ],
      };

  return {
    duration,
    deliverable: seed.deliverable,
    files,
    ...(seed.carryIn ? { carryIn: seed.carryIn } : {}),
    inputMethod,
    recommendedMode,
    firstWord: seed.firstWord,
    ...(seed.nextPrompts ? { nextPrompts: seed.nextPrompts } : {}),
    tryActions: seed.tryActions,
    improvementTips: seed.tips.map(([title, say]) => ({ title, say })),
    mistakes: seed.mistakes,
    savePrompt:
      seed.savePrompt ??
      `今回できた物と確認メモを、完成フォルダへ「${seed.saveAs}」という名前で保存して。うまくいった指示と、まだ人が確認する所も一緒に残して。`,
    application: seed.application,
    stepUp: buildStepUp(seed.id, seed.step),
    ...completionPart,
  };
}
