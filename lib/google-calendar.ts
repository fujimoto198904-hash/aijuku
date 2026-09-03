import { env } from 'cloudflare:workers';

export const googleCalendarId = 'primary' as const;
export const googleCalendarTimeZone = 'Asia/Tokyo' as const;
export const inPersonCalendarLaunchAt = Date.parse('2026-10-01T00:00:00+09:00');

const googleAuthorizationEndpoint =
  'https://accounts.google.com/o/oauth2/v2/auth';
const googleTokenEndpoint = 'https://oauth2.googleapis.com/token';
const googleTokenRevocationEndpoint = 'https://oauth2.googleapis.com/revoke';
const googleUserInfoEndpoint =
  'https://openidconnect.googleapis.com/v1/userinfo';
const googleCalendarApiBase = 'https://www.googleapis.com/calendar/v3';
const calendarOwnedEventsScope =
  'https://www.googleapis.com/auth/calendar.events.owned';
const acceptedCalendarWriteScopes = new Set([
  calendarOwnedEventsScope,
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar',
]);
const oauthScopes = ['openid', 'email', calendarOwnedEventsScope] as const;
const encryptedTokenVersion = 'gcal-rt-v1';
const encryptedTokenAadPrefix = 'aijuku:google-calendar:refresh-token:v1:';
const encryptedMeetUrlVersion = 'gcal-meet-v1';
const encryptedMeetUrlAadPrefix = 'aijuku:google-calendar:meet-url:v1:';
const applicationMarkerKey = 'aijukuApplicationId';
const managedMarkerKey = 'aijukuManaged';
const managedMarkerValue = 'v1';
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

export type GoogleCalendarEnvironment = {
  GOOGLE_CALENDAR_CLIENT_ID?: string;
  GOOGLE_CALENDAR_CLIENT_SECRET?: string;
  GOOGLE_CALENDAR_OWNER_EMAIL?: string;
  GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY?: string;
};

export type GoogleCalendarConfig = {
  clientId: string;
  clientSecret: string;
  ownerEmail: string;
  tokenEncryptionKey: Uint8Array;
};

export type GoogleCalendarConfigurationErrorReason =
  | 'missing-client-id'
  | 'missing-client-secret'
  | 'invalid-owner-email'
  | 'invalid-encryption-key';

export class GoogleCalendarConfigurationError extends Error {
  constructor(
    public readonly publicMessage: string,
    public readonly reason: GoogleCalendarConfigurationErrorReason,
  ) {
    super(reason);
    this.name = 'GoogleCalendarConfigurationError';
  }
}

export type GoogleCalendarErrorCode =
  | 'invalid-input'
  | 'invalid-state'
  | 'oauth-exchange-failed'
  | 'oauth-invalid-grant'
  | 'owner-verification-failed'
  | 'owner-email-mismatch'
  | 'missing-calendar-scope'
  | 'token-refresh-failed'
  | 'token-revocation-failed'
  | 'invalid-encrypted-token'
  | 'invalid-encrypted-meet-url'
  | 'calendar-api-failed'
  | 'calendar-event-conflict'
  | 'meet-creation-failed';

export class GoogleCalendarError extends Error {
  constructor(
    public readonly publicMessage: string,
    public readonly code: GoogleCalendarErrorCode,
    public readonly status: number | null = null,
    public readonly retryable = false,
  ) {
    super(code);
    this.name = 'GoogleCalendarError';
  }
}

export type GoogleCalendarServiceType =
  | 'in-person-tutor'
  | 'online-tutor'
  | 'self-study';

export type GoogleCalendarScheduleResult =
  | {
      ok: true;
      startAt: number;
      endAt: number;
      startDateTime: string;
      endDateTime: string;
      durationMinutes: 50 | 60;
      timeZone: typeof googleCalendarTimeZone;
    }
  | {
      ok: false;
      reason:
        | 'invalid-start-time'
        | 'before-in-person-launch'
        | 'self-study-not-applicable';
    };

export type GoogleCalendarOAuthRequest = {
  authorizationUrl: string;
  codeVerifier: string;
  state: string;
};

export type GoogleCalendarOAuthGrant = {
  refreshToken: string;
  ownerEmail: string;
  ownerSubject: string;
  grantedScopes: string[];
};

export type GoogleCalendarAccessToken = {
  accessToken: string;
  expiresAt: number;
  grantedScopes: string[];
};

export type GoogleCalendarFetch = typeof fetch;
export type GoogleCalendarSleep = (milliseconds: number) => Promise<void>;

export type GoogleCalendarReconcileInput = {
  accessToken: string;
  applicationId: string;
  serviceType: GoogleCalendarServiceType;
  scheduledAt: number;
  conferenceRequestId?: string | null;
  fetcher?: GoogleCalendarFetch;
  sleep?: GoogleCalendarSleep;
};

export type GoogleCalendarReconcileResult = {
  eventId: string;
  eventEtag: string | null;
  eventUrl: string | null;
  meetUrl: string | null;
  meetStatus: 'not-applicable' | 'ready' | 'pending';
  conferenceRequestId: string | null;
  operation: 'created' | 'updated';
};

export type GoogleCalendarDeleteResult = 'deleted' | 'not-found';
export type GoogleCalendarRevokeResult = 'revoked' | 'already-revoked';

type JsonRecord = Record<string, unknown>;

type GoogleCalendarEvent = {
  id: string;
  etag: string | null;
  htmlLink: string | null;
  hangoutLink: string | null;
  conferenceStatus: 'success' | 'pending' | 'failure' | null;
  conferenceRequestId: string | null;
  applicationMarker: string | null;
  managedMarker: string | null;
};

