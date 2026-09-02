import { env } from 'cloudflare:workers';

export type MemberLessonProgress = {
  taskId: string;
  bookmarked: boolean;
  completed: boolean;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
};

type RawMemberLessonProgress = {
  task_id: string;
  bookmarked: number;
  completed: number;
  completed_at: number | null;
  created_at: number;
  updated_at: number;
};

const lessonWriteWindowMs = 60_000;
const maxLessonWritesPerWindow = 30;

function getD1(): D1Database {
  if (!env.DB) throw new Error('D1 binding `DB` is unavailable.');
  return env.DB;
}

function toMemberLessonProgress(
  row: RawMemberLessonProgress,
): MemberLessonProgress {
  return {
    taskId: row.task_id,
    bookmarked: row.bookmarked === 1,
    completed: row.completed === 1,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function consumeMemberLessonWriteAllowance(
  memberId: string,
): Promise<boolean> {
  const now = Date.now();
  const allowed = await getD1()
    .prepare(
      `
        INSERT INTO member_lesson_rate_limits (
          member_id,
          window_started_at,
          request_count,
          updated_at
        ) VALUES (?, ?, 1, ?)
        ON CONFLICT(member_id) DO UPDATE SET
          window_started_at = CASE
            WHEN excluded.window_started_at - member_lesson_rate_limits.window_started_at >= ?
              THEN excluded.window_started_at
            ELSE member_lesson_rate_limits.window_started_at
          END,
          request_count = CASE
            WHEN excluded.window_started_at - member_lesson_rate_limits.window_started_at >= ?
              THEN 1
            ELSE member_lesson_rate_limits.request_count + 1
          END,
          updated_at = excluded.updated_at
        WHERE
          excluded.window_started_at - member_lesson_rate_limits.window_started_at >= ?
          OR member_lesson_rate_limits.request_count < ?
        RETURNING request_count
      `,
    )
    .bind(
      memberId,
      now,
      now,
      lessonWriteWindowMs,
      lessonWriteWindowMs,
      lessonWriteWindowMs,
      maxLessonWritesPerWindow,
    )
    .first<{ request_count: number }>();

  return Boolean(allowed);
}

export async function listMemberLessonProgress(
  memberId: string,
): Promise<MemberLessonProgress[]> {
  const result = await getD1()
    .prepare(
      `
        SELECT
          task_id,
          bookmarked,
          completed,
          completed_at,
          created_at,
          updated_at
        FROM member_lesson_progress
        WHERE member_id = ?
        ORDER BY updated_at DESC
      `,
    )
    .bind(memberId)
    .all<RawMemberLessonProgress>();

  return result.results.map(toMemberLessonProgress);
}

export async function updateMemberLessonProgress({
  memberId,
  taskId,
  bookmarked,
  completed,
}: {
  memberId: string;
  taskId: string;
  bookmarked: boolean;
  completed: boolean;
}): Promise<MemberLessonProgress | null> {
  const db = getD1();
  const existing = await db
    .prepare(
      `
        SELECT
          task_id,
          bookmarked,
          completed,
          completed_at,
          created_at,
          updated_at
        FROM member_lesson_progress
        WHERE member_id = ? AND task_id = ?
      `,
    )
    .bind(memberId, taskId)
    .first<RawMemberLessonProgress>();

  if (
    existing &&
    (existing.bookmarked === 1) === bookmarked &&
    (existing.completed === 1) === completed
  ) {
    return toMemberLessonProgress(existing);
  }
  if (!bookmarked && !completed) {
    if (!existing) return null;
    await db
      .prepare(
        `
          DELETE FROM member_lesson_progress
          WHERE member_id = ? AND task_id = ?
        `,
      )
      .bind(memberId, taskId)
      .run();
    return null;
  }

  const now = Date.now();
  const saved = await db
    .prepare(
      `
        INSERT INTO member_lesson_progress (
          member_id,
          task_id,
          bookmarked,
          completed,
          completed_at,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(member_id, task_id) DO UPDATE SET
          bookmarked = excluded.bookmarked,
          completed = excluded.completed,
          completed_at = CASE
            WHEN excluded.completed = 0 THEN NULL
            WHEN member_lesson_progress.completed = 1
              THEN member_lesson_progress.completed_at
            ELSE excluded.completed_at
          END,
          updated_at = excluded.updated_at
        RETURNING
          task_id,
          bookmarked,
          completed,
          completed_at,
          created_at,
          updated_at
      `,
    )
    .bind(
      memberId,
      taskId,
      bookmarked ? 1 : 0,
      completed ? 1 : 0,
      completed ? now : null,
      now,
      now,
    )
    .first<RawMemberLessonProgress>();

  if (!saved) throw new Error('Lesson progress was not saved.');
  return toMemberLessonProgress(saved);
}
