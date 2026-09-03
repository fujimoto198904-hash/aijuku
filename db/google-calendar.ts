import { env } from 'cloudflare:workers';

export type GoogleCalendarConnectionStatus =
  | 'active'
  | 'reconnect_required'
  | 'disconnected';

/**
 * Secret-bearing database record. Never serialize this value into a response,
 * audit snapshot, or log. Decrypt the refresh token only at the provider call
 * boundary and discard the plaintext immediately after use.
 */
export type GoogleCalendarConnection = {
  ownerMemberId: string;
  googleSubject: string;
  googleEmail: string;
  refreshTokenCiphertext: string | null;
  grantedScopes: string;
  status: GoogleCalendarConnectionStatus;
  lastErrorCode: string | null;
  connectedAt: number;
  lastVerifiedAt: number;
  updatedAt: number;
};

export type ApplicationCalendarSyncStatus =
  | 'create_pending'
  | 'active'
  | 'failed'
  | 'reconnect_required';

/**
 * Secret-bearing database record because `meetUrlCiphertext` may contain the
 * encrypted meeting URL. Never expose this record directly to a client.
 */
export type ApplicationCalendarEvent = {
  applicationId: string;
  ownerMemberId: string;
  googleEventId: string;
  googleEventEtag: string | null;
  conferenceRequestId: string | null;
  meetUrlCiphertext: string | null;
  startAt: number;
  endAt: number;
  timezone: 'Asia/Tokyo';
  syncStatus: ApplicationCalendarSyncStatus;
  lastErrorCode: string | null;
  attemptCount: number;
  syncedAt: number | null;
  createdAt: number;
  updatedAt: number;
};

const connectionColumns = `
  owner_member_id AS ownerMemberId,
  google_subject AS googleSubject,
  google_email AS googleEmail,
  refresh_token_ciphertext AS refreshTokenCiphertext,
  granted_scopes AS grantedScopes,
  status,
  last_error_code AS lastErrorCode,
  connected_at AS connectedAt,
  last_verified_at AS lastVerifiedAt,
  updated_at AS updatedAt
`;

const applicationEventColumns = `
  application_id AS applicationId,
  owner_member_id AS ownerMemberId,
  google_event_id AS googleEventId,
  google_event_etag AS googleEventEtag,
  conference_request_id AS conferenceRequestId,
  meet_url_ciphertext AS meetUrlCiphertext,
  start_at AS startAt,
  end_at AS endAt,
  timezone,
  sync_status AS syncStatus,
  last_error_code AS lastErrorCode,
  attempt_count AS attemptCount,
  synced_at AS syncedAt,
  created_at AS createdAt,
  updated_at AS updatedAt
`;

function getD1(): D1Database {
  if (!env.DB) throw new Error('D1 binding `DB` is unavailable.');
  return env.DB;
}

function mutationChanged(result: D1Result): boolean {
  return Number(result.meta.changes ?? 0) > 0;
}

function assertSchedule(startAt: number, endAt: number): void {
  if (
    !Number.isSafeInteger(startAt) ||
    !Number.isSafeInteger(endAt) ||
    startAt < 0 ||
    endAt <= startAt
  ) {
    throw new RangeError('Calendar event requires a valid start and end time.');
  }
}

function assertNormalizedErrorCode(value: string): string {
  const normalized = value.trim();
  if (!/^[a-z][a-z0-9-]{0,63}$/.test(normalized)) {
    throw new TypeError('Calendar errors must use a normalized code.');
  }
  return normalized;
}

function assertExpectedUpdatedAt(value: number | null): void {
  if (value !== null && (!Number.isSafeInteger(value) || value < 0)) {
    throw new RangeError(
      'Expected update time must be a non-negative integer.',
    );
  }
}

function assertStoredCiphertext(
  value: string,
  version: 'gcal-rt-v1' | 'gcal-meet-v1',
): string {
  const normalized = value.trim();
  const maximumLength = version === 'gcal-rt-v1' ? 16_384 : 4_096;
  if (
    normalized.length > maximumLength ||
    !new RegExp(`^${version}\\.[A-Za-z0-9_-]{16}\\.[A-Za-z0-9_-]+$`).test(
      normalized,
    )
  ) {
    throw new TypeError('Calendar secrets must be encrypted before storage.');
  }
  return normalized;
}

/**
 * Returns the owner's secret-bearing connection record. Callers must not log
 * or serialize the result.
 */