type GoogleCalendarEventBody = {
  id?: string;
  summary: string;
  description: string;
  location: string;
  start: {
    dateTime: string;
    timeZone: typeof googleCalendarTimeZone;
  };
  end: {
    dateTime: string;
    timeZone: typeof googleCalendarTimeZone;
  };
  visibility: 'private';
  transparency: 'opaque';
  guestsCanInviteOthers: false;
  guestsCanModify: false;
  guestsCanSeeOtherGuests: false;
  reminders: { useDefault: true };
  extendedProperties: {
    private: Record<string, string>;
  };
  conferenceData?: {
    createRequest: {
      requestId: string;
      conferenceSolutionKey: { type: 'hangoutsMeet' };
    };
  };
};

export function parseGoogleCalendarEnvironment(
  input: GoogleCalendarEnvironment,
): GoogleCalendarConfig {
  const clientId = input.GOOGLE_CALENDAR_CLIENT_ID?.trim() ?? '';
  if (!/^[A-Za-z0-9._-]+\.apps\.googleusercontent\.com$/.test(clientId)) {
    throw new GoogleCalendarConfigurationError(
      'Googleカレンダー連携のクライアントIDを確認してください。',
      'missing-client-id',
    );
  }

  const clientSecret = input.GOOGLE_CALENDAR_CLIENT_SECRET?.trim() ?? '';
  if (clientSecret.length < 16 || clientSecret.length > 512) {
    throw new GoogleCalendarConfigurationError(
      'Googleカレンダー連携のクライアントシークレットを確認してください。',
      'missing-client-secret',
    );
  }

  const ownerEmail = normalizeEmail(
    input.GOOGLE_CALENDAR_OWNER_EMAIL?.trim() ?? '',
  );
  if (!isPlausibleEmail(ownerEmail)) {
    throw new GoogleCalendarConfigurationError(
      '予定を保存するGoogleアカウントを確認してください。',
      'invalid-owner-email',
    );
  }

  let tokenEncryptionKey: Uint8Array;
  try {
    tokenEncryptionKey = decodeAes256Key(
      input.GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY?.trim() ?? '',
    );
  } catch {
    throw new GoogleCalendarConfigurationError(
      'Googleカレンダーの認証情報を守る暗号鍵を確認してください。',
      'invalid-encryption-key',
    );
  }

  return {
    clientId,
    clientSecret,
    ownerEmail,
    tokenEncryptionKey,
  };
}

export function getGoogleCalendarConfig(
  input?: GoogleCalendarEnvironment,
): GoogleCalendarConfig {
  return parseGoogleCalendarEnvironment(
    input ?? (env as unknown as GoogleCalendarEnvironment),
  );
}

export function decodeAes256Key(value: string): Uint8Array {
  if (/^[0-9a-fA-F]{64}$/.test(value)) {
    return Uint8Array.from(value.match(/.{2}/g) ?? [], (pair) =>
      Number.parseInt(pair, 16),
    );
  }
  const decoded = base64UrlToBytes(value);
  if (!decoded || decoded.length !== 32) {
    throw new Error('Invalid AES-256 key.');
  }
  return decoded;
}

export async function buildGoogleCalendarOAuthRequest(input: {
  config: GoogleCalendarConfig;
  redirectUri: string;
  state?: string;
}): Promise<GoogleCalendarOAuthRequest> {
  const redirectUri = validateRedirectUri(input.redirectUri);
  const codeVerifier = bytesToBase64Url(secureRandomBytes(64));
  const state = input.state ?? bytesToBase64Url(secureRandomBytes(32));
  if (!isValidOAuthState(state)) {
    throw new GoogleCalendarError(
      'Google連携を安全に開始できませんでした。',
      'invalid-input',
    );
  }
  const codeChallenge = bytesToBase64Url(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', encoder.encode(codeVerifier)),
    ),
  );
  const url = new URL(googleAuthorizationEndpoint);
  url.searchParams.set('client_id', input.config.clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', oauthScopes.join(' '));
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', state);
  url.searchParams.set('login_hint', input.config.ownerEmail);
  return { authorizationUrl: url.toString(), codeVerifier, state };
}

export function googleOAuthStateMatches(
  expectedState: string,
  returnedState: string,
): boolean {
  if (!isValidOAuthState(expectedState) || !isValidOAuthState(returnedState)) {
    return false;
  }
  const left = encoder.encode(expectedState);
  const right = encoder.encode(returnedState);
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return difference === 0;
}

export async function exchangeGoogleCalendarAuthorizationCode(input: {
  config: GoogleCalendarConfig;
  code: string;
  codeVerifier: string;
  redirectUri: string;
  expectedState: string;
  returnedState: string;
  fetcher?: GoogleCalendarFetch;
}): Promise<GoogleCalendarOAuthGrant> {
  if (!googleOAuthStateMatches(input.expectedState, input.returnedState)) {
    throw new GoogleCalendarError(
      'Google連携の確認情報が一致しません。最初からやり直してください。',
      'invalid-state',
    );
  }
  if (
    !input.code.trim() ||
    input.code.length > 4_096 ||
    !isValidPkceVerifier(input.codeVerifier)
  ) {
    throw new GoogleCalendarError(
      'Google連携の認証情報を確認できませんでした。',
      'invalid-input',
    );
  }

  const redirectUri = validateRedirectUri(input.redirectUri);
  const body = new URLSearchParams({
    client_id: input.config.clientId,
    client_secret: input.config.clientSecret,
    code: input.code,
    code_verifier: input.codeVerifier,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });
  const payload = await fetchJson(
    input.fetcher ?? fetch,
    googleTokenEndpoint,
    {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    },
    {
      code: 'oauth-exchange-failed',
      publicMessage: 'Googleとの認証を完了できませんでした。',
    },
  );
  const accessToken = readNonEmptyString(payload.access_token, 8_192);
  const refreshToken = readNonEmptyString(payload.refresh_token, 8_192);
  const grantedScopes = readGrantedScopes(payload.scope);
  if (!accessToken || !refreshToken) {
    throw new GoogleCalendarError(
      'Googleから継続利用に必要な認証情報を受け取れませんでした。',
      'oauth-exchange-failed',
    );
  }
  requireCalendarWriteScope(grantedScopes);
  const owner = await verifyGoogleCalendarOwner({
    accessToken,
    expectedOwnerEmail: input.config.ownerEmail,
    fetcher: input.fetcher,
  });
  return {
    refreshToken,
    ownerEmail: owner.email,
    ownerSubject: owner.subject,
    grantedScopes,
  };
}

