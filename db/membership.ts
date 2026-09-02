import { env } from "cloudflare:workers";

import type { ChatGPTUser } from "@/app/chatgpt-auth";

export const serviceTypeValues = [
  "in-person-tutor",
  "online-tutor",
  "self-study",
] as const;

export type ServiceType = (typeof serviceTypeValues)[number];

export const applicationStatusValues = [
  "received",
  "reviewing",
  "confirmed",
  "cancelled",
] as const;

export type ApplicationStatus = (typeof applicationStatusValues)[number];

const adminApplicationTransitions: Record<
  ApplicationStatus,
  readonly ApplicationStatus[]
> = {
  received: ["reviewing", "cancelled"],
  reviewing: ["confirmed", "cancelled"],
  confirmed: [],
  cancelled: [],
};

export function canAdminTransitionApplication(
  from: ApplicationStatus,
  to: ApplicationStatus,
) {
  return from === to || adminApplicationTransitions[from].includes(to);
}

export type ApplicationOfferSnapshot = {
  serviceName: string;
  price: string;
  area: string;
  enrollmentFee: string;
  pricingNote: string;
};

export type MemberApplication = {
  id: string;
  serviceType: ServiceType;
  status: ApplicationStatus;
  goal: string;
  preferredSchedule: string;
  participants: number;
  notes: string | null;
  offerSnapshot: ApplicationOfferSnapshot | null;
  memberMessage: string | null;
  assignedInstructor: string | null;
  scheduledAt: number | null;
  deliveryDetails: string | null;
  createdAt: number;
  updatedAt: number;
};

export type AdminApplication = MemberApplication & {
  memberId: string;
  memberEmail: string;
  memberDisplayName: string;
  internalNote: string | null;
};

export type AdminApplicationStatusEvent = {
  id: string;
  memberEmail: string;
  memberDisplayName: string;
  serviceType: ServiceType;
  fromStatus: ApplicationStatus;
  toStatus: ApplicationStatus;
  actorType: "member" | "owner";
  actorName: string;
  hasMemberMessage: number;
  createdAt: number;
};

export type MemberProfile = {
  id: string;
  email: string;
  displayName: string;
  status: "active" | "suspended" | "withdrawn";
  termsVersion: string;
  privacyVersion: string;
  createdAt: number;
};

type RawMemberApplication = Omit<MemberApplication, "offerSnapshot"> & {
  offerSnapshot: string;
};

type RawAdminApplication = Omit<AdminApplication, "offerSnapshot"> & {
  offerSnapshot: string;
};

export const membershipTermsVersion = "2026-09-02-portal-v3";
export const privacyPolicyVersion = "2026-09-02-portal-v2";

export function hasCurrentMembershipConsent(
  member: Pick<MemberProfile, "termsVersion" | "privacyVersion">,
): boolean {
  return (
    member.termsVersion === membershipTermsVersion &&
    member.privacyVersion === privacyPolicyVersion
  );
}

let schemaReady: Promise<void> | null = null;

function getD1(): D1Database {
  if (!env.DB) {
    throw new Error("D1 binding `DB` is unavailable.");
  }
  return env.DB;
}

export function ensureMembershipSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = initializeSchema().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