export async function getGoogleCalendarConnection(
  ownerMemberId: string,
): Promise<GoogleCalendarConnection | null> {
  return getD1()
    .prepare(
      `
        SELECT ${connectionColumns}
        FROM google_calendar_connections
        WHERE owner_member_id = ?
        LIMIT 1
      `,
    )
    .bind(ownerMemberId)
    .first<GoogleCalendarConnection>();
}

export type UpsertGoogleCalendarConnectionInput = {
  ownerMemberId: string;
  googleSubject: string;
  googleEmail: string;
  /** Omit when Google does not rotate the existing refresh token. */
  refreshTokenCiphertext?: string | null;
  grantedScopes: string;
  connectedAt?: number;
  lastVerifiedAt?: number;
};

/**
 * Saves a verified owner connection. A reconnect may refresh the email for the
 * same immutable Google subject, but it cannot silently replace the connected
 * Google account. A null result means the stored subject did not match.
 *
 * The previous encrypted refresh token is retained when Google omits a new
 * refresh token during consent. The returned record remains secret-bearing.
 */
export async function upsertGoogleCalendarConnection(
  input: UpsertGoogleCalendarConnectionInput,
): Promise<GoogleCalendarConnection | null> {
  const now = Date.now();
  const connectedAt = input.connectedAt ?? now;
  const lastVerifiedAt = input.lastVerifiedAt ?? now;
  const googleEmail = input.googleEmail.trim().toLowerCase();
  const refreshTokenCiphertext = input.refreshTokenCiphertext
    ? assertStoredCiphertext(input.refreshTokenCiphertext, 'gcal-rt-v1')
    : null;
  const db = getD1();

  if (!refreshTokenCiphertext) {
    const existing = await db
      .prepare(
        `
          UPDATE google_calendar_connections
          SET
            google_email = ?,
            granted_scopes = ?,
            status = 'active',
            last_error_code = NULL,
            last_verified_at = ?,
            updated_at = CASE WHEN updated_at >= ? THEN updated_at + 1 ELSE ? END
          WHERE owner_member_id = ?
            AND google_subject = ?
            AND refresh_token_ciphertext IS NOT NULL
          RETURNING ${connectionColumns}
        `,
      )
      .bind(
        googleEmail,
        input.grantedScopes,
        lastVerifiedAt,
        now,
        now,
        input.ownerMemberId,
        input.googleSubject,
      )
      .first<GoogleCalendarConnection>();
    return existing?.refreshTokenCiphertext ? existing : null;
  }

  const row = await db
    .prepare(
      `
        INSERT INTO google_calendar_connections (
          owner_member_id,
          google_subject,
          google_email,
          refresh_token_ciphertext,
          granted_scopes,
          status,
          last_error_code,
          connected_at,
          last_verified_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, 'active', NULL, ?, ?, ?)
        ON CONFLICT(owner_member_id) DO UPDATE SET
          google_email = excluded.google_email,
          refresh_token_ciphertext = excluded.refresh_token_ciphertext,
          granted_scopes = excluded.granted_scopes,
          status = 'active',
          last_error_code = NULL,
          last_verified_at = excluded.last_verified_at,
          updated_at = CASE
            WHEN google_calendar_connections.updated_at >= excluded.updated_at
              THEN google_calendar_connections.updated_at + 1
            ELSE excluded.updated_at
          END
        WHERE
          google_calendar_connections.google_subject = excluded.google_subject
        RETURNING ${connectionColumns}
      `,
    )
    .bind(
      input.ownerMemberId,
      input.googleSubject,
      googleEmail,
      refreshTokenCiphertext,
      input.grantedScopes,
      connectedAt,
      lastVerifiedAt,
      now,
    )
    .first<GoogleCalendarConnection>();

  return row?.refreshTokenCiphertext ? row : null;
}

/**
 * Disconnects only the expected Google subject and deletes the stored token.
 * Passing `expectedUpdatedAt` prevents a stale browser from disconnecting a
 * newly reconnected account. Returns true only when a row changed.
 */
export async function disconnectGoogleCalendarConnection(input: {
  ownerMemberId: string;
  expectedGoogleSubject: string;
  expectedUpdatedAt?: number;
}): Promise<boolean> {
  if (input.expectedUpdatedAt !== undefined) {
    assertExpectedUpdatedAt(input.expectedUpdatedAt);
  }
  const now = Date.now();
  const result = await getD1()
    .prepare(
      `
        UPDATE google_calendar_connections
        SET
          refresh_token_ciphertext = NULL,
          status = 'disconnected',
          last_error_code = NULL,
          updated_at = CASE WHEN updated_at >= ? THEN updated_at + 1 ELSE ? END
        WHERE
          owner_member_id = ?
          AND google_subject = ?
          AND status <> 'disconnected'
          AND (? IS NULL OR updated_at = ?)
      `,
    )
    .bind(
      now,
      now,
      input.ownerMemberId,
      input.expectedGoogleSubject,
      input.expectedUpdatedAt ?? null,
      input.expectedUpdatedAt ?? null,
    )
    .run();
  return mutationChanged(result);
}

