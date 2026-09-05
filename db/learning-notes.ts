import { env } from 'cloudflare:workers';
import type { LearningNote } from '@/lib/learning-notes';
const fields =
  'id,body,tool,outcome,human_fix AS humanFix,task_id AS taskId,source_ref AS sourceRef,created_at AS createdAt,tested_on AS testedOn,topic';
export async function listLearningNotes(memberId: string, page = 1) {
  const result = await env.DB.prepare(
    `SELECT ${fields} FROM learning_notes WHERE member_id=? AND deleted_at IS NULL ORDER BY created_at DESC,id DESC LIMIT 21 OFFSET ?`,
  )
    .bind(memberId, (page - 1) * 20)
    .all<LearningNote>();
  return {
    notes: result.results.slice(0, 20),
    hasMore: result.results.length > 20,
  };
}
export async function getLearningNote(memberId: string, id: string) {
  return env.DB.prepare(
    `SELECT ${fields} FROM learning_notes WHERE member_id=? AND id=? AND deleted_at IS NULL`,
  )
    .bind(memberId, id)
    .first<LearningNote>();
}
export async function saveLearningNote(
  memberId: string,
  requestId: string,
  note: Omit<LearningNote, 'id' | 'createdAt'>,
) {
  await env.DB.prepare(
    `INSERT INTO learning_notes(id,member_id,request_id,body,tool,outcome,human_fix,task_id,source_ref,created_at) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(member_id,request_id) DO NOTHING`,
  )
    .bind(
      crypto.randomUUID(),
      memberId,
      requestId,
      note.body,
      note.tool,
      note.outcome,
      note.humanFix,
      note.taskId,
      note.sourceRef,
      Date.now(),
    )
    .run();
  return env.DB.prepare(
    'SELECT id FROM learning_notes WHERE member_id=? AND request_id=? AND body=? AND tool=? AND outcome=? AND human_fix=? AND task_id IS ? AND source_ref IS ?',
  )
    .bind(
      memberId,
      requestId,
      note.body,
      note.tool,
      note.outcome,
      note.humanFix,
      note.taskId,
      note.sourceRef,
    )
    .first<{ id: string }>();
}
export async function removeLearningNote(memberId: string, id: string) {
  return (
    (
      await env.DB.prepare(
        "UPDATE learning_notes SET deleted_at=?,body='',human_fix='',tool='' WHERE member_id=? AND id=? AND deleted_at IS NULL",
      )
        .bind(Date.now(), memberId, id)
        .run()
    ).meta.changes > 0
  );
}
export async function editLearningNote(
  memberId: string,
  id: string,
  note: { body: string; tool: string; outcome: string; humanFix: string },
  expected: string[],
) {
  const result = await env.DB.prepare(
    'UPDATE learning_notes SET body=?,tool=?,outcome=?,human_fix=? WHERE member_id=? AND id=? AND deleted_at IS NULL AND body=? AND tool=? AND outcome=? AND human_fix=?',
  )
    .bind(
      note.body,
      note.tool,
      note.outcome,
      note.humanFix,
      memberId,
      id,
      ...expected,
    )
    .run();
  if (result.meta.changes) return true;
  const current = await getLearningNote(memberId, id);
  return (
    !!current &&
    current.body === note.body &&
    current.tool === note.tool &&
    current.outcome === note.outcome &&
    current.humanFix === note.humanFix
  );
}
export async function importLearningNotes(
  memberId: string,
  notes: (Omit<LearningNote, 'id'> & { legacyId: string })[],
) {
  if (!notes.length) return { imported: 0, changed: 0, skipped: 0 };
  const results = await env.DB.batch(
    notes.map((n) =>
      env.DB.prepare(
        `INSERT INTO learning_notes(id,member_id,request_id,legacy_id,body,tool,outcome,human_fix,task_id,source_ref,created_at,tested_on,topic) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(member_id,legacy_id) DO NOTHING`,
      ).bind(
        crypto.randomUUID(),
        memberId,
        'import:' + n.legacyId,
        n.legacyId,
        n.body,
        n.tool,
        n.outcome,
        n.humanFix,
        n.taskId,
        n.sourceRef,
        n.createdAt,
        n.testedOn ?? null,
        n.topic ?? null,
      ),
    ),
  );
  const imported = results.reduce((sum, r) => sum + r.meta.changes, 0);
  const lookup = [];
  for (let i = 0; i < notes.length; i += 40) {
    const group = notes.slice(i, i + 40);
    lookup.push(
      env.DB.prepare(
        `SELECT ${fields},legacy_id AS legacyId,deleted_at AS deletedAt FROM learning_notes WHERE member_id=? AND legacy_id IN (${group.map(() => '?').join(',')})`,
      ).bind(memberId, ...group.map((n) => n.legacyId)),
    );
  }
  const existing = {
    results: (
      await env.DB.batch<
        LearningNote & { legacyId: string; deletedAt: number | null }
      >(lookup)
    ).flatMap((r) => r.results),
  };
  const changed = notes.filter((n) => {
    const row = existing.results.find((r) => r.legacyId === n.legacyId);
    return (
      row &&
      !row.deletedAt &&
      (
        [
          'body',
          'tool',
          'outcome',
          'humanFix',
          'sourceRef',
          'createdAt',
          'testedOn',
          'topic',
        ] as const
      ).some((k) => row[k] !== n[k])
    );
  }).length;
  return { imported, changed, skipped: notes.length - imported - changed };
}
export async function listPostStocks(memberId: string) {
  return (
    await env.DB.prepare(
      'SELECT post_ref AS postRef FROM post_stocks WHERE member_id=? ORDER BY created_at DESC LIMIT 200',
    )
      .bind(memberId)
      .all<{ postRef: string }>()
  ).results;
}
export async function setPostStock(
  memberId: string,
  ref: string,
  saved: boolean,
) {
  if (saved) {
    const result = await env.DB.prepare(
      `INSERT INTO post_stocks(member_id,post_ref,created_at) SELECT ?,?,? WHERE (SELECT count(*) FROM post_stocks WHERE member_id=?)<200 ON CONFLICT(member_id,post_ref) DO NOTHING`,
    )
      .bind(memberId, ref, Date.now(), memberId)
      .run();
    return (
      result.meta.changes > 0 ||
      !!(await env.DB.prepare(
        'SELECT 1 FROM post_stocks WHERE member_id=? AND post_ref=?',
      )
        .bind(memberId, ref)
        .first())
    );
  }
  await env.DB.prepare(
    'DELETE FROM post_stocks WHERE member_id=? AND post_ref=?',
  )
    .bind(memberId, ref)
    .run();
  return true;
}