export async function verifyGoogleCalendarOwner(input: {
  accessToken: string;
  expectedOwnerEmail: string;
  fetcher?: GoogleCalendarFetch;
}): Promise<{ email: string; subject: string }> {
  const accessToken = requireSecretValue(input.accessToken);
  const expectedOwnerEmail = normalizeEmail(input.expectedOwnerEmail);
  if (!isPlausibleEmail(expectedOwnerEmail)) {
    throw new GoogleCalendarError(
      '予定を保存するGoogleアカウントを確認できませんでした。',
      'invalid-input',
    );
  }
  const payload = await fetchJson(
    input.fetcher ?? fetch,
    googleUserInfoEndpoint,
    {
      headers: { authorization: `Bearer ${accessToken}` },
    },
    {
      code: 'owner-verification-failed',
      publicMessage: 'Googleアカウントの本人確認を完了できませんでした。',
    },
  );
  const email = normalizeEmail(readNonEmptyString(payload.email, 320) ?? '');
  const subject = readNonEmptyString(payload.sub, 512);
  if (payload.email_verified !== true || !email || !subject) {
    throw new GoogleCalendarError(
      '確認済みのGoogleメールアドレスを取得できませんでした。',
      'owner-verification-failed',
    );
  }
  if (email !== expectedOwnerEmail) {
    throw new GoogleCalendarError(
      '指定されたオーナー以外のGoogleアカウントは連携できません。',
      'owner-email-mismatch',
      403,
    );
  }
  return { email, subject };
}

export async function refreshGoogleCalendarAccessToken(input: {
  config: GoogleCalendarConfig;
  refreshToken: string;
  fetcher?: GoogleCalendarFetch;
  now?: number;
}): Promise<GoogleCalendarAccessToken> {
  const refreshToken = requireSecretValue(input.refreshToken);
  const body = new URLSearchParams({
    client_id: input.config.clientId,
    client_secret: input.config.clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
  const payload = await fetchJson(
    input.fetcher ?? fetch,
    googleTokenEndpoint,
    {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    },
    {
      code: 'token-refresh-failed',
      publicMessage: 'Googleカレンダーへの接続を更新できませんでした。',
    },
  );
  const accessToken = readNonEmptyString(payload.access_token, 8_192);
  const expiresIn = readPositiveInteger(payload.expires_in);
  const grantedScopes = readGrantedScopes(payload.scope);
  if (!accessToken || !expiresIn) {
    throw new GoogleCalendarError(
      'Googleカレンダーへの接続を更新できませんでした。',
      'token-refresh-failed',
    );
  }
  if (grantedScopes.length > 0) requireCalendarWriteScope(grantedScopes);
  return {
    accessToken,
    expiresAt: (input.now ?? Date.now()) + expiresIn * 1_000,
    grantedScopes,
  };
}

export async function revokeGoogleCalendarGrant(input: {
  refreshToken: string;
  fetcher?: GoogleCalendarFetch;
}): Promise<GoogleCalendarRevokeResult> {
  const refreshToken = requireSecretValue(input.refreshToken);
  let response: Response;
  try {
    response = await (input.fetcher ?? fetch)(googleTokenRevocationEndpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token: refreshToken }),
      cache: 'no-store',
      redirect: 'error',
    });
  } catch {
    throw new GoogleCalendarError(
      'Googleカレンダーとの連携を解除できませんでした。',
      'token-revocation-failed',
      null,
      true,
    );
  }
  if (response.ok) return 'revoked';
  const providerCode = await readProviderErrorCode(response);
  if (
    response.status === 400 &&
    (providerCode === 'invalid_token' || providerCode === 'invalid_grant')
  ) {
    return 'already-revoked';
  }
  throw new GoogleCalendarError(
    'Googleカレンダーとの連携を解除できませんでした。',
    'token-revocation-failed',
    response.status,
    response.status === 429 || response.status >= 500,
  );
}

export async function encryptGoogleCalendarRefreshToken(input: {
  refreshToken: string;
  ownerMemberId: string;
  encryptionKey: Uint8Array;
}): Promise<string> {
  const refreshToken = requireSecretValue(input.refreshToken);
  const ownerMemberId = validateOwnerMemberId(input.ownerMemberId);
  const key = await importAesKey(input.encryptionKey, ['encrypt']);
  const iv = secureRandomBytes(12);
  const cipherText = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: toArrayBuffer(iv),
      additionalData: encoder.encode(
        `${encryptedTokenAadPrefix}${ownerMemberId}`,
      ),
      tagLength: 128,
    },
    key,
    encoder.encode(refreshToken),
  );
  return [
    encryptedTokenVersion,
    bytesToBase64Url(iv),
    bytesToBase64Url(new Uint8Array(cipherText)),
  ].join('.');
}