/**
 * Stops provider calls after Google rejects the grant. The unusable encrypted
 * token is deleted. Error codes must be normalized application codes, never a
 * raw provider response.
 */
export async function markGoogleCalendarConnectionReconnectRequired(input: {
  ownerMemberId: string;
  expectedGoogleSubject: string;
  errorCode: string;
  expectedUpdatedAt?: number;
}): Promise<boolean> {
  if (input.expectedUpdatedAt !== undefined) {
    assertExpectedUpdatedAt(input.expectedUpdatedAt);
  }
  const errorCode = assertNormalizedErrorCode(input.errorCode);
  const now = Date.now();
  const result = await getD1()
    .prepare(
      `
        UPDATE google_calendar_connections
        SET
          refresh_token_ciphertext = NULL,
          status = 'reconnect_required',
          last_error_code = ?,
          updated_at = CASE WHEN updated_at >= ? THEN updated_at + 1 ELSE ? END
        WHERE
          owner_member_id = ?
          AND google_subject = ?
          AND status = 'active'
          AND (? IS NULL OR updated_at = ?)
      `,
    )
    .bind(
      errorCode,
      now,
      now,
      input.ownerMemberId,
      input.expectedGoogleSubject,
      input.expectedUpdatedAt ?? null,
      input.expectedUpdatedAt ?? null,
    )
    .run();
  return mutationChanged(result);
}

/** Returns the secret-bearing sync record for one application. */
export async function getApplicationCalendarEvent(
  applicationId: string,
): Promise<ApplicationCalendarEvent | null> {
  return getD1()
    .prepare(
      `
        SELECT ${applicationEventColumns}
        FROM application_calendar_events
        WHERE application_id = ?
        LIMIT 1
      `,
    )
    .bind(applicationId)
    .first<ApplicationCalendarEvent>();
}

/**
 * Returns secret-bearing sync records for a bounded application list. The
 * caller must authorize every application before passing its id and must not
 * serialize the returned records directly.
 */
export async function listApplicationCalendarEvents(
  applicationIds: readonly string[],
): Promise<ApplicationCalendarEvent[]> {
  const uniqueIds = Array.from(
    new Set(applicationIds.map((applicationId) => applicationId.trim())),
  ).filter(Boolean);
  if (uniqueIds.length === 0) return [];
  if (uniqueIds.length > 100) {
    throw new RangeError('At most 100 calendar events can be read at once.');
  }
  const placeholders = uniqueIds.map(() => '?').join(', ');
  const result = await getD1()
    .prepare(
      `
        SELECT ${applicationEventColumns}
        FROM application_calendar_events
        WHERE application_id IN (${placeholders})
      `,
    )
    .bind(...uniqueIds)
    .all<ApplicationCalendarEvent>();
  return result.results;
}

export type UpsertPendingApplicationCalendarEventInput = {
  applicationId: string;
  ownerMemberId: string;
  /** Stable, deterministic id reused for every retry of this application. */
  googleEventId: string;
  /** Stable request id reused when the online lesson needs Google Meet. */
  conferenceRequestId?: string | null;
  startAt: number;
  endAt: number;
  timezone?: 'Asia/Tokyo';
  /** Null means the caller observed no row; a conflict will not update one. */
  expectedUpdatedAt: number | null;
  /** Only after Google reports a failed Meet request, retry with a new id. */
  allowConferenceRequestIdRotation?: boolean;
};

/**
 * Claims the next create/update attempt. Existing provider ids are immutable,
 * so a retry cannot accidentally create a second Google event or Meet room.
 * Returns null on an identity or optimistic-concurrency conflict.
 */
