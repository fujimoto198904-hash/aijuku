import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const learningNotes = sqliteTable(
  'learning_notes',
  {
    id: text('id').primaryKey(),
    memberId: text('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    requestId: text('request_id').notNull(),
    legacyId: text('legacy_id'),
    body: text('body').notNull(),
    tool: text('tool').notNull(),
    outcome: text('outcome').notNull(),
    humanFix: text('human_fix').notNull(),
    taskId: text('task_id'),
    sourceRef: text('source_ref'),
    createdAt: integer('created_at').notNull(),
    testedOn: text('tested_on'),
    topic: text('topic'),
    deletedAt: integer('deleted_at'),
  },
  (t) => [
    uniqueIndex('learning_notes_request_unique').on(t.memberId, t.requestId),
    uniqueIndex('learning_notes_legacy_unique').on(t.memberId, t.legacyId),
    index('learning_notes_member_created').on(t.memberId, t.createdAt),
    check(
      'learning_notes_outcome_check',
      sql`${t.outcome} in ('worked','adjusted','learned')`,
    ),
  ],
);
export const postStocks = sqliteTable(
  'post_stocks',
  {
    memberId: text('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    postRef: text('post_ref').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [
    uniqueIndex('post_stocks_member_ref_unique').on(t.memberId, t.postRef),
  ],
);

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

export const billingCustomers = sqliteTable(
  'billing_customers',
  {
    stripeCustomerId: text('stripe_customer_id').primaryKey(),
    memberId: text('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'restrict' }),
    stripeAccountId: text('stripe_account_id').notNull(),
    livemode: integer('livemode').notNull(),
    deletedAt: integer('deleted_at'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    check('billing_customers_livemode_check', sql`${table.livemode} in (0, 1)`),
    uniqueIndex('billing_customers_member_account_mode_unique').on(
      table.memberId,
      table.stripeAccountId,
      table.livemode,
    ),
    index('billing_customers_member_updated_idx').on(
      table.memberId,
      table.updatedAt,
    ),
  ],
);

export const billingCheckoutSessions = sqliteTable(
  'billing_checkout_sessions',
  {
    stripeCheckoutSessionId: text('stripe_checkout_session_id').primaryKey(),
    memberId: text('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'restrict' }),
    applicationId: text('application_id').references(() => applications.id, {
      onDelete: 'restrict',
    }),
    checkoutAttemptId: text('checkout_attempt_id').notNull(),
    stripeIdempotencyKey: text('stripe_idempotency_key').notNull(),
    stripeAccountId: text('stripe_account_id').notNull(),
    livemode: integer('livemode').notNull(),
    serviceType: text('service_type').notNull(),
    mode: text('mode').notNull(),
    status: text('status').notNull(),
    paymentStatus: text('payment_status').notNull(),
    paymentFailedAt: integer('payment_failed_at'),
    stateObservedAt: integer('state_observed_at').notNull(),
    currency: text('currency'),
    amountTotal: integer('amount_total'),
    stripeCustomerId: text('stripe_customer_id'),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    checkoutUrl: text('checkout_url'),
    expiresAt: integer('expires_at'),
    completedAt: integer('completed_at'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    check(
      'billing_checkout_sessions_livemode_check',
      sql`${table.livemode} in (0, 1)`,
    ),
    check(
      'billing_checkout_sessions_service_type_check',
      sql`${table.serviceType} in ('in-person-tutor', 'online-tutor', 'self-study')`,
    ),
    check(
      'billing_checkout_sessions_mode_check',
      sql`${table.mode} in ('payment', 'subscription')`,
    ),
    check(
      'billing_checkout_sessions_application_mode_check',
      sql`(${table.mode} = 'payment' and ${table.applicationId} is not null) or (${table.mode} = 'subscription' and ${table.applicationId} is null)`,
    ),
    check(
      'billing_checkout_sessions_status_check',
      sql`${table.status} in ('open', 'complete', 'expired')`,
    ),
    check(
      'billing_checkout_sessions_payment_status_check',
      sql`${table.paymentStatus} in ('no_payment_required', 'unpaid', 'paid')`,
    ),
    check(
      'billing_checkout_sessions_amount_total_check',
      sql`${table.amountTotal} is null or ${table.amountTotal} >= 0`,
    ),
    uniqueIndex('billing_checkout_sessions_account_attempt_unique').on(
      table.stripeAccountId,
      table.livemode,
      table.checkoutAttemptId,
    ),
    uniqueIndex('billing_checkout_sessions_account_idempotency_unique').on(
      table.stripeAccountId,
      table.livemode,
      table.stripeIdempotencyKey,
    ),
    index('billing_checkout_sessions_member_updated_idx').on(
      table.memberId,
      table.updatedAt,
    ),
    index('billing_checkout_sessions_application_updated_idx').on(
      table.applicationId,
      table.updatedAt,
    ),
    index('billing_checkout_sessions_status_updated_idx').on(
      table.status,
      table.updatedAt,
    ),
  ],
);

export const billingSubscriptions = sqliteTable(
  'billing_subscriptions',
  {
    stripeSubscriptionId: text('stripe_subscription_id').primaryKey(),
    memberId: text('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'restrict' }),
    applicationId: text('application_id').references(() => applications.id, {
      onDelete: 'set null',
    }),
    stripeAccountId: text('stripe_account_id').notNull(),
    livemode: integer('livemode').notNull(),
    stripeCustomerId: text('stripe_customer_id').notNull(),
    serviceType: text('service_type').notNull(),
    stripePriceId: text('stripe_price_id').notNull(),
    status: text('status').notNull(),
    stateObservedAt: integer('state_observed_at').notNull(),
    currency: text('currency'),
    unitAmount: integer('unit_amount'),
    quantity: integer('quantity'),
    currentPeriodStart: integer('current_period_start'),
    currentPeriodEnd: integer('current_period_end'),
    cancelAtPeriodEnd: integer('cancel_at_period_end').notNull().default(0),
    cancelAt: integer('cancel_at'),
    canceledAt: integer('canceled_at'),
    endedAt: integer('ended_at'),
    trialEnd: integer('trial_end'),
    latestInvoiceId: text('latest_invoice_id'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    check(
      'billing_subscriptions_livemode_check',
      sql`${table.livemode} in (0, 1)`,
    ),
    check(
      'billing_subscriptions_service_type_check',
      sql`${table.serviceType} in ('in-person-tutor', 'online-tutor', 'self-study')`,
    ),
    check(
      'billing_subscriptions_status_check',
      sql`${table.status} in ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')`,
    ),
    check(
      'billing_subscriptions_application_null_check',
      sql`${table.applicationId} is null`,
    ),
    check(
      'billing_subscriptions_unit_amount_check',
      sql`${table.unitAmount} is null or ${table.unitAmount} >= 0`,
    ),
    check(
      'billing_subscriptions_quantity_check',
      sql`${table.quantity} is null or ${table.quantity} > 0`,
    ),
    check(
      'billing_subscriptions_cancel_at_period_end_check',
      sql`${table.cancelAtPeriodEnd} in (0, 1)`,
    ),
    index('billing_subscriptions_member_service_status_idx').on(
      table.memberId,
      table.serviceType,
      table.status,
    ),
    index('billing_subscriptions_customer_updated_idx').on(
      table.stripeCustomerId,
      table.updatedAt,
    ),
  ],
);

export const stripeObjectSyncLocks = sqliteTable(
  'stripe_object_sync_locks',
  {
    lockKey: text('lock_key').primaryKey(),
    stripeObjectType: text('stripe_object_type').notNull(),
    stripeObjectId: text('stripe_object_id').notNull(),
    stripeAccountId: text('stripe_account_id').notNull(),
    livemode: integer('livemode').notNull(),
    leaseOwner: text('lease_owner').notNull(),
    leaseExpiresAt: integer('lease_expires_at').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    check(
      'stripe_object_sync_locks_type_check',
      sql`${table.stripeObjectType} in ('checkout_session', 'subscription', 'customer')`,
    ),
    check(
      'stripe_object_sync_locks_livemode_check',
      sql`${table.livemode} in (0, 1)`,
    ),
    index('stripe_object_sync_locks_lease_expires_idx').on(
      table.leaseExpiresAt,
    ),
    uniqueIndex('stripe_object_sync_locks_account_object_unique').on(
      table.stripeAccountId,
      table.livemode,
      table.stripeObjectType,
      table.stripeObjectId,
    ),
  ],
);

export const stripeWebhookEvents = sqliteTable(
  'stripe_webhook_events',
  {
    stripeEventId: text('stripe_event_id').primaryKey(),
    stripeAccountId: text('stripe_account_id').notNull(),
    livemode: integer('livemode').notNull(),
    eventType: text('event_type').notNull(),
    apiVersion: text('api_version'),
    status: text('status').notNull(),
    attemptCount: integer('attempt_count').notNull(),
    lastError: text('last_error'),
    stripeCreatedAt: integer('stripe_created_at').notNull(),
    processingStartedAt: integer('processing_started_at').notNull(),
    processedAt: integer('processed_at'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    check(
      'stripe_webhook_events_livemode_check',
      sql`${table.livemode} in (0, 1)`,
    ),
    check(
      'stripe_webhook_events_status_check',
      sql`${table.status} in ('processing', 'processed', 'failed')`,
    ),
    check(
      'stripe_webhook_events_attempt_count_check',
      sql`${table.attemptCount} >= 1`,
    ),
    index('stripe_webhook_events_status_updated_idx').on(
      table.status,
      table.updatedAt,
    ),
  ],
);

export const googleCalendarConnections = sqliteTable(
  'google_calendar_connections',
  {
    ownerMemberId: text('owner_member_id')
      .primaryKey()
      .references(() => members.id, { onDelete: 'cascade' }),
    googleSubject: text('google_subject').notNull(),
    googleEmail: text('google_email').notNull(),
    refreshTokenCiphertext: text('refresh_token_ciphertext'),
    grantedScopes: text('granted_scopes').notNull(),
    status: text('status').notNull(),
    lastErrorCode: text('last_error_code'),
    connectedAt: integer('connected_at').notNull(),
    lastVerifiedAt: integer('last_verified_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('google_calendar_connections_subject_unique').on(
      table.googleSubject,
    ),
    uniqueIndex('google_calendar_connections_email_unique').on(
      table.googleEmail,
    ),
    check(
      'google_calendar_connections_status_check',
      sql`${table.status} in ('active', 'reconnect_required', 'disconnected')`,
    ),
    check(
      'google_calendar_connections_token_state_check',
      sql`(${table.status} = 'active' and ${table.refreshTokenCiphertext} is not null) or (${table.status} <> 'active' and ${table.refreshTokenCiphertext} is null)`,
    ),
    index('google_calendar_connections_status_updated_idx').on(
      table.status,
      table.updatedAt,
    ),
  ],
);

export const applicationCalendarEvents = sqliteTable(
  'application_calendar_events',
  {
    applicationId: text('application_id')
      .primaryKey()
      .references(() => applications.id, { onDelete: 'cascade' }),
    ownerMemberId: text('owner_member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'restrict' }),
    googleEventId: text('google_event_id').notNull(),
    googleEventEtag: text('google_event_etag'),
    conferenceRequestId: text('conference_request_id'),
    meetUrlCiphertext: text('meet_url_ciphertext'),
    startAt: integer('start_at').notNull(),
    endAt: integer('end_at').notNull(),
    timezone: text('timezone').notNull(),
    syncStatus: text('sync_status').notNull(),
    lastErrorCode: text('last_error_code'),
    attemptCount: integer('attempt_count').notNull(),
    syncedAt: integer('synced_at'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('application_calendar_events_google_event_id_unique').on(
      table.googleEventId,
    ),
    uniqueIndex('application_calendar_events_conference_request_id_unique').on(
      table.conferenceRequestId,
    ),
    check(
      'application_calendar_events_schedule_check',
      sql`${table.startAt} >= 0 and ${table.endAt} > ${table.startAt}`,
    ),
    check(
      'application_calendar_events_timezone_check',
      sql`${table.timezone} = 'Asia/Tokyo'`,
    ),
    check(
      'application_calendar_events_sync_status_check',
      sql`${table.syncStatus} in ('create_pending', 'active', 'failed', 'reconnect_required')`,
    ),
    check(
      'application_calendar_events_attempt_count_check',
      sql`${table.attemptCount} >= 1`,
    ),
    check(
      'application_calendar_events_meet_reference_check',
      sql`${table.meetUrlCiphertext} is null or ${table.conferenceRequestId} is not null`,
    ),
    check(
      'application_calendar_events_synced_at_check',
      sql`(${table.syncStatus} = 'active' and ${table.syncedAt} is not null) or (${table.syncStatus} <> 'active' and ${table.syncedAt} is null)`,
    ),
    check(
      'application_calendar_events_error_state_check',
      sql`(${table.syncStatus} in ('create_pending', 'active') and ${table.lastErrorCode} is null) or (${table.syncStatus} in ('failed', 'reconnect_required') and ${table.lastErrorCode} is not null)`,
    ),
    index('application_calendar_events_owner_status_idx').on(
      table.ownerMemberId,
      table.syncStatus,
    ),
    index('application_calendar_events_status_updated_idx').on(
      table.syncStatus,
      table.updatedAt,
    ),
  ],
);

export const communityMedia = sqliteTable(
  'community_media',
  {
    id: text('id').primaryKey(),
    memberId: text('member_id')
      .notNull()
      .references(() => members.id),
    objectKey: text('object_key').notNull(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    byteSize: integer('byte_size').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [index('community_media_created_idx').on(t.createdAt)],
);
export const communityPosts = sqliteTable(
  'community_posts',
  {
    id: text('id').primaryKey(),
    authorId: text('author_id')
      .notNull()
      .references(() => members.id),
    requestId: text('request_id').notNull(),
    kind: text('kind').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    taskId: text('task_id'),
    mediaId: text('media_id').references(() => communityMedia.id),
    authorName: text('author_name').notNull(),
    authorRole: text('author_role').notNull(),
    createdAt: integer('created_at').notNull(),
    deletedAt: integer('deleted_at'),
    deletedBy: text('deleted_by'),
  },
  (table) => [
    uniqueIndex('community_posts_request_unique').on(
      table.authorId,
      table.requestId,
    ),
    index('community_posts_feed_idx').on(
      table.deletedAt,
      table.createdAt,
      table.id,
    ),
    index('community_posts_kind_idx').on(
      table.kind,
      table.deletedAt,
      table.createdAt,
    ),
    index('community_posts_media_idx').on(table.mediaId),
    check(
      'community_posts_kind_check',
      sql`${table.kind} in ('question','tip','learning')`,
    ),
    check(
      'community_posts_role_check',
      sql`${table.authorRole} in ('member','staff')`,
    ),
  ],
);
export const communityReplies = sqliteTable(
  'community_replies',
  {
    id: text('id').primaryKey(),
    postId: text('post_id')
      .notNull()
      .references(() => communityPosts.id),
    authorId: text('author_id')
      .notNull()
      .references(() => members.id),
    requestId: text('request_id').notNull(),
    body: text('body').notNull(),
    authorName: text('author_name').notNull(),
    authorRole: text('author_role').notNull(),
    createdAt: integer('created_at').notNull(),
    deletedAt: integer('deleted_at'),
    deletedBy: text('deleted_by'),
  },
  (table) => [
    uniqueIndex('community_replies_request_unique').on(
      table.authorId,
      table.requestId,
    ),
    index('community_replies_post_idx').on(
      table.postId,
      table.deletedAt,
      table.createdAt,
    ),
    check(
      'community_replies_role_check',
      sql`${table.authorRole} in ('member','staff')`,
    ),
  ],
);
export const communityWriteLimits = sqliteTable('community_write_limits', {
  memberId: text('member_id')
    .primaryKey()
    .references(() => members.id),
  windowStart: integer('window_start').notNull(),
  requestCount: integer('request_count').notNull(),
});
export const registrationTickets = sqliteTable(
  'registration_tickets',
  {
    tokenHash: text('token_hash').primaryKey(),
    email: text('email').notNull(),
    provider: text('provider').notNull(),
    subject: text('subject'),
    expiresAt: integer('expires_at').notNull(),
    usedAt: integer('used_at'),
  },
  (table) => [index('registration_tickets_expiry_idx').on(table.expiresAt)],
);
export const memberAuthIdentities = sqliteTable(
  'member_auth_identities',
  {
    provider: text('provider').notNull(),
    subject: text('subject').notNull(),
    memberId: text('member_id')
      .notNull()
      .references(() => members.id),
  },
  (table) => [
    uniqueIndex('member_auth_identities_subject_unique').on(
      table.provider,
      table.subject,
    ),
  ],
);
export const registrationRateLimits = sqliteTable('registration_rate_limits', {
  keyHash: text('key_hash').primaryKey(),
  windowStart: integer('window_start').notNull(),
  requestCount: integer('request_count').notNull(),
});