export async function decryptGoogleCalendarRefreshToken(input: {
  encryptedRefreshToken: string;
  ownerMemberId: string;
  encryptionKey: Uint8Array;
}): Promise<string> {
  const ownerMemberId = validateOwnerMemberId(input.ownerMemberId);
  const parts = input.encryptedRefreshToken.split('.');
  const iv = parts[1] ? base64UrlToBytes(parts[1]) : null;
  const cipherText = parts[2] ? base64UrlToBytes(parts[2]) : null;
  if (
    parts.length !== 3 ||
    parts[0] !== encryptedTokenVersion ||
    !iv ||
    iv.length !== 12 ||
    !cipherText ||
    cipherText.length < 17 ||
    cipherText.length > 16_384
  ) {
    throw invalidEncryptedTokenError();
  }
  try {
    const key = await importAesKey(input.encryptionKey, ['decrypt']);
    const plainText = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: toArrayBuffer(iv),
        additionalData: encoder.encode(
          `${encryptedTokenAadPrefix}${ownerMemberId}`,
        ),
        tagLength: 128,
      },
      key,
      toArrayBuffer(cipherText),
    );
    return requireSecretValue(decoder.decode(plainText));
  } catch {
    throw invalidEncryptedTokenError();
  }
}

export async function encryptGoogleCalendarMeetUrl(input: {
  meetUrl: string;
  applicationId: string;
  encryptionKey: Uint8Array;
}): Promise<string> {
  const applicationId = normalizeApplicationId(input.applicationId);
  const meetUrl = safeGoogleMeetUrl(input.meetUrl);
  if (!meetUrl) {
    throw new GoogleCalendarError(
      'Google MeetのURLを確認できませんでした。',
      'invalid-input',
    );
  }
  const key = await importAesKey(input.encryptionKey, ['encrypt']);
  const iv = secureRandomBytes(12);
  const cipherText = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: toArrayBuffer(iv),
      additionalData: encoder.encode(
        `${encryptedMeetUrlAadPrefix}${applicationId}`,
      ),
      tagLength: 128,
    },
    key,
    encoder.encode(meetUrl),
  );
  return [
    encryptedMeetUrlVersion,
    bytesToBase64Url(iv),
    bytesToBase64Url(new Uint8Array(cipherText)),
  ].join('.');
}

export async function decryptGoogleCalendarMeetUrl(input: {
  encryptedMeetUrl: string;
  applicationId: string;
  encryptionKey: Uint8Array;
}): Promise<string> {
  const applicationId = normalizeApplicationId(input.applicationId);
  const parts = input.encryptedMeetUrl.split('.');
  const iv = parts[1] ? base64UrlToBytes(parts[1]) : null;
  const cipherText = parts[2] ? base64UrlToBytes(parts[2]) : null;
  if (
    parts.length !== 3 ||
    parts[0] !== encryptedMeetUrlVersion ||
    !iv ||
    iv.length !== 12 ||
    !cipherText ||
    cipherText.length < 17 ||
    cipherText.length > 4_096
  ) {
    throw invalidEncryptedMeetUrlError();
  }
  try {
    const key = await importAesKey(input.encryptionKey, ['decrypt']);
    const plainText = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: toArrayBuffer(iv),
        additionalData: encoder.encode(
          `${encryptedMeetUrlAadPrefix}${applicationId}`,
        ),
        tagLength: 128,
      },
      key,
      toArrayBuffer(cipherText),
    );
    const meetUrl = safeGoogleMeetUrl(decoder.decode(plainText));
    if (!meetUrl) throw new Error('Invalid Meet URL.');
    return meetUrl;
  } catch {
    throw invalidEncryptedMeetUrlError();
  }
}

export function googleCalendarEventIdForApplication(
  applicationId: string,
): string {
  const normalized = normalizeApplicationId(applicationId);
  // UUID hex is a subset of Google's base32hex event-id alphabet (a-v, 0-9).
  return normalized.replaceAll('-', '');
}

export function googleMeetConferenceRequestIdForApplication(
  applicationId: string,
  generation = 0,
): string {
  if (!Number.isSafeInteger(generation) || generation < 0) {
    throw new GoogleCalendarError(
      'Google Meet作成用の識別情報を確認できませんでした。',
      'invalid-input',
    );
  }
  const suffix = generation === 0 ? '' : `r${generation.toString(36)}`;
  return validateConferenceRequestId(
    `meet${googleCalendarEventIdForApplication(applicationId)}${suffix}`,
  );
}

export function googleCalendarLessonDurationMinutes(
  serviceType: GoogleCalendarServiceType,
): 50 | 60 | null {
  if (serviceType === 'online-tutor') return 50;
  if (serviceType === 'in-person-tutor') return 60;
  return null;
}