export async function upsertPendingApplicationCalendarEvent(
  input: UpsertPendingApplicationCalendarEventInput,
): Promise<ApplicationCalendarEvent | null> {
  assertSchedule(input.startAt, input.endAt);
  assertExpectedUpdatedAt(input.expectedUpdatedAt);
  const now = Math.max(Date.now(), (input.expectedUpdatedAt ?? -1) + 1);
  const conferenceRequestId = input.conferenceRequestId ?? null;

  return getD1()
    .prepare(
      `
        INSERT INTO application_calendar_events (
          application_id,
          owner_member_id,
          google_event_id,
          google_event_etag,
          conference_request_id,
          meet_url_ciphertext,
          start_at,
          end_at,
          timezone,
          sync_status,
          last_error_code,
          attempt_count,
          synced_at,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, NULL, ?, NULL, ?, ?, ?, 'create_pending', NULL, 1, NULL, ?, ?)
        ON CONFLICT(application_id) DO UPDATE SET
          conference_request_id = excluded.conference_request_id,
          start_at = excluded.start_at,
          end_at = excluded.end_at,
          timezone = excluded.timezone,
          sync_status = 'create_pending',
          last_error_code = NULL,
          attempt_count = application_calendar_events.attempt_count + 1,
          synced_at = NULL,
          updated_at = excluded.updated_at
        WHERE
          application_calendar_events.owner_member_id = excluded.owner_member_id
          AND application_calendar_events.google_event_id = excluded.google_event_id
          AND (
            application_calendar_events.conference_request_id IS excluded.conference_request_id
            OR (
              ? = 1
              AND application_calendar_events.sync_status = 'failed'
              AND application_calendar_events.last_error_code = 'meet-creation-failed'
              AND application_calendar_events.meet_url_ciphertext IS NULL
              AND application_calendar_events.conference_request_id IS NOT NULL
              AND excluded.conference_request_id IS NOT NULL
            )
          )
          AND ? IS NOT NULL
          AND application_calendar_events.updated_at = ?
        RETURNING ${applicationEventColumns}
      `,
    )
    .bind(
      input.applicationId,
      input.ownerMemberId,
      input.googleEventId,
      conferenceRequestId,
      input.startAt,
      input.endAt,
      input.timezone ?? 'Asia/Tokyo',
      now,
      now,
      input.allowConferenceRequestIdRotation ? 1 : 0,
      input.expectedUpdatedAt,
      input.expectedUpdatedAt,
    )
    .first<ApplicationCalendarEvent>();
}

/**
 * Commits a successful provider response only for the attempt that produced
 * it. This prevents an older request from overwriting a newer reschedule.
 */
export async function markApplicationCalendarEventActive(input: {
  applicationId: string;
  ownerMemberId: string;
  googleEventId: string;
  expectedAttemptCount: number;
  googleEventEtag?: string | null;
  meetUrlCiphertext?: string | null;
}): Promise<boolean> {
  const meetUrlCiphertext = input.meetUrlCiphertext
    ? assertStoredCiphertext(input.meetUrlCiphertext, 'gcal-meet-v1')
    : null;
  const now = Date.now();
  const result = await getD1()
    .prepare(
      `
        UPDATE application_calendar_events
        SET
          google_event_etag = ?,
          meet_url_ciphertext = ?,
          sync_status = 'active',
          last_error_code = NULL,
          synced_at = ?,
          updated_at = CASE WHEN updated_at >= ? THEN updated_at + 1 ELSE ? END
        WHERE
          application_id = ?
          AND owner_member_id = ?
          AND google_event_id = ?
          AND sync_status = 'create_pending'
          AND attempt_count = ?
      `,
    )
    .bind(
      input.googleEventEtag ?? null,
      meetUrlCiphertext,
      now,
      now,
      now,
      input.applicationId,
      input.ownerMemberId,
      input.googleEventId,
      input.expectedAttemptCount,
    )
    .run();
  return mutationChanged(result);
}

/**
 * Records a normalized failure for only the in-flight attempt. Raw Google
 * responses and secret values must never be passed as `errorCode`.
 */
export async function markApplicationCalendarEventFailed(input: {
  applicationId: string;
  ownerMemberId: string;
  googleEventId: string;
  expectedAttemptCount: number;
  errorCode: string;
  reconnectRequired?: boolean;
}): Promise<boolean> {
  const errorCode = assertNormalizedErrorCode(input.errorCode);
  const now = Date.now();
  const result = await getD1()
    .prepare(
      `
        UPDATE application_calendar_events
        SET
          sync_status = ?,
          last_error_code = ?,
          updated_at = CASE WHEN updated_at >= ? THEN updated_at + 1 ELSE ? END
        WHERE
          application_id = ?
          AND owner_member_id = ?
          AND google_event_id = ?
          AND sync_status = 'create_pending'
          AND attempt_count = ?
      `,
    )
    .bind(
      input.reconnectRequired ? 'reconnect_required' : 'failed',
      errorCode,
      now,
      now,
      input.applicationId,
      input.ownerMemberId,
      input.googleEventId,
      input.expectedAttemptCount,
    )
    .run();
  return mutationChanged(result);
}