async function initializeSchema(): Promise<void> {
  const db = getD1();
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY NOT NULL,
        email TEXT NOT NULL,
        display_name TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('active', 'suspended', 'withdrawn')),
        terms_version TEXT NOT NULL,
        terms_accepted_at INTEGER NOT NULL,
        privacy_version TEXT NOT NULL,
        privacy_accepted_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS applications (
        id TEXT PRIMARY KEY NOT NULL,
        member_id TEXT NOT NULL,
        client_request_id TEXT NOT NULL,
        service_type TEXT NOT NULL CHECK (
          service_type IN ('in-person-tutor', 'online-tutor', 'self-study')
        ),
        status TEXT NOT NULL CHECK (
          status IN ('received', 'reviewing', 'confirmed', 'cancelled')
        ),
        goal TEXT NOT NULL,
        preferred_schedule TEXT NOT NULL,
        participants INTEGER NOT NULL CHECK (participants BETWEEN 1 AND 5),
        notes TEXT,
        offer_snapshot TEXT NOT NULL DEFAULT '{}',
        terms_version TEXT NOT NULL DEFAULT 'legacy',
        privacy_version TEXT NOT NULL DEFAULT 'legacy',
        member_message TEXT,
        assigned_instructor TEXT,
        scheduled_at INTEGER,
        delivery_details TEXT,
        internal_note TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
        UNIQUE (member_id, client_request_id)
      )
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS applications_member_created_idx
      ON applications(member_id, created_at)
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS applications_status_created_idx
      ON applications(status, created_at)
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS application_status_events (
        id TEXT PRIMARY KEY NOT NULL,
        application_id TEXT NOT NULL,
        from_status TEXT NOT NULL CHECK (
          from_status IN ('received', 'reviewing', 'confirmed', 'cancelled')
        ),
        to_status TEXT NOT NULL CHECK (
          to_status IN ('received', 'reviewing', 'confirmed', 'cancelled')
        ),
        actor_type TEXT NOT NULL CHECK (actor_type IN ('member', 'owner')),
        actor_id TEXT NOT NULL,
        actor_name TEXT NOT NULL,
        member_message TEXT,
        operation_snapshot TEXT NOT NULL DEFAULT '{}',
        created_at INTEGER NOT NULL,
        FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
      )
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS application_status_events_application_created_idx
      ON application_status_events(application_id, created_at)
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS application_status_events_created_idx
      ON application_status_events(created_at)
    `),
  ]);
  await ensureApplicationColumns(db);
  await ensureApplicationEventColumns(db);
}

async function ensureApplicationColumns(db: D1Database): Promise<void> {
  const columns = await db
    .prepare("PRAGMA table_info(applications)")
    .all<{ name: string }>();
  const existing = new Set(columns.results.map((column) => column.name));
  const migrations = [
    [
      "offer_snapshot",
      "ALTER TABLE applications ADD COLUMN offer_snapshot TEXT NOT NULL DEFAULT '{}'",
    ],
    [
      "terms_version",
      "ALTER TABLE applications ADD COLUMN terms_version TEXT NOT NULL DEFAULT 'legacy'",
    ],
    [
      "privacy_version",
      "ALTER TABLE applications ADD COLUMN privacy_version TEXT NOT NULL DEFAULT 'legacy'",
    ],
    [
      "member_message",
      "ALTER TABLE applications ADD COLUMN member_message TEXT",
    ],
    [
      "assigned_instructor",
      "ALTER TABLE applications ADD COLUMN assigned_instructor TEXT",
    ],
    [
      "scheduled_at",
      "ALTER TABLE applications ADD COLUMN scheduled_at INTEGER",
    ],
    [
      "delivery_details",
      "ALTER TABLE applications ADD COLUMN delivery_details TEXT",
    ],
    ["internal_note", "ALTER TABLE applications ADD COLUMN internal_note TEXT"],
  ] as const;
  const statements = migrations
    .filter(([name]) => !existing.has(name))
    .map(([, sql]) => db.prepare(sql));
  if (statements.length > 0) await db.batch(statements);
}

async function ensureApplicationEventColumns(db: D1Database): Promise<void> {
  const columns = await db
    .prepare("PRAGMA table_info(application_status_events)")
    .all<{ name: string }>();
  if (!columns.results.some((column) => column.name === "operation_snapshot")) {
    await db
      .prepare(
        "ALTER TABLE application_status_events ADD COLUMN operation_snapshot TEXT NOT NULL DEFAULT '{}'",
      )
      .run();
  }
}

function parseOfferSnapshot(value: string): ApplicationOfferSnapshot | null {
  try {
    const parsed = JSON.parse(value) as Partial<ApplicationOfferSnapshot>;
    if (
      typeof parsed.serviceName !== "string" ||
      typeof parsed.price !== "string" ||
      typeof parsed.area !== "string" ||
      typeof parsed.enrollmentFee !== "string" ||
      typeof parsed.pricingNote !== "string"
    ) {
      return null;
    }
    return parsed as ApplicationOfferSnapshot;
  } catch {
    return null;
  }
}

function hydrateApplication(
  application: RawMemberApplication,
): MemberApplication {
  const confirmed = application.status === "confirmed";
  return {
    ...application,
    offerSnapshot: parseOfferSnapshot(application.offerSnapshot),
    assignedInstructor: confirmed ? application.assignedInstructor : null,
    scheduledAt: confirmed ? application.scheduledAt : null,
    deliveryDetails: confirmed ? application.deliveryDetails : null,
  };
}

export async function getMember(
  memberId: string,
): Promise<MemberProfile | null> {
  await ensureMembershipSchema();
  return getD1()
    .prepare(
      `
      SELECT
        id,
        email,
        display_name AS displayName,
        status,
        terms_version AS termsVersion,
        privacy_version AS privacyVersion,
        created_at AS createdAt
      FROM members
      WHERE id = ?
      LIMIT 1
    `,
    )
    .bind(memberId)
    .first<MemberProfile>();
}

export async function registerMember(input: {
  user: ChatGPTUser;
  displayName: string;
}): Promise<MemberProfile> {
  await ensureMembershipSchema();
  const currentMember = await getMember(input.user.userId);
  if (currentMember?.status === "suspended") {
    throw new Error("Suspended membership cannot be reactivated.");
  }
  if (currentMember?.status === "withdrawn") {
    throw new Error("Withdrawn membership requires explicit reactivation.");
  }
  const now = Date.now();
  await getD1()
    .prepare(
      `
      INSERT INTO members (
        id,
        email,
        display_name,
        status,
        terms_version,
        terms_accepted_at,
        privacy_version,
        privacy_accepted_at,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        email = excluded.email,
        display_name = excluded.display_name,
        status = 'active',
        terms_version = excluded.terms_version,
        terms_accepted_at = excluded.terms_accepted_at,
        privacy_version = excluded.privacy_version,
        privacy_accepted_at = excluded.privacy_accepted_at,
        updated_at = excluded.updated_at
    `,
    )
    .bind(
      input.user.userId,
      input.user.email,
      input.displayName,
      membershipTermsVersion,
      now,
      privacyPolicyVersion,
      now,
      now,
      now,
    )
    .run();

  const member = await getMember(input.user.userId);
  if (!member) throw new Error("Member could not be saved.");
  return member;
}

export async function refreshMemberEmail(user: ChatGPTUser): Promise<void> {
  await ensureMembershipSchema();
  await getD1()
    .prepare(
      `
      UPDATE members
      SET email = ?, updated_at = ?
      WHERE id = ?
    `,
    )
    .bind(user.email, Date.now(), user.userId)
    .run();
}

export async function updateMemberDisplayName(input: {
  memberId: string;
  displayName: string;
}): Promise<boolean> {
  await ensureMembershipSchema();
  const result = await getD1()
    .prepare(
      `
      UPDATE members
      SET display_name = ?, updated_at = ?
      WHERE id = ? AND status = 'active'
    `,
    )
    .bind(input.displayName, Date.now(), input.memberId)
    .run();
  return Number(result.meta.changes ?? 0) > 0;
}

export async function listMemberApplications(
  memberId: string,
): Promise<MemberApplication[]> {
  await ensureMembershipSchema();
  const result = await getD1()
    .prepare(
      `
      SELECT
        id,
        service_type AS serviceType,
        status,
        goal,
        preferred_schedule AS preferredSchedule,
        participants,
        notes,
        offer_snapshot AS offerSnapshot,
        member_message AS memberMessage,
        CASE
          WHEN status = 'confirmed' THEN assigned_instructor
          ELSE NULL
        END AS assignedInstructor,
        CASE
          WHEN status = 'confirmed' THEN scheduled_at
          ELSE NULL
        END AS scheduledAt,
        CASE
          WHEN status = 'confirmed' THEN delivery_details
          ELSE NULL
        END AS deliveryDetails,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM applications
      WHERE member_id = ?
      ORDER BY created_at DESC
    `,
    )
    .bind(memberId)
    .all<RawMemberApplication>();

  return result.results.map(hydrateApplication);
}

export async function createMemberApplication(input: {
  user: ChatGPTUser;
  clientRequestId: string;
  serviceType: ServiceType;
  goal: string;
  preferredSchedule: string;
  participants: number;
  notes: string | null;
  offerSnapshot: ApplicationOfferSnapshot;
}): Promise<MemberApplication> {
  const member = await getMember(input.user.userId);
  if (
    !member ||
    member.status !== "active" ||
    !hasCurrentMembershipConsent(member)
  ) {
    throw new Error("Active membership is required.");
  }
  await refreshMemberEmail(input.user);
  const db = getD1();
  const now = Date.now();
  const applicationId = crypto.randomUUID();

  const existingApplication = await db
    .prepare(
      `
      SELECT
        id,
        service_type AS serviceType,
        status,
        goal,
        preferred_schedule AS preferredSchedule,
        participants,
        notes,
        offer_snapshot AS offerSnapshot,
        member_message AS memberMessage,
        assigned_instructor AS assignedInstructor,
        scheduled_at AS scheduledAt,
        delivery_details AS deliveryDetails,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM applications
      WHERE member_id = ? AND client_request_id = ?
      LIMIT 1
    `,
    )
    .bind(input.user.userId, input.clientRequestId)
    .first<RawMemberApplication>();
  if (existingApplication) return hydrateApplication(existingApplication);

  const activeCount = await db
    .prepare(
      `
      SELECT COUNT(*) AS count
      FROM applications
      WHERE member_id = ? AND status IN ('received', 'reviewing')
    `,
    )
    .bind(input.user.userId)
    .first<{ count: number }>();
  if (Number(activeCount?.count ?? 0) >= 3) {
    throw new Error("Too many active applications.");
  }
  const recentCount = await db
    .prepare(
      `
      SELECT COUNT(*) AS count
      FROM applications
      WHERE member_id = ? AND created_at >= ?
    `,
    )
    .bind(input.user.userId, now - 24 * 60 * 60 * 1000)
    .first<{ count: number }>();
  if (Number(recentCount?.count ?? 0) >= 10) {
    throw new Error("Application rate limit exceeded.");
  }

  await db.batch([
    db
      .prepare(
        `
        INSERT INTO applications (
        id,
        member_id,
        client_request_id,
        service_type,
        status,
        goal,
        preferred_schedule,
        participants,
        notes,
        offer_snapshot,
        terms_version,
        privacy_version,
        created_at,
        updated_at
        )
        SELECT ?, ?, ?, ?, 'received', ?, ?, ?, ?, ?, ?, ?, ?, ?
        WHERE
          (
            SELECT COUNT(*)
            FROM applications
            WHERE member_id = ? AND status IN ('received', 'reviewing')
          ) < 3
          AND (
            SELECT COUNT(*)
            FROM applications
            WHERE member_id = ? AND created_at >= ?
          ) < 10
        ON CONFLICT(member_id, client_request_id) DO NOTHING
      `,
      )
      .bind(
        applicationId,
        input.user.userId,
        input.clientRequestId,
        input.serviceType,
        input.goal,
        input.preferredSchedule,
        input.participants,
        input.notes,
        JSON.stringify(input.offerSnapshot),
        membershipTermsVersion,
        privacyPolicyVersion,
        now,
        now,
        input.user.userId,
        input.user.userId,
        now - 24 * 60 * 60 * 1000,
      ),
    db
      .prepare(
        `
        INSERT INTO application_status_events (
          id,
          application_id,
          from_status,
          to_status,
          actor_type,
          actor_id,
          actor_name,
          member_message,
          operation_snapshot,
          created_at
        )
        SELECT ?, id, 'received', 'received', 'member', ?, ?, NULL, ?, ?
        FROM applications
        WHERE id = ? AND created_at = ?
      `,
      )
      .bind(
        crypto.randomUUID(),
        input.user.userId,
        input.user.fullName ?? input.user.email,
        JSON.stringify({
          serviceType: input.serviceType,
          participants: input.participants,
          preferredSchedule: input.preferredSchedule,
        }),
        now,
        applicationId,
        now,
      ),
  ]);

  const result = await db
    .prepare(
      `
      SELECT
        id,
        service_type AS serviceType,
        status,
        goal,
        preferred_schedule AS preferredSchedule,
        participants,
        notes,
        offer_snapshot AS offerSnapshot,
        member_message AS memberMessage,
        assigned_instructor AS assignedInstructor,
        scheduled_at AS scheduledAt,
        delivery_details AS deliveryDetails,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM applications
      WHERE member_id = ? AND client_request_id = ?
      LIMIT 1
    `,
    )
    .bind(input.user.userId, input.clientRequestId)
    .first<RawMemberApplication>();

  if (!result) {
    const [activeCountAfterInsert, recentCountAfterInsert] = await Promise.all([
      db
        .prepare(
          `
          SELECT COUNT(*) AS count
          FROM applications
          WHERE member_id = ? AND status IN ('received', 'reviewing')
        `,
        )
        .bind(input.user.userId)
        .first<{ count: number }>(),
      db
        .prepare(
          `
          SELECT COUNT(*) AS count
          FROM applications
          WHERE member_id = ? AND created_at >= ?
        `,
        )
        .bind(input.user.userId, now - 24 * 60 * 60 * 1000)
        .first<{ count: number }>(),
    ]);
    if (Number(activeCountAfterInsert?.count ?? 0) >= 3) {
      throw new Error("Too many active applications.");
    }
    if (Number(recentCountAfterInsert?.count ?? 0) >= 10) {
      throw new Error("Application rate limit exceeded.");
    }
    throw new Error("Application could not be saved.");
  }
  return hydrateApplication(result);
}

export async function countAdminApplications(
  status?: ApplicationStatus,
): Promise<number> {
  await ensureMembershipSchema();
  const result = status
    ? await getD1()
        .prepare("SELECT COUNT(*) AS count FROM applications WHERE status = ?")
        .bind(status)
        .first<{ count: number }>()
    : await getD1()
        .prepare("SELECT COUNT(*) AS count FROM applications")
        .first<{ count: number }>();
  return Number(result?.count ?? 0);
}

export async function listAdminApplications(input?: {
  status?: ApplicationStatus;
  limit?: number;
  offset?: number;
}): Promise<AdminApplication[]> {
  await ensureMembershipSchema();
  const limit = Math.min(100, Math.max(1, input?.limit ?? 50));
  const offset = Math.max(0, input?.offset ?? 0);
  const statusClause = input?.status ? "WHERE applications.status = ?" : "";
  const statement = getD1().prepare(`
      SELECT
        applications.id,
        members.email AS memberEmail,
        members.display_name AS memberDisplayName,
        applications.service_type AS serviceType,
        applications.status,
        applications.goal,
        applications.preferred_schedule AS preferredSchedule,
        applications.participants,
        applications.notes,
        applications.offer_snapshot AS offerSnapshot,
        applications.member_message AS memberMessage,
        applications.assigned_instructor AS assignedInstructor,
        applications.scheduled_at AS scheduledAt,
        applications.delivery_details AS deliveryDetails,
        applications.internal_note AS internalNote,
        applications.created_at AS createdAt,
        applications.updated_at AS updatedAt
      FROM applications
      INNER JOIN members ON members.id = applications.member_id
      ${statusClause}
      ORDER BY applications.created_at DESC
      LIMIT ? OFFSET ?
    `);
  const result = input?.status
    ? await statement
        .bind(input.status, limit, offset)
        .all<RawAdminApplication>()
    : await statement.bind(limit, offset).all<RawAdminApplication>();

  return result.results.map((application) => ({
    ...application,
    offerSnapshot: parseOfferSnapshot(application.offerSnapshot),
  }));
}

export async function listAdminApplicationStatusEvents(
  limit = 40,
): Promise<AdminApplicationStatusEvent[]> {
  await ensureMembershipSchema();
  const safeLimit = Math.min(100, Math.max(1, Math.trunc(limit)));
  const result = await getD1()
    .prepare(
      `
      SELECT
        application_status_events.id,
        members.email AS memberEmail,
        members.display_name AS memberDisplayName,
        applications.service_type AS serviceType,
        application_status_events.from_status AS fromStatus,
        application_status_events.to_status AS toStatus,
        application_status_events.actor_type AS actorType,
        application_status_events.actor_name AS actorName,
        CASE
          WHEN application_status_events.member_message IS NOT NULL
            AND TRIM(application_status_events.member_message) <> ''
          THEN 1
          ELSE 0
        END AS hasMemberMessage,
        application_status_events.created_at AS createdAt
      FROM application_status_events
      INNER JOIN applications
        ON applications.id = application_status_events.application_id
      INNER JOIN members ON members.id = applications.member_id
      ORDER BY
        application_status_events.created_at DESC,
        application_status_events.id DESC
      LIMIT ?
    `,
    )
    .bind(safeLimit)
    .all<AdminApplicationStatusEvent>();
  return result.results;
}

export async function updateAdminApplication(input: {
  applicationId: string;
  expectedUpdatedAt: number;
  status: ApplicationStatus;
  memberMessage: string | null;
  assignedInstructor: string | null;
  scheduledAt: number | null;
  deliveryDetails: string | null;
  internalNote: string | null;
  actor: ChatGPTUser;
}): Promise<
  number | "not_found" | "conflict" | "invalid_transition" | "invalid_schedule"
> {
  await ensureMembershipSchema();
  const db = getD1();
  const current = await db
    .prepare(
      `
      SELECT
        status,
        scheduled_at AS scheduledAt,
        updated_at AS updatedAt
      FROM applications
      WHERE id = ?
      LIMIT 1
    `,
    )
    .bind(input.applicationId)
    .first<{
      status: ApplicationStatus;
      scheduledAt: number | null;
      updatedAt: number;
    }>();
  if (!current) return "not_found";
  if (current.updatedAt !== input.expectedUpdatedAt) return "conflict";
  if (!canAdminTransitionApplication(current.status, input.status)) {
    return "invalid_transition";
  }
  if (
    input.status === "confirmed" &&
    (!input.scheduledAt ||
      ((current.status !== "confirmed" ||
        input.scheduledAt !== current.scheduledAt) &&
        input.scheduledAt <= Date.now()))
  ) {
    return "invalid_schedule";
  }

  const now = Math.max(Date.now(), input.expectedUpdatedAt + 1);
  const [, updateResult] = await db.batch([
    db
      .prepare(
        `
        INSERT INTO application_status_events (
          id,
          application_id,
          from_status,
          to_status,
          actor_type,
          actor_id,
          actor_name,
          member_message,
          operation_snapshot,
          created_at
        )
        SELECT ?, id, ?, ?, 'owner', ?, ?, ?, ?, ?
        FROM applications
        WHERE id = ? AND updated_at = ?
      `,
      )
      .bind(
        crypto.randomUUID(),
        current.status,
        input.status,
        input.actor.userId,
        input.actor.fullName ?? input.actor.email,
        input.memberMessage,
        JSON.stringify({
          assignedInstructor: input.assignedInstructor,
          scheduledAt: input.scheduledAt,
          deliveryDetails: input.deliveryDetails,
          internalNote: input.internalNote,
        }),
        now,
        input.applicationId,
        input.expectedUpdatedAt,
      ),
    db
      .prepare(
        `
        UPDATE applications
        SET
          status = ?,
          member_message = ?,
          assigned_instructor = ?,
          scheduled_at = ?,
          delivery_details = ?,
          internal_note = ?,
          updated_at = ?
        WHERE id = ? AND updated_at = ?
      `,
      )
      .bind(
        input.status,
        input.memberMessage,
        input.assignedInstructor,
        input.scheduledAt,
        input.deliveryDetails,
        input.internalNote,
        now,
        input.applicationId,
        input.expectedUpdatedAt,
      ),
  ]);
  return Number(updateResult.meta.changes ?? 0) > 0 ? now : "conflict";
}

export async function cancelMemberApplication(input: {
  memberId: string;
  applicationId: string;
  expectedUpdatedAt: number;
  actorName: string;
}): Promise<"cancelled" | "not_found" | "conflict"> {
  await ensureMembershipSchema();
  const db = getD1();
  const current = await db
    .prepare(
      `
      SELECT status
      FROM applications
      WHERE id = ? AND member_id = ?
      LIMIT 1
    `,
    )
    .bind(input.applicationId, input.memberId)
    .first<{ status: ApplicationStatus }>();
  if (!current) return "not_found";
  if (!["received", "reviewing"].includes(current.status)) return "conflict";

  const now = Math.max(Date.now(), input.expectedUpdatedAt + 1);
  const memberMessage = "会員本人がマイページから申込希望を取り消しました。";
  const [, updateResult] = await db.batch([
    db
      .prepare(
        `
        INSERT INTO application_status_events (
          id,
          application_id,
          from_status,
          to_status,
          actor_type,
          actor_id,
          actor_name,
          member_message,
          operation_snapshot,
          created_at
        )
        SELECT ?, id, ?, 'cancelled', 'member', ?, ?, ?, ?, ?
        FROM applications
        WHERE id = ? AND member_id = ? AND updated_at = ?
      `,
      )
      .bind(
        crypto.randomUUID(),
        current.status,
        input.memberId,
        input.actorName,
        memberMessage,
        JSON.stringify({ cancelledByMember: true }),
        now,
        input.applicationId,
        input.memberId,
        input.expectedUpdatedAt,
      ),
    db
      .prepare(
        `
        UPDATE applications
        SET status = 'cancelled', member_message = ?, updated_at = ?
        WHERE
          id = ?
          AND member_id = ?
          AND updated_at = ?
          AND status IN ('received', 'reviewing')
      `,
      )
      .bind(
        memberMessage,
        now,
        input.applicationId,
        input.memberId,
        input.expectedUpdatedAt,
      ),
  ]);
  return Number(updateResult.meta.changes ?? 0) > 0 ? "cancelled" : "conflict";
}