export function resolveGoogleCalendarLessonSchedule(input: {
  serviceType: GoogleCalendarServiceType;
  scheduledAt: number;
}): GoogleCalendarScheduleResult {
  const durationMinutes = googleCalendarLessonDurationMinutes(
    input.serviceType,
  );
  if (durationMinutes === null) {
    return { ok: false, reason: 'self-study-not-applicable' };
  }
  if (
    !Number.isSafeInteger(input.scheduledAt) ||
    input.scheduledAt <= 0 ||
    !Number.isFinite(new Date(input.scheduledAt).getTime())
  ) {
    return { ok: false, reason: 'invalid-start-time' };
  }
  if (
    input.serviceType === 'in-person-tutor' &&
    input.scheduledAt < inPersonCalendarLaunchAt
  ) {
    return { ok: false, reason: 'before-in-person-launch' };
  }
  const endAt = input.scheduledAt + durationMinutes * 60_000;
  if (
    !Number.isSafeInteger(endAt) ||
    !Number.isFinite(new Date(endAt).getTime())
  ) {
    return { ok: false, reason: 'invalid-start-time' };
  }
  return {
    ok: true,
    startAt: input.scheduledAt,
    endAt,
    startDateTime: new Date(input.scheduledAt).toISOString(),
    endDateTime: new Date(endAt).toISOString(),
    durationMinutes,
    timeZone: googleCalendarTimeZone,
  };
}

export async function reconcileGoogleCalendarLessonEvent(
  input: GoogleCalendarReconcileInput,
): Promise<GoogleCalendarReconcileResult> {
  const accessToken = requireSecretValue(input.accessToken);
  const applicationId = normalizeApplicationId(input.applicationId);
  const eventId = googleCalendarEventIdForApplication(applicationId);
  if (input.serviceType === 'self-study') {
    throw scheduleError('self-study-not-applicable');
  }
  const serviceType = input.serviceType;
  const conferenceRequestId =
    serviceType === 'online-tutor'
      ? validateConferenceRequestId(
          input.conferenceRequestId ??
            googleMeetConferenceRequestIdForApplication(applicationId),
        )
      : null;
  const schedule = resolveGoogleCalendarLessonSchedule({
    serviceType,
    scheduledAt: input.scheduledAt,
  });
  if (!schedule.ok) {
    throw scheduleError(schedule.reason);
  }

  const fetcher = input.fetcher ?? fetch;
  const insertBody = buildGoogleCalendarEventBody({
    applicationId,
    eventId,
    serviceType,
    schedule,
    includeEventId: true,
    conferenceRequestId,
  });
  const insertResponse = await calendarFetch(
    fetcher,
    accessToken,
    eventsUrl(),
    {
      method: 'POST',
      body: JSON.stringify(insertBody),
    },
  );

  let event: GoogleCalendarEvent;
  let operation: 'created' | 'updated';
  if (insertResponse.status === 409) {
    const existing = await getManagedEvent({
      accessToken,
      applicationId,
      eventId,
      fetcher,
    });
    let updateConferenceRequestId: string | null = null;
    if (serviceType === 'online-tutor' && !existing.hangoutLink) {
      if (
        existing.conferenceStatus === 'pending' &&
        existing.conferenceRequestId &&
        existing.conferenceRequestId !== conferenceRequestId
      ) {
        throw new GoogleCalendarError(
          'Google Meetを作成中のため、新しい会議の作成を中止しました。',
          'calendar-event-conflict',
          409,
          true,
        );
      }
      if (
        existing.conferenceStatus === 'failure' &&
        existing.conferenceRequestId === conferenceRequestId
      ) {
        // Google ignores a reused requestId. The caller must persist and pass a
        // newly generated generation after a failed conference request.
        throw meetCreationError();
      }
      if (existing.conferenceStatus === 'success') {
        // A successful conference without a safe video URL is not replaced: a
        // replacement could expose a second meeting room unexpectedly.
        throw meetCreationError();
      }
      updateConferenceRequestId = conferenceRequestId;
    }
    const updateBody = buildGoogleCalendarEventBody({
      applicationId,
      eventId,
      serviceType,
      schedule,
      includeEventId: false,
      conferenceRequestId: updateConferenceRequestId,
    });
    const updateHeaders = new Headers();
    if (existing.etag) updateHeaders.set('if-match', existing.etag);
    const updateResponse = await calendarFetch(
      fetcher,
      accessToken,
      eventUrl(eventId, 'write'),
      {
        method: 'PATCH',
        headers: updateHeaders,
        body: JSON.stringify(updateBody),
      },
    );
    event = await requireCalendarEventResponse(updateResponse);
    operation = 'updated';
  } else {
    event = await requireCalendarEventResponse(insertResponse);
    operation = 'created';
  }

  requireManagedEventMarker(event, applicationId);
  if (serviceType === 'online-tutor') {
    event = await pollForMeetLink({
      event,
      accessToken,
      applicationId,
      eventId,
      fetcher,
      sleep: input.sleep ?? defaultSleep,
    });
  }
  return {
    eventId,
    eventEtag: event.etag,
    eventUrl: event.htmlLink,
    meetUrl: event.hangoutLink,
    meetStatus:
      serviceType !== 'online-tutor'
        ? 'not-applicable'
        : event.hangoutLink
          ? 'ready'
          : 'pending',
    conferenceRequestId,
    operation,
  };
}

export async function deleteGoogleCalendarLessonEvent(input: {
  accessToken: string;
  applicationId: string;
  fetcher?: GoogleCalendarFetch;
}): Promise<GoogleCalendarDeleteResult> {
  const accessToken = requireSecretValue(input.accessToken);
  const applicationId = normalizeApplicationId(input.applicationId);
  const eventId = googleCalendarEventIdForApplication(applicationId);
  const fetcher = input.fetcher ?? fetch;
  const getResponse = await calendarFetch(
    fetcher,
    accessToken,
    eventUrl(eventId),
    { method: 'GET' },
  );
  if (getResponse.status === 404 || getResponse.status === 410) {
    return 'not-found';
  }
  const event = await requireCalendarEventResponse(getResponse);
  requireManagedEventMarker(event, applicationId);
  const deleteResponse = await calendarFetch(
    fetcher,
    accessToken,
    eventUrl(eventId, 'delete'),
    {
      method: 'DELETE',
      headers: event.etag ? { 'if-match': event.etag } : undefined,
    },
  );
  if (deleteResponse.status === 404 || deleteResponse.status === 410) {
    return 'not-found';
  }
  if (!deleteResponse.ok && deleteResponse.status !== 204) {
    throw calendarApiError(
      deleteResponse.status,
      await readCalendarProviderReason(deleteResponse),
    );
  }
  return 'deleted';
}

