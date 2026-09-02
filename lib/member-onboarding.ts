export const learningGoalValues = [
  'daily-life',
  'work-efficiency',
  'creative',
  'build',
  'team',
  'explore',
] as const;

export type LearningGoal = (typeof learningGoalValues)[number];

export const startModeValues = [
  'level-zero',
  'quick-win',
  'build-now',
  'focus-area',
  'recommend',
] as const;

export type StartMode = (typeof startModeValues)[number];

export const interestKeyValues = [
  'writing',
  'research',
  'spreadsheets',
  'slides',
  'images',
  'web',
  'automation',
] as const;

export type InterestKey = (typeof interestKeyValues)[number];

export function parseLearningGoal(value: unknown): LearningGoal | null {
  return typeof value === 'string' &&
    (learningGoalValues as readonly string[]).includes(value)
    ? (value as LearningGoal)
    : null;
}

export function parseStartMode(value: unknown): StartMode | null {
  return typeof value === 'string' &&
    (startModeValues as readonly string[]).includes(value)
    ? (value as StartMode)
    : null;
}

export function parseInterestKeys(value: unknown): InterestKey[] | null {
  if (!Array.isArray(value)) return null;
  const normalized = Array.from(
    new Set(
      value.filter(
        (entry): entry is InterestKey =>
          typeof entry === 'string' &&
          (interestKeyValues as readonly string[]).includes(entry),
      ),
    ),
  );
  if (normalized.length !== value.length || normalized.length > 7) return null;
  return normalized;
}
