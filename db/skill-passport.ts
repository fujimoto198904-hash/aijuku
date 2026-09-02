import { env } from "cloudflare:workers";

import type { ChatGPTUser } from "@/app/chatgpt-auth";
import {
  ensureMembershipSchema,
  getMember,
  hasCurrentMembershipConsent,
  membershipTermsVersion,
  privacyPolicyVersion,
} from "@/db/membership";
import {
  type EvidenceSourceType,
  type EvidenceVisibility,
  type ExternalObservationId,
  type ExternalRelationship,
  type InstructorStatus,
  type ModerationStatus,
  parseObservationIds,
} from "@/lib/skill-passport";
import {
  type SkillKey,
  inferTaskSkills,
  parseSkillKeys,
} from "@/lib/skill-taxonomy";
import { findTextbookTask, type TextbookTrack } from "@/lib/textbook-catalog";

export type SkillProfile = {
  memberId: string;
  publicSlug: string;
  headline: string;
  targetRole: string;
  bio: string;
  shareEnabled: boolean;
  createdAt: number;
  updatedAt: number;
};

export type SkillEvidenceRecord = {
  id: string;
  memberId: string;
  sourceType: EvidenceSourceType;
  taskId: string | null;
  taskTitle: string;
  taskOutcome: string;
  track: TextbookTrack | "other";
  courseTitle: string;
  skillKeys: SkillKey[];
  title: string;
  summary: string;
  evidenceUrl: string | null;
  rightsConfirmedAt: number;
  visibility: EvidenceVisibility;
  instructorStatus: InstructorStatus;
  instructorNote: string | null;
  verifiedByName: string | null;
  verifiedAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export type ExternalReviewRecord = {
  id: string;
  evidenceId: string;
  evidenceTitle: string;
  reviewerName: string;
  reviewerAffiliation: string | null;
  relationship: ExternalRelationship;
  rating: number;
  observations: ExternalObservationId[];
  comment: string;
  consentPublic: boolean;
  moderationStatus: ModerationStatus;
  moderationNote: string | null;
  createdAt: number;
};

export type AdminSkillEvidenceRecord = SkillEvidenceRecord & {
  memberDisplayName: string;
  memberEmail: string;
};

export type AdminExternalReviewRecord = ExternalReviewRecord & {
  memberId: string;
  memberDisplayName: string;
  reviewerUserId: string;
  evidenceSummary: string;
  evidenceUrl: string | null;
  instructorNote: string | null;
  verifiedByName: string | null;
  verifiedAt: number | null;
  termsVersion: string | null;
  privacyVersion: string | null;
  policyAcceptedAt: number | null;
};

export type ExternalReviewRequestView = {
  requestId: string;
  memberId: string;
  learnerDisplayName: string;
  evidenceId: string;
  evidenceTitle: string;
  evidenceSummary: string;
  evidenceUrl: string | null;
  taskId: string | null;
  taskTitle: string;
  skillKeys: SkillKey[];
  expiresAt: number;
};

export type MemberExternalReviewRequest = {
  id: string;
  evidenceId: string;
  evidenceTitle: string;
  status: "open" | "submitted" | "revoked";
  expiresAt: number;
  createdAt: number;
  usedAt: number | null;
};

export type PublicSkillPassport = {
  displayName: string;
  profile: SkillProfile;
  evidence: SkillEvidenceRecord[];
  reviews: ExternalReviewRecord[];
};

type RawSkillProfile = Omit<SkillProfile, "shareEnabled"> & {
  shareEnabled: number;
};

type RawSkillEvidence = Omit<SkillEvidenceRecord, "skillKeys"> & {
  skillKeys: string;
};

type RawExternalReview = Omit<
  ExternalReviewRecord,
  "observations" | "consentPublic"
> & {
  observations: string;
  consentPublic: number;
};

let schemaReady: Promise<void> | null = null;

function getD1(): D1Database {
  if (!env.DB) throw new Error("D1 binding `DB` is unavailable.");
  return env.DB;
}

export function ensureSkillPassportSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = initializeSchema().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

async function initializeSchema(): Promise<void> {
  await ensureMembershipSchema();
  const db = getD1();
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS skill_profiles (
        member_id TEXT PRIMARY KEY NOT NULL,
        public_slug TEXT NOT NULL UNIQUE,
        headline TEXT NOT NULL,
        target_role TEXT NOT NULL,
        bio TEXT NOT NULL,
        share_enabled INTEGER NOT NULL CHECK (share_enabled IN (0, 1)),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS skill_evidence (
        id TEXT PRIMARY KEY NOT NULL,
        member_id TEXT NOT NULL,
        client_request_id TEXT,
        source_type TEXT NOT NULL CHECK (
          source_type IN ('curriculum', 'prior-work')
        ),
        task_id TEXT,
        task_title TEXT NOT NULL,
        task_outcome TEXT NOT NULL,
        track TEXT NOT NULL CHECK (
          track IN ('common', 'department', 'industry', 'generation', 'other')
        ),
        course_title TEXT NOT NULL,
        skill_keys TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        evidence_url TEXT,
        rights_confirmed_at INTEGER NOT NULL CHECK (rights_confirmed_at > 0),
        visibility TEXT NOT NULL CHECK (visibility IN ('private', 'shared')),
        instructor_status TEXT NOT NULL CHECK (
          instructor_status IN ('pending', 'verified', 'changes_requested')
        ),
        instructor_note TEXT,
        verified_by TEXT,
        verified_by_name TEXT,
        verified_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
      )
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS skill_evidence_member_created_idx
      ON skill_evidence(member_id, created_at)
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS skill_evidence_status_created_idx
      ON skill_evidence(instructor_status, created_at)
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS external_review_requests (
        id TEXT PRIMARY KEY NOT NULL,
        evidence_id TEXT NOT NULL,
        member_id TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL CHECK (status IN ('open', 'submitted', 'revoked')),
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        used_at INTEGER,
        FOREIGN KEY (evidence_id) REFERENCES skill_evidence(id) ON DELETE CASCADE,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
      )
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS external_review_requests_evidence_status_idx
      ON external_review_requests(evidence_id, status)
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS external_review_requests_member_created_idx
      ON external_review_requests(member_id, created_at)
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS external_reviews (
        id TEXT PRIMARY KEY NOT NULL,
        request_id TEXT NOT NULL UNIQUE,
        evidence_id TEXT NOT NULL,
        reviewer_user_id TEXT NOT NULL,
        reviewer_name TEXT NOT NULL,
        reviewer_affiliation TEXT,
        relationship TEXT NOT NULL CHECK (
          relationship IN ('manager', 'colleague', 'client', 'teacher', 'project-member', 'other')
        ),
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 4),
        observations TEXT NOT NULL,
        comment TEXT NOT NULL,
        consent_public INTEGER NOT NULL CHECK (consent_public IN (0, 1)),
        terms_version TEXT,
        privacy_version TEXT,
        policy_accepted_at INTEGER CHECK (
          policy_accepted_at IS NULL OR policy_accepted_at > 0
        ),
        moderation_status TEXT NOT NULL CHECK (
          moderation_status IN ('pending', 'approved', 'rejected')
        ),
        moderation_note TEXT,
        moderated_by TEXT,
        moderated_at INTEGER,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (request_id) REFERENCES external_review_requests(id) ON DELETE CASCADE,
        FOREIGN KEY (evidence_id) REFERENCES skill_evidence(id) ON DELETE CASCADE,
        UNIQUE (evidence_id, reviewer_user_id)
      )
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS external_reviews_evidence_status_idx
      ON external_reviews(evidence_id, moderation_status)
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS external_reviews_moderation_created_idx
      ON external_reviews(moderation_status, created_at)
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS skill_evidence_review_events (
        id TEXT PRIMARY KEY NOT NULL,
        evidence_id TEXT NOT NULL,
        from_status TEXT NOT NULL CHECK (
          from_status IN ('pending', 'verified', 'changes_requested')
        ),
        to_status TEXT NOT NULL CHECK (
          to_status IN ('verified', 'changes_requested')
        ),
        reviewer_user_id TEXT NOT NULL,
        reviewer_name TEXT NOT NULL,
        note TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (evidence_id) REFERENCES skill_evidence(id) ON DELETE CASCADE
      )
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS skill_evidence_review_events_evidence_created_idx
      ON skill_evidence_review_events(evidence_id, created_at)
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS external_review_moderation_events (
        id TEXT PRIMARY KEY NOT NULL,
        review_id TEXT NOT NULL,
        from_status TEXT NOT NULL CHECK (
          from_status IN ('pending', 'approved', 'rejected')
        ),
        to_status TEXT NOT NULL CHECK (to_status IN ('approved', 'rejected')),
        moderator_user_id TEXT NOT NULL,
        moderator_name TEXT NOT NULL,
        note TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (review_id) REFERENCES external_reviews(id) ON DELETE CASCADE
      )
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS external_review_moderation_events_review_created_idx
      ON external_review_moderation_events(review_id, created_at)
    `),
    db.prepare("PRAGMA optimize"),
  ]);
  await ensureSkillPassportColumns(db);
}

async function ensureSkillPassportColumns(db: D1Database): Promise<void> {
  const columns = await db
    .prepare("PRAGMA table_info(external_reviews)")
    .all<{ name: string }>();
  const existing = new Set(columns.results.map((column) => column.name));
  const migrations = [
    [
      "terms_version",
      "ALTER TABLE external_reviews ADD COLUMN terms_version TEXT",
    ],
    [
      "privacy_version",
      "ALTER TABLE external_reviews ADD COLUMN privacy_version TEXT",
    ],
    [
      "policy_accepted_at",
      "ALTER TABLE external_reviews ADD COLUMN policy_accepted_at INTEGER",
    ],
    [
      "moderation_note",
      "ALTER TABLE external_reviews ADD COLUMN moderation_note TEXT",
    ],
  ] as const;
  const statements = migrations
    .filter(([name]) => !existing.has(name))
    .map(([, sql]) => db.prepare(sql));
  if (statements.length > 0) await db.batch(statements);

  const evidenceColumns = await db
    .prepare("PRAGMA table_info(skill_evidence)")
    .all<{ name: string }>();
  if (
    !evidenceColumns.results.some(
      (column) => column.name === "client_request_id",
    )
  ) {
    await db
      .prepare("ALTER TABLE skill_evidence ADD COLUMN client_request_id TEXT")
      .run();
  }
  await db
    .prepare(
      `
      CREATE UNIQUE INDEX IF NOT EXISTS skill_evidence_member_request_unique
      ON skill_evidence(member_id, client_request_id)
    `,
    )
    .run();
}

function hydrateProfile(profile: RawSkillProfile): SkillProfile {
  return { ...profile, shareEnabled: profile.shareEnabled === 1 };
}

function hydrateEvidence(evidence: RawSkillEvidence): SkillEvidenceRecord {
  return { ...evidence, skillKeys: parseSkillKeys(evidence.skillKeys) };
}

function hydrateExternalReview(
  review: RawExternalReview,
): ExternalReviewRecord {
  return {
    ...review,
    observations: parseObservationIds(review.observations),
    consentPublic: review.consentPublic === 1,
  };
}

export async function ensureSkillProfile(
  memberId: string,
): Promise<SkillProfile> {
  await ensureSkillPassportSchema();
  const db = getD1();
  const now = Date.now();
  await db
    .prepare(
      `
      INSERT INTO skill_profiles (
        member_id,
        public_slug,
        headline,
        target_role,
        bio,
        share_enabled,
        created_at,
        updated_at
      ) VALUES (?, ?, '', '', '', 0, ?, ?)
      ON CONFLICT(member_id) DO NOTHING
    `,
    )
    .bind(memberId, `p_${crypto.randomUUID().replaceAll("-", "")}`, now, now)
    .run();

  const profile = await db
    .prepare(
      `
      SELECT
        member_id AS memberId,
        public_slug AS publicSlug,
        headline,
        target_role AS targetRole,
        bio,
        share_enabled AS shareEnabled,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM skill_profiles
      WHERE member_id = ?
      LIMIT 1
    `,
    )
    .bind(memberId)
    .first<RawSkillProfile>();

  if (!profile) throw new Error("Skill profile could not be initialized.");
  return hydrateProfile(profile);
}

export async function updateSkillProfile(input: {
  memberId: string;
  headline: string;
  targetRole: string;
  bio: string;
  shareEnabled: boolean;
}): Promise<SkillProfile> {
  const current = await ensureSkillProfile(input.memberId);
  const publicSlug =
    input.shareEnabled && !current.shareEnabled
      ? `p_${crypto.randomUUID().replaceAll("-", "")}`
      : current.publicSlug;
  await getD1()
    .prepare(
      `
      UPDATE skill_profiles
      SET
        public_slug = ?,
        headline = ?,
        target_role = ?,
        bio = ?,
        share_enabled = ?,
        updated_at = ?
      WHERE member_id = ?
    `,
    )
    .bind(
      publicSlug,
      input.headline,
      input.targetRole,
      input.bio,
      input.shareEnabled ? 1 : 0,
      Date.now(),
      input.memberId,
    )
    .run();
  return ensureSkillProfile(input.memberId);
}

export async function listMemberSkillEvidence(
  memberId: string,
): Promise<SkillEvidenceRecord[]> {
  await ensureSkillPassportSchema();
  const result = await getD1()
    .prepare(
      `
      SELECT
        id,
        member_id AS memberId,
        source_type AS sourceType,
        task_id AS taskId,
        task_title AS taskTitle,
        task_outcome AS taskOutcome,
        track,
        course_title AS courseTitle,
        skill_keys AS skillKeys,
        title,
        summary,
        evidence_url AS evidenceUrl,
        rights_confirmed_at AS rightsConfirmedAt,
        visibility,
        instructor_status AS instructorStatus,
        instructor_note AS instructorNote,
        verified_by_name AS verifiedByName,
        verified_at AS verifiedAt,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM skill_evidence
      WHERE member_id = ?
      ORDER BY created_at DESC
    `,
    )
    .bind(memberId)
    .all<RawSkillEvidence>();
  return result.results.map(hydrateEvidence);
}

export async function createSkillEvidence(input: {
  memberId: string;
  clientRequestId: string;
  sourceType: EvidenceSourceType;
  taskId: string | null;
  priorWorkSkillKeys: SkillKey[];
  title: string;
  summary: string;
  evidenceUrl: string | null;
  rightsConfirmed: boolean;
  visibility: EvidenceVisibility;
}): Promise<SkillEvidenceRecord> {
  const member = await getMember(input.memberId);
  if (
    !member ||
    member.status !== "active" ||
    !hasCurrentMembershipConsent(member)
  ) {
    throw new Error("Active membership is required.");
  }
  await ensureSkillPassportSchema();

  const existingEvidence = await getD1()
    .prepare(
      `
      SELECT
        id,
        member_id AS memberId,
        source_type AS sourceType,
        task_id AS taskId,
        task_title AS taskTitle,
        task_outcome AS taskOutcome,
        track,
        course_title AS courseTitle,
        skill_keys AS skillKeys,
        title,
        summary,
        evidence_url AS evidenceUrl,
        rights_confirmed_at AS rightsConfirmedAt,
        visibility,
        instructor_status AS instructorStatus,
        instructor_note AS instructorNote,
        verified_by_name AS verifiedByName,
        verified_at AS verifiedAt,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM skill_evidence
      WHERE member_id = ? AND client_request_id = ?
      LIMIT 1
    `,
    )
    .bind(input.memberId, input.clientRequestId)
    .first<RawSkillEvidence>();
  if (existingEvidence) return hydrateEvidence(existingEvidence);

  if (input.sourceType === "prior-work" && input.taskId) {
    throw new Error("Prior work must not reference a textbook task.");
  }
  const task =
    input.sourceType === "curriculum" && input.taskId
      ? findTextbookTask(input.taskId)
      : undefined;
  if (input.sourceType === "curriculum" && !task) {
    throw new Error("Textbook task was not found.");
  }
  if (
    input.sourceType === "prior-work" &&
    (input.priorWorkSkillKeys.length < 1 || input.priorWorkSkillKeys.length > 3)
  ) {
    throw new Error("Prior work must have one to three skill keys.");
  }
  if (!input.rightsConfirmed) {
    throw new Error("Evidence rights must be confirmed.");
  }

  const recentCount = await getD1()
    .prepare(
      `
      SELECT COUNT(*) AS count
      FROM skill_evidence
      WHERE member_id = ? AND created_at >= ?
    `,
    )
    .bind(input.memberId, Date.now() - 24 * 60 * 60 * 1000)
    .first<{ count: number }>();
  if (Number(recentCount?.count ?? 0) >= 100) {
    throw new Error("Skill evidence rate limit exceeded.");
  }

  const skillKeys = task
    ? inferTaskSkills(task)
    : input.priorWorkSkillKeys.slice(0, 3);
  const now = Date.now();
  const evidenceId = crypto.randomUUID();
  await getD1()
    .prepare(
      `
      INSERT OR IGNORE INTO skill_evidence (
        id,
        member_id,
        client_request_id,
        source_type,
        task_id,
        task_title,
        task_outcome,
        track,
        course_title,
        skill_keys,
        title,
        summary,
        evidence_url,
        rights_confirmed_at,
        visibility,
        instructor_status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `,
    )
    .bind(
      evidenceId,
      input.memberId,
      input.clientRequestId,
      input.sourceType,
      task?.id ?? null,
      task?.title ?? "教科書外の実務・自主制作",
      task?.outcome ?? input.title,
      task?.track ?? "other",
      task?.courseTitle ?? "これまでの実務・自主制作",
      JSON.stringify(skillKeys),
      input.title,
      input.summary,
      input.evidenceUrl,
      input.rightsConfirmed ? now : 0,
      input.visibility,
      now,
      now,
    )
    .run();

  const result = await getD1()
    .prepare(
      `
      SELECT
        id,
        member_id AS memberId,
        source_type AS sourceType,
        task_id AS taskId,
        task_title AS taskTitle,
        task_outcome AS taskOutcome,
        track,
        course_title AS courseTitle,
        skill_keys AS skillKeys,
        title,
        summary,
        evidence_url AS evidenceUrl,
        rights_confirmed_at AS rightsConfirmedAt,
        visibility,
        instructor_status AS instructorStatus,
        instructor_note AS instructorNote,
        verified_by_name AS verifiedByName,
        verified_at AS verifiedAt,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM skill_evidence
      WHERE member_id = ? AND client_request_id = ?
      LIMIT 1
    `,
    )
    .bind(input.memberId, input.clientRequestId)
    .first<RawSkillEvidence>();
  if (!result) throw new Error("Skill evidence could not be saved.");
  return hydrateEvidence(result);
}

export async function updateSkillEvidenceVisibility(input: {
  memberId: string;
  evidenceId: string;
  visibility: EvidenceVisibility;
}): Promise<boolean> {
  await ensureSkillPassportSchema();
  const result = await getD1()
    .prepare(
      `
      UPDATE skill_evidence
      SET visibility = ?, updated_at = ?
      WHERE id = ? AND member_id = ?
    `,
    )
    .bind(input.visibility, Date.now(), input.evidenceId, input.memberId)
    .run();
  return Number(result.meta.changes ?? 0) > 0;
}

export async function resubmitSkillEvidence(input: {
  memberId: string;
  evidenceId: string;
  expectedUpdatedAt: number;
  title: string;
  summary: string;
  evidenceUrl: string | null;
  rightsConfirmed: boolean;
}): Promise<"updated" | "not_found" | "conflict"> {
  const member = await getMember(input.memberId);
  if (
    !member ||
    member.status !== "active" ||
    !hasCurrentMembershipConsent(member)
  ) {
    throw new Error("Active membership is required.");
  }
  await ensureSkillPassportSchema();
  const db = getD1();
  const existing = await db
    .prepare(
      `
      SELECT instructor_status AS instructorStatus
      FROM skill_evidence
      WHERE id = ? AND member_id = ?
      LIMIT 1
    `,
    )
    .bind(input.evidenceId, input.memberId)
    .first<{ instructorStatus: InstructorStatus }>();
  if (!existing) return "not_found";
  if (existing.instructorStatus !== "changes_requested") return "conflict";

  const now = Math.max(Date.now(), input.expectedUpdatedAt + 1);
  const [, updateResult] = await db.batch([
    db
      .prepare(
        `
        UPDATE external_review_requests
        SET status = 'revoked'
        WHERE
          evidence_id = ?
          AND status = 'open'
          AND EXISTS (
            SELECT 1 FROM skill_evidence
            WHERE
              id = ?
              AND member_id = ?
              AND instructor_status = 'changes_requested'
              AND updated_at = ?
          )
      `,
      )
      .bind(
        input.evidenceId,
        input.evidenceId,
        input.memberId,
        input.expectedUpdatedAt,
      ),
    db
      .prepare(
        `
        UPDATE skill_evidence
        SET
          title = ?,
          summary = ?,
          evidence_url = ?,
          rights_confirmed_at = ?,
          instructor_status = 'pending',
          verified_by = NULL,
          verified_by_name = NULL,
          verified_at = NULL,
          updated_at = ?
        WHERE
          id = ?
          AND member_id = ?
          AND instructor_status = 'changes_requested'
          AND updated_at = ?
      `,
      )
      .bind(
        input.title,
        input.summary,
        input.evidenceUrl,
        input.rightsConfirmed ? now : 0,
        now,
        input.evidenceId,
        input.memberId,
        input.expectedUpdatedAt,
      ),
  ]);
  return Number(updateResult.meta.changes ?? 0) > 0 ? "updated" : "conflict";
}

export async function listMemberExternalReviews(
  memberId: string,
): Promise<ExternalReviewRecord[]> {
  await ensureSkillPassportSchema();
  const result = await getD1()
    .prepare(
      `
      SELECT
        external_reviews.id,
        external_reviews.evidence_id AS evidenceId,
        skill_evidence.title AS evidenceTitle,
        external_reviews.reviewer_name AS reviewerName,
        external_reviews.reviewer_affiliation AS reviewerAffiliation,
        external_reviews.relationship,
        external_reviews.rating,
        external_reviews.observations,
        external_reviews.comment,
        external_reviews.consent_public AS consentPublic,
        external_reviews.moderation_status AS moderationStatus,
        external_reviews.moderation_note AS moderationNote,
        external_reviews.created_at AS createdAt
      FROM external_reviews
      INNER JOIN skill_evidence ON skill_evidence.id = external_reviews.evidence_id
      WHERE skill_evidence.member_id = ?
      ORDER BY external_reviews.created_at DESC
    `,
    )
    .bind(memberId)
    .all<RawExternalReview>();
  return result.results.map(hydrateExternalReview);
}

async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function createExternalReviewRequest(input: {
  memberId: string;
  evidenceId: string;
}): Promise<{
  id: string;
  token: string;
  expiresAt: number;
  createdAt: number;
  evidenceId: string;
  evidenceTitle: string;
}> {
  await ensureSkillPassportSchema();
  const member = await getMember(input.memberId);
  if (
    !member ||
    member.status !== "active" ||
    !hasCurrentMembershipConsent(member)
  ) {
    throw new Error("Active membership is required.");
  }
  const db = getD1();
  const evidence = await db
    .prepare(
      `
      SELECT id, title
      FROM skill_evidence
      WHERE id = ? AND member_id = ? AND instructor_status = 'verified'
      LIMIT 1
    `,
    )
    .bind(input.evidenceId, input.memberId)
    .first<{ id: string; title: string }>();
  if (!evidence) {
    throw new Error("Only verified evidence can request an external review.");
  }

  const now = Date.now();
  await db
    .prepare(
      `
      UPDATE external_review_requests
      SET status = 'revoked'
      WHERE member_id = ? AND status = 'open' AND expires_at < ?
    `,
    )
    .bind(input.memberId, now)
    .run();

  const openCount = await db
    .prepare(
      `
      SELECT COUNT(*) AS count
      FROM external_review_requests
      WHERE member_id = ? AND status = 'open'
    `,
    )
    .bind(input.memberId)
    .first<{ count: number }>();
  if (Number(openCount?.count ?? 0) >= 10) {
    throw new Error("Too many open external review requests.");
  }
  const recentCount = await db
    .prepare(
      `
      SELECT COUNT(*) AS count
      FROM external_review_requests
      WHERE member_id = ? AND created_at >= ?
    `,
    )
    .bind(input.memberId, now - 24 * 60 * 60 * 1000)
    .first<{ count: number }>();
  if (Number(recentCount?.count ?? 0) >= 20) {
    throw new Error("External review request rate limit exceeded.");
  }

  const token = `${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "")}`;
  const expiresAt = now + 14 * 24 * 60 * 60 * 1000;
  const requestId = crypto.randomUUID();
  await db
    .prepare(
      `
      INSERT INTO external_review_requests (
        id,
        evidence_id,
        member_id,
        token_hash,
        status,
        expires_at,
        created_at
      ) VALUES (?, ?, ?, ?, 'open', ?, ?)
    `,
    )
    .bind(
      requestId,
      input.evidenceId,
      input.memberId,
      await hashToken(token),
      expiresAt,
      now,
    )
    .run();
  return {
    id: requestId,
    token,
    expiresAt,
    createdAt: now,
    evidenceId: evidence.id,
    evidenceTitle: evidence.title,
  };
}

export async function listMemberExternalReviewRequests(
  memberId: string,
): Promise<MemberExternalReviewRequest[]> {
  await ensureSkillPassportSchema();
  const result = await getD1()
    .prepare(
      `
      SELECT
        external_review_requests.id,
        external_review_requests.evidence_id AS evidenceId,
        skill_evidence.title AS evidenceTitle,
        external_review_requests.status,
        external_review_requests.expires_at AS expiresAt,
        external_review_requests.created_at AS createdAt,
        external_review_requests.used_at AS usedAt
      FROM external_review_requests
      INNER JOIN skill_evidence
        ON skill_evidence.id = external_review_requests.evidence_id
      WHERE external_review_requests.member_id = ?
      ORDER BY external_review_requests.created_at DESC
      LIMIT 50
    `,
    )
    .bind(memberId)
    .all<MemberExternalReviewRequest>();
  return result.results;
}

export async function revokeExternalReviewRequest(input: {
  memberId: string;
  requestId: string;
}): Promise<boolean> {
  await ensureSkillPassportSchema();
  const result = await getD1()
    .prepare(
      `
      UPDATE external_review_requests
      SET status = 'revoked'
      WHERE id = ? AND member_id = ? AND status = 'open'
    `,
    )
    .bind(input.requestId, input.memberId)
    .run();
  return Number(result.meta.changes ?? 0) > 0;
}

export async function getExternalReviewRequest(
  token: string,
): Promise<ExternalReviewRequestView | null> {
  await ensureSkillPassportSchema();
  const result = await getD1()
    .prepare(
      `
      SELECT
        external_review_requests.id AS requestId,
        external_review_requests.member_id AS memberId,
        members.display_name AS learnerDisplayName,
        skill_evidence.id AS evidenceId,
        skill_evidence.title AS evidenceTitle,
        skill_evidence.summary AS evidenceSummary,
        skill_evidence.evidence_url AS evidenceUrl,
        skill_evidence.task_id AS taskId,
        skill_evidence.task_title AS taskTitle,
        skill_evidence.skill_keys AS skillKeys,
        external_review_requests.expires_at AS expiresAt
      FROM external_review_requests
      INNER JOIN skill_evidence ON skill_evidence.id = external_review_requests.evidence_id
      INNER JOIN members ON members.id = external_review_requests.member_id
      WHERE
        external_review_requests.token_hash = ?
        AND external_review_requests.status = 'open'
        AND external_review_requests.expires_at >= ?
        AND skill_evidence.instructor_status = 'verified'
        AND members.status = 'active'
        AND members.terms_version = ?
        AND members.privacy_version = ?
      LIMIT 1
    `,
    )
    .bind(
      await hashToken(token),
      Date.now(),
      membershipTermsVersion,
      privacyPolicyVersion,
    )
    .first<
      Omit<ExternalReviewRequestView, "skillKeys"> & { skillKeys: string }
    >();
  return result
    ? { ...result, skillKeys: parseSkillKeys(result.skillKeys) }
    : null;
}

export async function submitExternalReview(input: {
  token: string;
  reviewer: ChatGPTUser;
  reviewerName: string;
  reviewerAffiliation: string | null;
  relationship: ExternalRelationship;
  rating: number;
  observations: ExternalObservationId[];
  comment: string;
  consentPublic: boolean;
  policyAccepted: boolean;
}): Promise<void> {
  const request = await getExternalReviewRequest(input.token);
  if (!request) throw new Error("External review request is unavailable.");
  if (request.memberId === input.reviewer.userId) {
    throw new Error("Self review is not allowed.");
  }
  if (!input.policyAccepted) {
    throw new Error("External reviewer policy acceptance is required.");
  }

  const db = getD1();
  const now = Date.now();
  const reviewId = crypto.randomUUID();
  const [insertResult] = await db.batch([
    db
      .prepare(
        `
        INSERT INTO external_reviews (
          id,
          request_id,
          evidence_id,
          reviewer_user_id,
          reviewer_name,
          reviewer_affiliation,
          relationship,
          rating,
          observations,
          comment,
          consent_public,
          terms_version,
          privacy_version,
          policy_accepted_at,
          moderation_status,
          created_at
        )
        SELECT
          ?,
          external_review_requests.id,
          external_review_requests.evidence_id,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          'pending',
          ?
        FROM external_review_requests
        INNER JOIN skill_evidence
          ON skill_evidence.id = external_review_requests.evidence_id
        INNER JOIN members
          ON members.id = external_review_requests.member_id
        WHERE
          external_review_requests.id = ?
          AND external_review_requests.status = 'open'
          AND external_review_requests.expires_at >= ?
          AND external_review_requests.member_id <> ?
          AND skill_evidence.instructor_status = 'verified'
          AND members.status = 'active'
          AND members.terms_version = ?
          AND members.privacy_version = ?
      `,
      )
      .bind(
        reviewId,
        input.reviewer.userId,
        input.reviewerName,
        input.reviewerAffiliation,
        input.relationship,
        input.rating,
        JSON.stringify(input.observations),
        input.comment,
        input.consentPublic ? 1 : 0,
        membershipTermsVersion,
        privacyPolicyVersion,
        now,
        now,
        request.requestId,
        now,
        input.reviewer.userId,
        membershipTermsVersion,
        privacyPolicyVersion,
      ),
    db
      .prepare(
        `
        UPDATE external_review_requests
        SET status = 'submitted', used_at = ?
        WHERE
          id = ?
          AND status = 'open'
          AND EXISTS (
            SELECT 1 FROM external_reviews
            WHERE id = ? AND request_id = external_review_requests.id
          )
      `,
      )
      .bind(now, request.requestId, reviewId),
  ]);
  if (Number(insertResult.meta.changes ?? 0) < 1) {
    throw new Error("External review request is unavailable.");
  }
}

export async function listAdminSkillEvidence(input?: {
  includeMemberEmail?: boolean;
  includeResolved?: boolean;
}): Promise<AdminSkillEvidenceRecord[]> {
  await ensureSkillPassportSchema();
  const memberEmailExpression = input?.includeMemberEmail
    ? "members.email"
    : "''";
  const statusClause = input?.includeResolved
    ? ""
    : "WHERE skill_evidence.instructor_status = 'pending'";
  const result = await getD1()
    .prepare(
      `
      SELECT
        skill_evidence.id,
        skill_evidence.member_id AS memberId,
        skill_evidence.source_type AS sourceType,
        skill_evidence.task_id AS taskId,
        skill_evidence.task_title AS taskTitle,
        skill_evidence.task_outcome AS taskOutcome,
        skill_evidence.track,
        skill_evidence.course_title AS courseTitle,
        skill_evidence.skill_keys AS skillKeys,
        skill_evidence.title,
        skill_evidence.summary,
        skill_evidence.evidence_url AS evidenceUrl,
        skill_evidence.rights_confirmed_at AS rightsConfirmedAt,
        skill_evidence.visibility,
        skill_evidence.instructor_status AS instructorStatus,
        skill_evidence.instructor_note AS instructorNote,
        skill_evidence.verified_by_name AS verifiedByName,
        skill_evidence.verified_at AS verifiedAt,
        skill_evidence.created_at AS createdAt,
        skill_evidence.updated_at AS updatedAt,
        members.display_name AS memberDisplayName,
        ${memberEmailExpression} AS memberEmail
      FROM skill_evidence
      INNER JOIN members ON members.id = skill_evidence.member_id
      ${statusClause}
      ORDER BY
        CASE skill_evidence.instructor_status
          WHEN 'pending' THEN 0
          WHEN 'changes_requested' THEN 1
          ELSE 2
        END,
        CASE
          WHEN skill_evidence.instructor_status = 'pending'
          THEN skill_evidence.created_at
        END ASC,
        skill_evidence.created_at DESC
      LIMIT 200
    `,
    )
    .all<
      RawSkillEvidence & { memberDisplayName: string; memberEmail: string }
    >();
  return result.results.map((item) => ({
    ...hydrateEvidence(item),
    memberDisplayName: item.memberDisplayName,
    memberEmail: item.memberEmail,
  }));
}

export async function countPendingAdminSkillEvidence(): Promise<number> {
  await ensureSkillPassportSchema();
  const result = await getD1()
    .prepare(
      `
      SELECT COUNT(*) AS count
      FROM skill_evidence
      WHERE instructor_status = 'pending'
    `,
    )
    .first<{ count: number }>();
  return Number(result?.count ?? 0);
}

export async function reviewSkillEvidence(input: {
  evidenceId: string;
  expectedUpdatedAt: number;
  status: Extract<InstructorStatus, "verified" | "changes_requested">;
  note: string;
  reviewer: ChatGPTUser;
}): Promise<"updated" | "not_found" | "conflict"> {
  await ensureSkillPassportSchema();
  const owner = await getD1()
    .prepare(
      `
      SELECT
        member_id AS memberId,
        instructor_status AS instructorStatus
      FROM skill_evidence
      WHERE id = ?
      LIMIT 1
    `,
    )
    .bind(input.evidenceId)
    .first<{ memberId: string; instructorStatus: InstructorStatus }>();
  if (!owner) return "not_found";
  if (owner?.memberId === input.reviewer.userId) {
    throw new Error("Self instructor review is not allowed.");
  }
  if (owner.instructorStatus !== "pending") return "conflict";

  const verified = input.status === "verified";
  const reviewerName =
    input.reviewer.fullName?.trim() || "藤本実学塾 講師・運営";
  const now = Math.max(Date.now(), input.expectedUpdatedAt + 1);
  const invalidationNote =
    "成果物が講師から差し戻されたため、この評価は現行版への掲載対象外になりました。";
  const batchResults = await getD1().batch([
    getD1()
      .prepare(
        `
        INSERT INTO skill_evidence_review_events (
          id,
          evidence_id,
          from_status,
          to_status,
          reviewer_user_id,
          reviewer_name,
          note,
          created_at
        )
        SELECT ?, id, ?, ?, ?, ?, ?, ?
        FROM skill_evidence
        WHERE
          id = ?
          AND member_id <> ?
          AND instructor_status = 'pending'
          AND updated_at = ?
      `,
      )
      .bind(
        crypto.randomUUID(),
        owner.instructorStatus,
        input.status,
        input.reviewer.userId,
        reviewerName,
        input.note,
        now,
        input.evidenceId,
        input.reviewer.userId,
        input.expectedUpdatedAt,
      ),
    getD1()
      .prepare(
        `
        INSERT INTO external_review_moderation_events (
          id,
          review_id,
          from_status,
          to_status,
          moderator_user_id,
          moderator_name,
          note,
          created_at
        )
        SELECT
          lower(hex(randomblob(16))),
          external_reviews.id,
          external_reviews.moderation_status,
          'rejected',
          ?,
          ?,
          ?,
          ?
        FROM external_reviews
        WHERE
          external_reviews.evidence_id = ?
          AND external_reviews.moderation_status <> 'rejected'
          AND ? = 'changes_requested'
          AND EXISTS (
            SELECT 1 FROM skill_evidence
            WHERE
              id = ?
              AND member_id <> ?
              AND instructor_status = 'pending'
              AND updated_at = ?
          )
      `,
      )
      .bind(
        input.reviewer.userId,
        reviewerName,
        invalidationNote,
        now,
        input.evidenceId,
        input.status,
        input.evidenceId,
        input.reviewer.userId,
        input.expectedUpdatedAt,
      ),
    getD1()
      .prepare(
        `
        UPDATE external_reviews
        SET
          moderation_status = 'rejected',
          moderation_note = ?,
          moderated_by = ?,
          moderated_at = ?
        WHERE
          evidence_id = ?
          AND moderation_status <> 'rejected'
          AND ? = 'changes_requested'
          AND EXISTS (
            SELECT 1 FROM skill_evidence
            WHERE
              id = ?
              AND member_id <> ?
              AND instructor_status = 'pending'
              AND updated_at = ?
          )
      `,
      )
      .bind(
        invalidationNote,
        input.reviewer.userId,
        now,
        input.evidenceId,
        input.status,
        input.evidenceId,
        input.reviewer.userId,
        input.expectedUpdatedAt,
      ),
    getD1()
      .prepare(
        `
        UPDATE external_review_requests
        SET status = 'revoked'
        WHERE
          evidence_id = ?
          AND status = 'open'
          AND ? = 'changes_requested'
          AND EXISTS (
            SELECT 1 FROM skill_evidence
            WHERE
              id = ?
              AND member_id <> ?
              AND instructor_status = 'pending'
              AND updated_at = ?
          )
      `,
      )
      .bind(
        input.evidenceId,
        input.status,
        input.evidenceId,
        input.reviewer.userId,
        input.expectedUpdatedAt,
      ),
    getD1()
      .prepare(
        `
        UPDATE skill_evidence
        SET
          instructor_status = ?,
          instructor_note = ?,
          verified_by = ?,
          verified_by_name = ?,
          verified_at = ?,
          updated_at = ?
        WHERE
          id = ?
          AND member_id <> ?
          AND instructor_status = 'pending'
          AND updated_at = ?
      `,
      )
      .bind(
        input.status,
        input.note,
        verified ? input.reviewer.userId : null,
        verified ? reviewerName : null,
        verified ? now : null,
        now,
        input.evidenceId,
        input.reviewer.userId,
        input.expectedUpdatedAt,
      ),
  ]);
  const updateResult = batchResults[batchResults.length - 1]!;
  return Number(updateResult.meta.changes ?? 0) > 0 ? "updated" : "conflict";
}

export async function listAdminExternalReviews(input?: {
  includeResolved?: boolean;
}): Promise<AdminExternalReviewRecord[]> {
  await ensureSkillPassportSchema();
  const statusClause = input?.includeResolved
    ? ""
    : "WHERE external_reviews.moderation_status = 'pending'";
  const result = await getD1()
    .prepare(
      `
      SELECT
        external_reviews.id,
        external_reviews.evidence_id AS evidenceId,
        skill_evidence.title AS evidenceTitle,
        skill_evidence.summary AS evidenceSummary,
        skill_evidence.evidence_url AS evidenceUrl,
        skill_evidence.instructor_note AS instructorNote,
        skill_evidence.verified_by_name AS verifiedByName,
        skill_evidence.verified_at AS verifiedAt,
        skill_evidence.member_id AS memberId,
        members.display_name AS memberDisplayName,
        external_reviews.reviewer_user_id AS reviewerUserId,
        external_reviews.reviewer_name AS reviewerName,
        external_reviews.reviewer_affiliation AS reviewerAffiliation,
        external_reviews.relationship,
        external_reviews.rating,
        external_reviews.observations,
        external_reviews.comment,
        external_reviews.consent_public AS consentPublic,
        external_reviews.moderation_status AS moderationStatus,
        external_reviews.moderation_note AS moderationNote,
        external_reviews.terms_version AS termsVersion,
        external_reviews.privacy_version AS privacyVersion,
        external_reviews.policy_accepted_at AS policyAcceptedAt,
        external_reviews.created_at AS createdAt
      FROM external_reviews
      INNER JOIN skill_evidence ON skill_evidence.id = external_reviews.evidence_id
      INNER JOIN members ON members.id = skill_evidence.member_id
      ${statusClause}
      ORDER BY
        CASE external_reviews.moderation_status
          WHEN 'pending' THEN 0
          WHEN 'approved' THEN 1
          ELSE 2
        END,
        CASE
          WHEN external_reviews.moderation_status = 'pending'
          THEN external_reviews.created_at
        END ASC,
        external_reviews.created_at DESC
      LIMIT 200
    `,
    )
    .all<
      RawExternalReview & {
        memberId: string;
        memberDisplayName: string;
        reviewerUserId: string;
        evidenceSummary: string;
        evidenceUrl: string | null;
        instructorNote: string | null;
        verifiedByName: string | null;
        verifiedAt: number | null;
        termsVersion: string | null;
        privacyVersion: string | null;
        policyAcceptedAt: number | null;
      }
    >();
  return result.results.map((item) => ({
    ...hydrateExternalReview(item),
    memberId: item.memberId,
    memberDisplayName: item.memberDisplayName,
    reviewerUserId: item.reviewerUserId,
    evidenceSummary: item.evidenceSummary,
    evidenceUrl: item.evidenceUrl,
    instructorNote: item.instructorNote,
    verifiedByName: item.verifiedByName,
    verifiedAt: item.verifiedAt,
    termsVersion: item.termsVersion,
    privacyVersion: item.privacyVersion,
    policyAcceptedAt: item.policyAcceptedAt,
  }));
}

export async function countPendingAdminExternalReviews(): Promise<number> {
  await ensureSkillPassportSchema();
  const result = await getD1()
    .prepare(
      `
      SELECT COUNT(*) AS count
      FROM external_reviews
      WHERE moderation_status = 'pending'
    `,
    )
    .first<{ count: number }>();
  return Number(result?.count ?? 0);
}

export async function moderateExternalReview(input: {
  reviewId: string;
  expectedStatus: ModerationStatus;
  status: Extract<ModerationStatus, "approved" | "rejected">;
  note: string;
  reviewer: ChatGPTUser;
}): Promise<"updated" | "not_found" | "conflict"> {
  await ensureSkillPassportSchema();
  const review = await getD1()
    .prepare(
      `
      SELECT
        external_reviews.reviewer_user_id AS reviewerUserId,
        external_reviews.moderation_status AS moderationStatus,
        skill_evidence.member_id AS memberId
      FROM external_reviews
      INNER JOIN skill_evidence
        ON skill_evidence.id = external_reviews.evidence_id
      WHERE external_reviews.id = ?
      LIMIT 1
    `,
    )
    .bind(input.reviewId)
    .first<{
      reviewerUserId: string;
      memberId: string;
      moderationStatus: ModerationStatus;
    }>();
  if (!review) return "not_found";
  if (
    review &&
    (review.reviewerUserId === input.reviewer.userId ||
      review.memberId === input.reviewer.userId)
  ) {
    throw new Error("Self external review moderation is not allowed.");
  }

  if (
    input.expectedStatus !== "pending" ||
    review.moderationStatus !== input.expectedStatus
  ) {
    return "conflict";
  }
  const now = Date.now();
  const moderatorName =
    input.reviewer.fullName?.trim() || "藤本実学塾 掲載審査";
  const [, updateResult] = await getD1().batch([
    getD1()
      .prepare(
        `
        INSERT INTO external_review_moderation_events (
          id,
          review_id,
          from_status,
          to_status,
          moderator_user_id,
          moderator_name,
          note,
          created_at
        )
        SELECT ?, id, ?, ?, ?, ?, ?, ?
        FROM external_reviews
        WHERE
          id = ?
          AND moderation_status = 'pending'
          AND reviewer_user_id <> ?
          AND evidence_id NOT IN (
            SELECT id FROM skill_evidence WHERE member_id = ?
          )
      `,
      )
      .bind(
        crypto.randomUUID(),
        review.moderationStatus,
        input.status,
        input.reviewer.userId,
        moderatorName,
        input.note,
        now,
        input.reviewId,
        input.reviewer.userId,
        input.reviewer.userId,
      ),
    getD1()
      .prepare(
        `
        UPDATE external_reviews
        SET
          moderation_status = ?,
          moderation_note = ?,
          moderated_by = ?,
          moderated_at = ?
        WHERE
          id = ?
          AND moderation_status = 'pending'
          AND reviewer_user_id <> ?
          AND evidence_id NOT IN (
            SELECT id FROM skill_evidence WHERE member_id = ?
          )
      `,
      )
      .bind(
        input.status,
        input.note,
        input.reviewer.userId,
        now,
        input.reviewId,
        input.reviewer.userId,
        input.reviewer.userId,
      ),
  ]);
  return Number(updateResult.meta.changes ?? 0) > 0 ? "updated" : "conflict";
}

export async function getPublicSkillPassport(
  publicSlug: string,
): Promise<PublicSkillPassport | null> {
  await ensureSkillPassportSchema();
  const db = getD1();
  const profile = await db
    .prepare(
      `
      SELECT
        skill_profiles.member_id AS memberId,
        skill_profiles.public_slug AS publicSlug,
        skill_profiles.headline,
        skill_profiles.target_role AS targetRole,
        skill_profiles.bio,
        skill_profiles.share_enabled AS shareEnabled,
        skill_profiles.created_at AS createdAt,
        skill_profiles.updated_at AS updatedAt,
        members.display_name AS displayName
      FROM skill_profiles
      INNER JOIN members ON members.id = skill_profiles.member_id
      WHERE skill_profiles.public_slug = ? AND skill_profiles.share_enabled = 1
        AND members.status = 'active'
        AND members.terms_version = ?
        AND members.privacy_version = ?
      LIMIT 1
    `,
    )
    .bind(publicSlug, membershipTermsVersion, privacyPolicyVersion)
    .first<RawSkillProfile & { displayName: string }>();
  if (!profile) return null;

  const evidenceResult = await db
    .prepare(
      `
      SELECT
        id,
        member_id AS memberId,
        source_type AS sourceType,
        task_id AS taskId,
        task_title AS taskTitle,
        task_outcome AS taskOutcome,
        track,
        course_title AS courseTitle,
        skill_keys AS skillKeys,
        title,
        summary,
        evidence_url AS evidenceUrl,
        rights_confirmed_at AS rightsConfirmedAt,
        visibility,
        instructor_status AS instructorStatus,
        instructor_note AS instructorNote,
        verified_by_name AS verifiedByName,
        verified_at AS verifiedAt,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM skill_evidence
      WHERE
        member_id = ?
        AND visibility = 'shared'
        AND instructor_status = 'verified'
      ORDER BY verified_at DESC, created_at DESC
    `,
    )
    .bind(profile.memberId)
    .all<RawSkillEvidence>();

  const reviewResult = await db
    .prepare(
      `
      SELECT
        external_reviews.id,
        external_reviews.evidence_id AS evidenceId,
        skill_evidence.title AS evidenceTitle,
        external_reviews.reviewer_name AS reviewerName,
        external_reviews.reviewer_affiliation AS reviewerAffiliation,
        external_reviews.relationship,
        external_reviews.rating,
        external_reviews.observations,
        external_reviews.comment,
        external_reviews.consent_public AS consentPublic,
        external_reviews.moderation_status AS moderationStatus,
        external_reviews.moderation_note AS moderationNote,
        external_reviews.created_at AS createdAt
      FROM external_reviews
      INNER JOIN skill_evidence ON skill_evidence.id = external_reviews.evidence_id
      WHERE
        skill_evidence.member_id = ?
        AND skill_evidence.visibility = 'shared'
        AND skill_evidence.instructor_status = 'verified'
        AND external_reviews.moderation_status = 'approved'
        AND external_reviews.consent_public = 1
        AND external_reviews.terms_version = ?
        AND external_reviews.privacy_version = ?
        AND external_reviews.policy_accepted_at > 0
      ORDER BY external_reviews.created_at DESC
    `,
    )
    .bind(profile.memberId, membershipTermsVersion, privacyPolicyVersion)
    .all<RawExternalReview>();

  const { displayName, ...profileData } = profile;
  return {
    displayName,
    profile: hydrateProfile(profileData),
    evidence: evidenceResult.results.map(hydrateEvidence),
    reviews: reviewResult.results.map(hydrateExternalReview),
  };
}