function buildGoogleCalendarEventBody(input: {
  applicationId: string;
  eventId: string;
  serviceType: Exclude<GoogleCalendarServiceType, 'self-study'>;
  schedule: Extract<GoogleCalendarScheduleResult, { ok: true }>;
  includeEventId: boolean;
  conferenceRequestId: string | null;
}): GoogleCalendarEventBody {
  const online = input.serviceType === 'online-tutor';
  const body: GoogleCalendarEventBody = {
    ...(input.includeEventId ? { id: input.eventId } : {}),
    summary: online ? '藤本実学塾｜オンライン授業' : '藤本実学塾｜対面授業',
    description:
      '藤本実学塾の申込確定により自動作成された予定です。\n変更や取消は申込管理から行ってください。',
    location: online
      ? 'Google Meet'
      : '東京23区内（会場は確定済みの申込内容を確認）',
    start: {
      dateTime: input.schedule.startDateTime,
      timeZone: googleCalendarTimeZone,
    },
    end: {
      dateTime: input.schedule.endDateTime,
      timeZone: googleCalendarTimeZone,
    },
    visibility: 'private',
    transparency: 'opaque',
    guestsCanInviteOthers: false,
    guestsCanModify: false,
    guestsCanSeeOtherGuests: false,
    reminders: { useDefault: true },
    extendedProperties: {
      private: {
        [applicationMarkerKey]: input.applicationId,
        [managedMarkerKey]: managedMarkerValue,
      },
    },
  };
  if (input.conferenceRequestId) {
    body.conferenceData = {
      createRequest: {
        requestId: input.conferenceRequestId,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
  }
  return body;
}

function eventsUrl(): string {
  const url = new URL(
    `${googleCalendarApiBase}/calendars/${encodeURIComponent(googleCalendarId)}/events`,
  );
  url.searchParams.set('conferenceDataVersion', '1');
  url.searchParams.set('sendUpdates', 'none');
  return url.toString();
}

function eventUrl(
  eventId: string,
  operation: 'get' | 'write' | 'delete' = 'get',
): string {
  const url = new URL(
    `${googleCalendarApiBase}/calendars/${encodeURIComponent(googleCalendarId)}/events/${encodeURIComponent(eventId)}`,
  );
  if (operation === 'write') {
    url.searchParams.set('conferenceDataVersion', '1');
  }
  if (operation === 'write' || operation === 'delete') {
    url.searchParams.set('sendUpdates', 'none');
  }
  return url.toString();
}

async function getManagedEvent(input: {
  accessToken: string;
  applicationId: string;
  eventId: string;
  fetcher: GoogleCalendarFetch;
}): Promise<GoogleCalendarEvent> {
  const response = await calendarFetch(
    input.fetcher,
    input.accessToken,
    eventUrl(input.eventId),
    { method: 'GET' },
  );
  if (response.status === 404 || response.status === 410) {
    throw new GoogleCalendarError(
      '同じ申込IDの予定を安全に確認できませんでした。',
      'calendar-event-conflict',
      409,
    );
  }
  const event = await requireCalendarEventResponse(response);
  requireManagedEventMarker(event, input.applicationId);
  return event;
}

async function pollForMeetLink(input: {
  event: GoogleCalendarEvent;
  accessToken: string;
  applicationId: string;
  eventId: string;
  fetcher: GoogleCalendarFetch;
  sleep: GoogleCalendarSleep;
}): Promise<GoogleCalendarEvent> {
  let event = input.event;
  if (event.hangoutLink) return event;
  if (event.conferenceStatus === 'failure') throw meetCreationError();
  for (const delay of [250, 500, 1_000, 2_000]) {
    await input.sleep(delay);
    event = await getManagedEvent(input);
    if (event.hangoutLink) return event;
    if (event.conferenceStatus === 'failure') throw meetCreationError();
  }
  return event;
}

async function calendarFetch(
  fetcher: GoogleCalendarFetch,
  accessToken: string,
  url: string,
  init: RequestInit,
): Promise<Response> {
  try {
    const headers = new Headers(init.headers);
    headers.set('authorization', `Bearer ${accessToken}`);
    headers.set('accept', 'application/json');
    if (init.body) headers.set('content-type', 'application/json');
    return await fetcher(url, {
      ...init,
      headers,
      cache: 'no-store',
      redirect: 'error',
    });
  } catch {
    throw new GoogleCalendarError(
      'Googleカレンダーへ接続できませんでした。少し待って再度お試しください。',
      'calendar-api-failed',
      null,
      true,
    );
  }
}

async function requireCalendarEventResponse(
  response: Response,
): Promise<GoogleCalendarEvent> {
  if (!response.ok) {
    throw calendarApiError(
      response.status,
      await readCalendarProviderReason(response),
    );
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw calendarApiError(response.status);
  }
  if (!isJsonRecord(payload)) throw calendarApiError(response.status);
  const id = readNonEmptyString(payload.id, 1_024);
  if (!id) throw calendarApiError(response.status);

  const conferenceData = asRecord(payload.conferenceData);
  const createRequest = asRecord(conferenceData?.createRequest);
  const statusRecord = asRecord(createRequest?.status);
  const rawConferenceStatus = readNonEmptyString(statusRecord?.statusCode, 32);
  const conferenceStatus =
    rawConferenceStatus === 'success' ||
    rawConferenceStatus === 'pending' ||
    rawConferenceStatus === 'failure'
      ? rawConferenceStatus
      : null;
  const privateProperties = asRecord(
    asRecord(payload.extendedProperties)?.private,
  );
  const conferenceEntryPoints = Array.isArray(conferenceData?.entryPoints)
    ? conferenceData.entryPoints
    : [];
  const videoEntryPoint = conferenceEntryPoints.find((entryPoint) => {
    const record = asRecord(entryPoint);
    return record?.entryPointType === 'video';
  });
  const videoEntryPointUrl = safeGoogleMeetUrl(asRecord(videoEntryPoint)?.uri);
  return {
    id,
    etag: readNonEmptyString(payload.etag, 512),
    htmlLink: safeGoogleCalendarUrl(payload.htmlLink),
    hangoutLink: safeGoogleMeetUrl(payload.hangoutLink) ?? videoEntryPointUrl,
    conferenceStatus,
    conferenceRequestId:
      readNonEmptyString(createRequest?.requestId, 128) ?? null,
    applicationMarker:
      readNonEmptyString(privateProperties?.[applicationMarkerKey], 80) ?? null,
    managedMarker:
      readNonEmptyString(privateProperties?.[managedMarkerKey], 16) ?? null,
  };
}

function requireManagedEventMarker(
  event: GoogleCalendarEvent,
  applicationId: string,
): void {
  if (
    event.id !== googleCalendarEventIdForApplication(applicationId) ||
    event.applicationMarker !== applicationId ||
    event.managedMarker !== managedMarkerValue
  ) {
    throw new GoogleCalendarError(
      '同じIDの別の予定があるため、自動更新を中止しました。',
      'calendar-event-conflict',
      409,
    );
  }
}

async function fetchJson(
  fetcher: GoogleCalendarFetch,
  url: string,
  init: RequestInit,
  failure: { code: GoogleCalendarErrorCode; publicMessage: string },
): Promise<JsonRecord> {
  let response: Response;
  try {
    response = await fetcher(url, {
      ...init,
      cache: 'no-store',
      redirect: 'error',
    });
  } catch {
    throw new GoogleCalendarError(
      failure.publicMessage,
      failure.code,
      null,
      true,
    );
  }
  if (!response.ok) {
    const providerCode = await readProviderErrorCode(response);
    if (providerCode === 'invalid_grant') {
      throw new GoogleCalendarError(
        'Googleカレンダーへの接続が切れています。オーナーアカウントで再連携してください。',
        'oauth-invalid-grant',
        response.status,
      );
    }
    throw new GoogleCalendarError(
      failure.publicMessage,
      failure.code,
      response.status,
      response.status === 429 || response.status >= 500,
    );
  }
  try {
    const payload: unknown = await response.json();
    if (isJsonRecord(payload)) return payload;
  } catch {
    // The caller receives a fixed message; raw provider output is never exposed.
  }
  throw new GoogleCalendarError(
    failure.publicMessage,
    failure.code,
    response.status,
  );
}

async function readProviderErrorCode(
  response: Response,
): Promise<string | null> {
  try {
    const payload: unknown = await response.json();
    if (!isJsonRecord(payload)) return null;
    const code = readNonEmptyString(payload.error, 64);
    return code && /^[a-z0-9_]+$/.test(code) ? code : null;
  } catch {
    return null;
  }
}

async function readCalendarProviderReason(
  response: Response,
): Promise<string | null> {
  try {
    const payload: unknown = await response.json();
    const error = asRecord(asRecord(payload)?.error);
    const errors = Array.isArray(error?.errors) ? error.errors : [];
    const firstError = asRecord(errors[0]);
    const reason =
      readNonEmptyString(firstError?.reason, 64) ??
      readNonEmptyString(error?.status, 64);
    return reason && /^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(reason)
      ? reason
      : null;
  } catch {
    return null;
  }
}

function calendarApiError(
  status: number,
  providerReason: string | null = null,
): GoogleCalendarError {
  if (status === 412) {
    return new GoogleCalendarError(
      'Googleカレンダー側で予定が更新されたため、自動更新を中止しました。',
      'calendar-event-conflict',
      status,
      true,
    );
  }
  if (
    status === 403 &&
    (providerReason === 'insufficientPermissions' ||
      providerReason === 'PERMISSION_DENIED')
  ) {
    return new GoogleCalendarError(
      'Googleカレンダーに予定を保存する権限がありません。再連携してください。',
      'missing-calendar-scope',
      status,
    );
  }
  const retryableProviderReason =
    providerReason === 'rateLimitExceeded' ||
    providerReason === 'userRateLimitExceeded' ||
    providerReason === 'quotaExceeded' ||
    providerReason === 'backendError' ||
    providerReason === 'RESOURCE_EXHAUSTED' ||
    providerReason === 'UNAVAILABLE';
  return new GoogleCalendarError(
    status === 401 || status === 403
      ? 'Googleカレンダーとの接続を確認してください。'
      : '予定をGoogleカレンダーに保存できませんでした。',
    'calendar-api-failed',
    status,
    status === 408 ||
      status === 425 ||
      status === 429 ||
      (status >= 200 && status < 300) ||
      status >= 500 ||
      retryableProviderReason,
  );
}

function meetCreationError(): GoogleCalendarError {
  return new GoogleCalendarError(
    'Google Meetを作成できませんでした。予定を再同期してください。',
    'meet-creation-failed',
    null,
    true,
  );
}

function scheduleError(
  reason: Extract<GoogleCalendarScheduleResult, { ok: false }>['reason'],
): GoogleCalendarError {
  if (reason === 'before-in-person-launch') {
    return new GoogleCalendarError(
      '対面授業は2026年10月1日以降の日時を指定してください。',
      'invalid-input',
    );
  }
  if (reason === 'self-study-not-applicable') {
    return new GoogleCalendarError(
      '対面・教科書自習式は、1回ごとのGoogleカレンダー予定の対象外です。',
      'invalid-input',
    );
  }
  return new GoogleCalendarError(
    '授業の実施日時を確認できませんでした。',
    'invalid-input',
  );
}

function normalizeApplicationId(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
      normalized,
    )
  ) {
    throw new GoogleCalendarError(
      '申込IDを確認できませんでした。',
      'invalid-input',
    );
  }
  return normalized;
}

