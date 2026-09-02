import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const members = sqliteTable(
  'members',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    displayName: text('display_name').notNull(),
    status: text('status').notNull(),
    termsVersion: text('terms_version').notNull(),
    termsAcceptedAt: integer('terms_accepted_at').notNull(),
    privacyVersion: text('privacy_version').notNull(),
    privacyAcceptedAt: integer('privacy_accepted_at').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    check(
      'members_status_check',
      sql`${table.status} in ('active', 'suspended', 'withdrawn')`,
    ),
  ],
);

export const memberAuthAccounts = sqliteTable(
  'member_auth_accounts',
  {
    memberId: text('member_id').primaryKey(),
    loginId: text('login_id').notNull(),
    contactEmail: text('contact_email'),
    passwordDigest: text('password_digest').notNull(),
    passwordState: text('password_state').notNull(),
    accountKind: text('account_kind').notNull(),
    status: text('status').notNull(),
    temporaryPasswordExpiresAt: integer('temporary_password_expires_at'),
    passwordChangedAt: integer('password_changed_at'),
    lastLoginAt: integer('last_login_at'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('member_auth_accounts_login_id_unique').on(table.loginId),
    check(
      'member_auth_accounts_password_state_check',
      sql`${table.passwordState} in ('temporary', 'personal')`,
    ),
    check(
      'member_auth_accounts_kind_check',
      sql`${table.accountKind} in ('member', 'demo')`,
    ),
    check(
      'member_auth_accounts_status_check',
      sql`${table.status} in ('active', 'disabled')`,
    ),
    check(
      'member_auth_accounts_temporary_expiry_check',
      sql`(${table.passwordState} = 'temporary' and ${table.temporaryPasswordExpiresAt} is not null) or (${table.passwordState} = 'personal' and ${table.temporaryPasswordExpiresAt} is null)`,
    ),
  ],
);

export const memberAuthSessions = sqliteTable(
  'member_auth_sessions',
  {
    tokenHash: text('token_hash').primaryKey(),
    accountId: text('account_id')
      .notNull()
      .references(() => memberAuthAccounts.memberId, { onDelete: 'cascade' }),
    sessionKind: text('session_kind').notNull(),
    createdAt: integer('created_at').notNull(),
    lastSeenAt: integer('last_seen_at').notNull(),
    expiresAt: integer('expires_at').notNull(),
    revokedAt: integer('revoked_at'),
  },
  (table) => [
    check(
      'member_auth_sessions_kind_check',
      sql`${table.sessionKind} in ('member', 'password-change')`,
    ),
    check(
      'member_auth_sessions_expiry_check',
      sql`${table.expiresAt} > ${table.createdAt}`,
    ),
    index('member_auth_sessions_account_expiry_idx').on(
      table.accountId,
      table.expiresAt,
    ),
    index('member_auth_sessions_expiry_idx').on(table.expiresAt),
  ],
);

export const memberAuthRateLimits = sqliteTable(
  'member_auth_rate_limits',
  {
    keyHash: text('key_hash').primaryKey(),
    action: text('action').notNull(),
    windowStartedAt: integer('window_started_at').notNull(),
    requestCount: integer('request_count').notNull(),
    blockedUntil: integer('blocked_until'),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    check(
      'member_auth_rate_limits_action_check',
      sql`${table.action} in ('login-id', 'login-ip', 'password-change', 'bootstrap')`,
    ),
    check(
      'member_auth_rate_limits_count_check',
      sql`${table.requestCount} between 1 and 100`,
    ),
    index('member_auth_rate_limits_updated_idx').on(table.updatedAt),
  ],
);

export const memberOnboardingProfiles = sqliteTable(
  'member_onboarding_profiles',
  {
    memberId: text('member_id')
      .primaryKey()
      .references(() => members.id, { onDelete: 'cascade' }),
    learningGoal: text('learning_goal').notNull(),
    startMode: text('start_mode').notNull(),
    interestKeys: text('interest_keys').notNull(),
    firstOutcome: text('first_outcome'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    check(
      'member_onboarding_profiles_goal_check',
      sql`${table.learningGoal} in ('daily-life', 'work-efficiency', 'creative', 'build', 'team', 'explore')`,
    ),
    check(
      'member_onboarding_profiles_start_mode_check',
      sql`${table.startMode} in ('level-zero', 'quick-win', 'build-now', 'focus-area', 'recommend')`,
    ),
  ],
);

export const memberLessonProgress = sqliteTable(
  'member_lesson_progress',
  {
    memberId: text('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    taskId: text('task_id').notNull(),
    bookmarked: integer('bookmarked').notNull().default(0),
    completed: integer('completed').notNull().default(0),
    completedAt: integer('completed_at'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    check(
      'member_lesson_progress_bookmarked_check',
      sql`${table.bookmarked} in (0, 1)`,
    ),
    check(
      'member_lesson_progress_completed_check',
      sql`${table.completed} in (0, 1)`,
    ),
    check(
      'member_lesson_progress_state_check',
      sql`not (${table.bookmarked} = 1 and ${table.completed} = 1)`,
    ),
    check(
      'member_lesson_progress_completed_at_check',
      sql`(${table.completed} = 1 and ${table.completedAt} is not null) or (${table.completed} = 0 and ${table.completedAt} is null)`,
    ),
    uniqueIndex('member_lesson_progress_member_task_unique').on(
      table.memberId,
      table.taskId,
    ),
    index('member_lesson_progress_member_updated_idx').on(
      table.memberId,
      table.updatedAt,
    ),
  ],
);

export const memberLessonRateLimits = sqliteTable(
  'member_lesson_rate_limits',
  {
    memberId: text('member_id')
      .primaryKey()
      .references(() => members.id, { onDelete: 'cascade' }),
    windowStartedAt: integer('window_started_at').notNull(),
    requestCount: integer('request_count').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    check(
      'member_lesson_rate_limits_count_check',
      sql`${table.requestCount} between 1 and 30`,
    ),
  ],
);

export const applications = sqliteTable(
  'applications',
  {
    id: text('id').primaryKey(),
    memberId: text('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    clientRequestId: text('client_request_id').notNull(),
    serviceType: text('service_type').notNull(),
    status: text('status').notNull(),
    goal: text('goal').notNull(),
    preferredSchedule: text('preferred_schedule').notNull(),
    participants: integer('participants').notNull(),
    notes: text('notes'),
    offerSnapshot: text('offer_snapshot').notNull().default('{}'),
    termsVersion: text('terms_version').notNull().default('legacy'),
    privacyVersion: text('privacy_version').notNull().default('legacy'),
    memberMessage: text('member_message'),
    assignedInstructor: text('assigned_instructor'),
    scheduledAt: integer('scheduled_at'),
    deliveryDetails: text('delivery_details'),
    internalNote: text('internal_note'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    check(
      'applications_service_type_check',
      sql`${table.serviceType} in ('in-person-tutor', 'online-tutor', 'self-study')`,
    ),
    check(
      'applications_status_check',
      sql`${table.status} in ('received', 'reviewing', 'confirmed', 'cancelled')`,
    ),
    check(
      'applications_participants_check',
      sql`${table.participants} between 1 and 5`,
    ),
    uniqueIndex('applications_member_request_unique').on(
      table.memberId,
      table.clientRequestId,
    ),
    index('applications_member_created_idx').on(
      table.memberId,
      table.createdAt,
    ),
    index('applications_status_created_idx').on(table.status, table.createdAt),
  ],
);

export const applicationStatusEvents = sqliteTable(
  'application_status_events',
  {
    id: text('id').primaryKey(),
    applicationId: text('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    fromStatus: text('from_status').notNull(),
    toStatus: text('to_status').notNull(),
    actorType: text('actor_type').notNull(),
    actorId: text('actor_id').notNull(),
    actorName: text('actor_name').notNull(),
    memberMessage: text('member_message'),
    operationSnapshot: text('operation_snapshot').notNull().default('{}'),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [
    check(
      'application_status_events_from_status_check',
      sql`${table.fromStatus} in ('received', 'reviewing', 'confirmed', 'cancelled')`,
    ),
    check(
      'application_status_events_to_status_check',
      sql`${table.toStatus} in ('received', 'reviewing', 'confirmed', 'cancelled')`,
    ),
    check(
      'application_status_events_actor_type_check',
      sql`${table.actorType} in ('member', 'owner')`,
    ),
    index('application_status_events_application_created_idx').on(
      table.applicationId,
      table.createdAt,
    ),
    index('application_status_events_created_idx').on(table.createdAt),
  ],
);

export const skillProfiles = sqliteTable(
  'skill_profiles',
  {
    memberId: text('member_id')
      .primaryKey()
      .references(() => members.id, { onDelete: 'cascade' }),
    publicSlug: text('public_slug').notNull(),
    headline: text('headline').notNull(),
    targetRole: text('target_role').notNull(),
    bio: text('bio').notNull(),
    shareEnabled: integer('share_enabled').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    check(
      'skill_profiles_share_enabled_check',
      sql`${table.shareEnabled} in (0, 1)`,
    ),
    uniqueIndex('skill_profiles_public_slug_unique').on(table.publicSlug),
  ],
);

export const skillEvidence = sqliteTable(
  'skill_evidence',
  {
    id: text('id').primaryKey(),
    memberId: text('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    clientRequestId: text('client_request_id'),
    sourceType: text('source_type').notNull(),
    taskId: text('task_id'),
    taskTitle: text('task_title').notNull(),
    taskOutcome: text('task_outcome').notNull(),
    track: text('track').notNull(),
    courseTitle: text('course_title').notNull(),
    skillKeys: text('skill_keys').notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    evidenceUrl: text('evidence_url'),
    rightsConfirmedAt: integer('rights_confirmed_at').notNull(),
    visibility: text('visibility').notNull(),
    instructorStatus: text('instructor_status').notNull(),
    instructorNote: text('instructor_note'),
    verifiedBy: text('verified_by'),
    verifiedByName: text('verified_by_name'),
    verifiedAt: integer('verified_at'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    check(
      'skill_evidence_source_type_check',
      sql`${table.sourceType} in ('curriculum', 'prior-work')`,
    ),
    check(
      'skill_evidence_track_check',
      sql`${table.track} in ('common', 'department', 'industry', 'generation', 'other')`,
    ),
    check(
      'skill_evidence_visibility_check',
      sql`${table.visibility} in ('private', 'shared')`,
    ),
    check(
      'skill_evidence_rights_confirmed_check',
      sql`${table.rightsConfirmedAt} > 0`,
    ),
    check(
      'skill_evidence_instructor_status_check',
      sql`${table.instructorStatus} in ('pending', 'verified', 'changes_requested')`,
    ),
    index('skill_evidence_member_created_idx').on(
      table.memberId,
      table.createdAt,
    ),
    index('skill_evidence_status_created_idx').on(
      table.instructorStatus,
      table.createdAt,
    ),
    uniqueIndex('skill_evidence_member_request_unique').on(
      table.memberId,
      table.clientRequestId,
    ),
  ],
);

export const externalReviewRequests = sqliteTable(
  'external_review_requests',
  {
    id: text('id').primaryKey(),
    evidenceId: text('evidence_id')
      .notNull()
      .references(() => skillEvidence.id, { onDelete: 'cascade' }),
    memberId: text('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    status: text('status').notNull(),
    expiresAt: integer('expires_at').notNull(),
    createdAt: integer('created_at').notNull(),
    usedAt: integer('used_at'),
  },
  (table) => [
    check(
      'external_review_requests_status_check',
      sql`${table.status} in ('open', 'submitted', 'revoked')`,
    ),
    uniqueIndex('external_review_requests_token_hash_unique').on(
      table.tokenHash,
    ),
    index('external_review_requests_evidence_status_idx').on(
      table.evidenceId,
      table.status,
    ),
    index('external_review_requests_member_created_idx').on(
      table.memberId,
      table.createdAt,
    ),
  ],
);

export const externalReviews = sqliteTable(
  'external_reviews',
  {
    id: text('id').primaryKey(),
    requestId: text('request_id')
      .notNull()
      .references(() => externalReviewRequests.id, { onDelete: 'cascade' }),
    evidenceId: text('evidence_id')
      .notNull()
      .references(() => skillEvidence.id, { onDelete: 'cascade' }),
    reviewerUserId: text('reviewer_user_id').notNull(),
    reviewerName: text('reviewer_name').notNull(),
    reviewerAffiliation: text('reviewer_affiliation'),
    relationship: text('relationship').notNull(),
    rating: integer('rating').notNull(),
    observations: text('observations').notNull(),
    comment: text('comment').notNull(),
    consentPublic: integer('consent_public').notNull(),
    termsVersion: text('terms_version'),
    privacyVersion: text('privacy_version'),
    policyAcceptedAt: integer('policy_accepted_at'),
    moderationStatus: text('moderation_status').notNull(),
    moderationNote: text('moderation_note'),
    moderatedBy: text('moderated_by'),
    moderatedAt: integer('moderated_at'),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [
    check(
      'external_reviews_relationship_check',
      sql`${table.relationship} in ('manager', 'colleague', 'client', 'teacher', 'project-member', 'other')`,
    ),
    check(
      'external_reviews_rating_check',
      sql`${table.rating} between 1 and 4`,
    ),
    check(
      'external_reviews_consent_public_check',
      sql`${table.consentPublic} in (0, 1)`,
    ),
    check(
      'external_reviews_policy_accepted_check',
      sql`${table.policyAcceptedAt} is null or ${table.policyAcceptedAt} > 0`,
    ),
    check(
      'external_reviews_moderation_status_check',
      sql`${table.moderationStatus} in ('pending', 'approved', 'rejected')`,
    ),
    uniqueIndex('external_reviews_request_unique').on(table.requestId),
    uniqueIndex('external_reviews_evidence_reviewer_unique').on(
      table.evidenceId,
      table.reviewerUserId,
    ),
    index('external_reviews_evidence_status_idx').on(
      table.evidenceId,
      table.moderationStatus,
    ),
    index('external_reviews_moderation_created_idx').on(
      table.moderationStatus,
      table.createdAt,
    ),
  ],
);

export const skillEvidenceReviewEvents = sqliteTable(
  'skill_evidence_review_events',
  {
    id: text('id').primaryKey(),
    evidenceId: text('evidence_id')
      .notNull()
      .references(() => skillEvidence.id, { onDelete: 'cascade' }),
    fromStatus: text('from_status').notNull(),
    toStatus: text('to_status').notNull(),
    reviewerUserId: text('reviewer_user_id').notNull(),
    reviewerName: text('reviewer_name').notNull(),
    note: text('note').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [
    check(
      'skill_evidence_review_events_from_status_check',
      sql`${table.fromStatus} in ('pending', 'verified', 'changes_requested')`,
    ),
    check(
      'skill_evidence_review_events_to_status_check',
      sql`${table.toStatus} in ('verified', 'changes_requested')`,
    ),
    index('skill_evidence_review_events_evidence_created_idx').on(
      table.evidenceId,
      table.createdAt,
    ),
  ],
);

export const externalReviewModerationEvents = sqliteTable(
  'external_review_moderation_events',
  {
    id: text('id').primaryKey(),
    reviewId: text('review_id')
      .notNull()
      .references(() => externalReviews.id, { onDelete: 'cascade' }),
    fromStatus: text('from_status').notNull(),
    toStatus: text('to_status').notNull(),
    moderatorUserId: text('moderator_user_id').notNull(),
    moderatorName: text('moderator_name').notNull(),
    note: text('note').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [
    check(
      'external_review_moderation_events_from_status_check',
      sql`${table.fromStatus} in ('pending', 'approved', 'rejected')`,
    ),
    check(
      'external_review_moderation_events_to_status_check',
      sql`${table.toStatus} in ('approved', 'rejected')`,
    ),
    index('external_review_moderation_events_review_created_idx').on(
      table.reviewId,
      table.createdAt,
    ),
  ],
);
