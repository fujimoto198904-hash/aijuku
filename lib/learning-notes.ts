export const noteOutcomes = {
  worked: 'できた',
  adjusted: '工夫した',
  learned: '気づいた',
} as const;
export type NoteOutcome = keyof typeof noteOutcomes;
export type LearningNote = {
  id: string;
  body: string;
  tool: string;
  outcome: NoteOutcome;
  humanFix: string;
  taskId: string | null;
  sourceRef: string | null;
  createdAt: number;
  testedOn?: string | null;
  topic?: string | null;
};
export function parseNote(value: Record<string, unknown>) {
  const body = typeof value.body === 'string' ? value.body.trim() : '';
  const tool = typeof value.tool === 'string' ? value.tool.trim() : '';
  const humanFix =
    typeof value.humanFix === 'string' ? value.humanFix.trim() : '';
  if (
    !body ||
    body.length > 2000 ||
    tool.length > 60 ||
    humanFix.length > 1000 ||
    typeof value.outcome !== 'string' ||
    !Object.hasOwn(noteOutcomes, value.outcome)
  )
    return null;
  return {
    body,
    tool,
    humanFix,
    outcome: value.outcome as NoteOutcome,
    taskId:
      typeof value.taskId === 'string' && value.taskId ? value.taskId : null,
    sourceRef:
      typeof value.sourceRef === 'string' && value.sourceRef.length <= 100
        ? value.sourceRef
        : null,
  };
}
// Import only the user's chosen export. Legacy demo ids stay references, not real posts.
export function parseAitockImport(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (
    data.version !== 1 ||
    !Array.isArray(data.records) ||
    data.records.length > 100
  )
    return null;
  const ids = new Set<string>();
  const records = [];
  for (const item of data.records) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    const record = item as Record<string, unknown>;
    const note = parseNote({
      ...record,
      taskId: null,
      sourceRef:
        typeof record.sourcePostId === 'string'
          ? 'aitock:' + record.sourcePostId
          : null,
    });
    const id = record.id;
    const createdAt =
      typeof record.createdAt === 'string' ? Date.parse(record.createdAt) : NaN;
    if (
      !note ||
      typeof id !== 'string' ||
      !/^local-[a-zA-Z0-9-]{1,90}$/.test(id) ||
      ids.has(id) ||
      !Number.isFinite(createdAt) ||
      createdAt < 0 ||
      createdAt > Date.now() + 86400000
    )
      return null;
    const testedOn = record.testedOn,
      topic = record.topic;
    if (
      typeof testedOn !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(testedOn) ||
      !Number.isFinite(Date.parse(testedOn)) ||
      new Date(testedOn).toISOString().slice(0, 10) !== testedOn ||
      typeof topic !== 'string' ||
      !['仕事', '学び', '暮らし'].includes(topic)
    )
      return null;
    ids.add(id);
    records.push({ ...note, legacyId: id, createdAt, testedOn, topic });
  }
  return records;
}