function validateRedirectUri(value: string): string {
  try {
    const url = new URL(value);
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (
      (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) ||
      url.username ||
      url.password ||
      url.hash
    ) {
      throw new Error('Invalid redirect URI.');
    }
    return url.toString();
  } catch {
    throw new GoogleCalendarError(
      'Google連携の戻り先を確認できませんでした。',
      'invalid-input',
    );
  }
}

function validateOwnerMemberId(value: string): string {
  const normalized = value.trim();
  const hasControlCharacter = Array.from(normalized).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint < 32 || codePoint === 127;
  });
  if (normalized.length < 1 || normalized.length > 256 || hasControlCharacter) {
    throw new GoogleCalendarError(
      'オーナーの認証情報を確認できませんでした。',
      'invalid-input',
    );
  }
  return normalized;
}

function validateConferenceRequestId(value: string): string {
  const normalized = value.trim();
  if (
    normalized.length < 5 ||
    normalized.length > 128 ||
    !/^[A-Za-z0-9._~-]+$/.test(normalized)
  ) {
    throw new GoogleCalendarError(
      'Google Meet作成用の識別情報を確認できませんでした。',
      'invalid-input',
    );
  }
  return normalized;
}

function normalizeEmail(value: string): string {
  return value.normalize('NFKC').toLowerCase();
}

function isPlausibleEmail(value: string): boolean {
  return (
    value.length >= 3 &&
    value.length <= 320 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}

function isValidOAuthState(value: string): boolean {
  return (
    value.length >= 32 &&
    value.length <= 256 &&
    /^[A-Za-z0-9._~-]+$/.test(value)
  );
}

function isValidPkceVerifier(value: string): boolean {
  return (
    value.length >= 43 &&
    value.length <= 128 &&
    /^[A-Za-z0-9._~-]+$/.test(value)
  );
}

function requireSecretValue(value: string): string {
  const normalized = value.trim();
  if (normalized.length < 1 || normalized.length > 8_192) {
    throw new GoogleCalendarError(
      'Googleカレンダーの認証情報を確認できませんでした。',
      'invalid-input',
    );
  }
  return normalized;
}

function requireCalendarWriteScope(scopes: string[]): void {
  if (!scopes.some((scope) => acceptedCalendarWriteScopes.has(scope))) {
    throw new GoogleCalendarError(
      'Googleカレンダーに予定を保存する権限がありません。',
      'missing-calendar-scope',
      403,
    );
  }
}

function readGrantedScopes(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  return Array.from(
    new Set(
      value
        .split(/\s+/)
        .map((scope) => scope.trim())
        .filter(Boolean),
    ),
  );
}

function readNonEmptyString(
  value: unknown,
  maximumLength: number,
): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized && normalized.length <= maximumLength ? normalized : null;
}

function readPositiveInteger(value: unknown): number | null {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function asRecord(value: unknown): JsonRecord | null {
  return isJsonRecord(value) ? value : null;
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safeGoogleMeetUrl(value: unknown): string | null {
  return safeHttpsUrl(value, new Set(['meet.google.com']));
}

function safeGoogleCalendarUrl(value: unknown): string | null {
  return safeHttpsUrl(
    value,
    new Set(['calendar.google.com', 'www.google.com']),
  );
}

function safeHttpsUrl(value: unknown, hostnames: Set<string>): string | null {
  if (typeof value !== 'string' || value.length > 2_048) return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      !hostnames.has(url.hostname) ||
      url.username ||
      url.password
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlToBytes(value: string): Uint8Array | null {
  if (!value || !/^[A-Za-z0-9+/_-]+={0,2}$/.test(value)) return null;
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const binary = atob(padded);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

function secureRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return Uint8Array.from(bytes).buffer;
}

async function importAesKey(
  keyBytes: Uint8Array,
  usages: KeyUsage[],
): Promise<CryptoKey> {
  if (keyBytes.length !== 32) throw invalidEncryptedTokenError();
  return crypto.subtle.importKey(
    'raw',
    toArrayBuffer(keyBytes),
    { name: 'AES-GCM', length: 256 },
    false,
    usages,
  );
}

function invalidEncryptedTokenError(): GoogleCalendarError {
  return new GoogleCalendarError(
    'Googleカレンダーの保存済み認証情報を読み込めませんでした。',
    'invalid-encrypted-token',
  );
}

function invalidEncryptedMeetUrlError(): GoogleCalendarError {
  return new GoogleCalendarError(
    'Google Meetの保存済みURLを読み込めませんでした。',
    'invalid-encrypted-meet-url',
  );
}

async function defaultSleep(milliseconds: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}
