import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { transform } from 'esbuild';

type GoogleCalendarModule = typeof import('../lib/google-calendar');

const applicationId = '123e4567-e89b-42d3-a456-426614174000';
const otherApplicationId = '223e4567-e89b-42d3-a456-426614174000';
const calendarScope = 'https://www.googleapis.com/auth/calendar.events.owned';
const ownerMemberId = 'owner-member-001';
const ownerEmail = 'owner@example.com';
const encryptionKeyHex = '01'.repeat(32);
const expectedMeetUrl = 'https://meet.google.com/abc-defg-hij';

type CalendarEventRequestBody = {
  id?: string;
  attendees?: unknown;
  description: string;
  visibility: string;
  guestsCanInviteOthers: boolean;
  guestsCanModify: boolean;
  guestsCanSeeOtherGuests: boolean;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  conferenceData: {
    createRequest: {
      requestId: string;
      conferenceSolutionKey: { type: string };
    };
  };
  extendedProperties: {
    private: Record<string, string>;
  };
};

/**
 * Node cannot resolve Cloudflare's `cloudflare:workers` runtime module. This
 * test-only loader replaces that one import with an empty environment and then
 * evaluates the same implementation source. All exported production logic is
 * otherwise exercised unchanged.
 */
async function loadGoogleCalendarModule(): Promise<GoogleCalendarModule> {
  const sourceUrl = new URL('../lib/google-calendar.ts', import.meta.url);
  const source = await readFile(sourceUrl, 'utf8');
  const cloudflareImport =
    /import\s+\{\s*env\s*\}\s+from\s+['"]cloudflare:workers['"];?/;
  assert.match(
    source,
    cloudflareImport,
    'the test loader must replace exactly the Cloudflare environment import',
  );
  const nodeCompatibleSource = source.replace(
    cloudflareImport,
    'const env: Record<string, unknown> = {};',
  );
  assert.doesNotMatch(
    nodeCompatibleSource,
    /cloudflare:workers/,
    'no Cloudflare runtime import may remain in the Node test copy',
  );
  const transformed = await transform(nodeCompatibleSource, {
    format: 'esm',
    loader: 'ts',
    sourcefile: sourceUrl.pathname,
    target: 'node22',
  });
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(
    transformed.code,
  ).toString('base64')}`;
  return (await import(moduleUrl)) as GoogleCalendarModule;
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function calendarEventRequestBody(init: RequestInit): CalendarEventRequestBody {
  if (typeof init.body !== 'string') {
    assert.fail('expected a JSON string request body');
  }
  const parsed: unknown = JSON.parse(init.body);
  assert.ok(
    typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed),
    'expected a JSON object request body',
  );
  return parsed as CalendarEventRequestBody;
}

function eventPayload(
  calendar: GoogleCalendarModule,
  input: {
    applicationId?: string;
    hangoutLink?: string | null;
    videoEntryPointUrl?: string | null;
    conferenceStatus?: 'success' | 'pending' | 'failure' | null;
    conferenceRequestId?: string | null;
    etag?: string | null;
    managedMarker?: string;
  } = {},
): Record<string, unknown> {
  const eventApplicationId = input.applicationId ?? applicationId;
  const createRequest: Record<string, unknown> = {};
  if (input.conferenceRequestId) {
    createRequest.requestId = input.conferenceRequestId;
  }
  if (input.conferenceStatus) {
    createRequest.status = { statusCode: input.conferenceStatus };
  }
  const conferenceData: Record<string, unknown> = {};
  if (Object.keys(createRequest).length > 0) {
    conferenceData.createRequest = createRequest;
  }
  if (input.videoEntryPointUrl) {
    conferenceData.entryPoints = [
      { entryPointType: 'video', uri: input.videoEntryPointUrl },
    ];
  }
  return {
    id: calendar.googleCalendarEventIdForApplication(eventApplicationId),
    ...(input.etag === null ? {} : { etag: input.etag ?? '"etag-default"' }),
    htmlLink: 'https://calendar.google.com/calendar/event?eid=test-event',
    ...(input.hangoutLink ? { hangoutLink: input.hangoutLink } : {}),
    ...(Object.keys(conferenceData).length > 0 ? { conferenceData } : {}),
    extendedProperties: {
      private: {
        aijukuApplicationId: eventApplicationId,
        aijukuManaged: input.managedMarker ?? 'v1',
      },
    },
  };
}

async function expectGoogleCalendarError(
  calendar: GoogleCalendarModule,
  action: () => unknown,
  expected: {
    code: InstanceType<typeof calendar.GoogleCalendarError>['code'];
    status?: number | null;
    retryable?: boolean;
    publicMessage?: RegExp;
    mustNotContain?: string;
  },
): Promise<InstanceType<typeof calendar.GoogleCalendarError>> {
  try {
    await action();
  } catch (error) {
    assert.ok(
      error instanceof calendar.GoogleCalendarError,
      'expected a normalized GoogleCalendarError',
    );
    assert.equal(error.code, expected.code);
    if ('status' in expected) assert.equal(error.status, expected.status);
    if (expected.retryable !== undefined) {
      assert.equal(error.retryable, expected.retryable);
    }
    if (expected.publicMessage) {
      assert.match(error.publicMessage, expected.publicMessage);
    }
    if (expected.mustNotContain) {
      assert.doesNotMatch(
        `${error.message}\n${error.publicMessage}\n${JSON.stringify(error)}`,
        new RegExp(
          expected.mustNotContain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
    }
    return error;
  }
  assert.fail(`expected GoogleCalendarError(${expected.code})`);
}

const calendar = await loadGoogleCalendarModule();

// Environment parsing is strict, normalizes the owner, and accepts only AES-256.
const config = calendar.parseGoogleCalendarEnvironment({
  GOOGLE_CALENDAR_CLIENT_ID: 'calendar-client.apps.googleusercontent.com',
  GOOGLE_CALENDAR_CLIENT_SECRET: 'calendar-client-secret-1234567890',
  GOOGLE_CALENDAR_OWNER_EMAIL: ' Owner@Example.COM ',
  GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY: encryptionKeyHex,
});
assert.equal(config.ownerEmail, ownerEmail);
assert.equal(config.tokenEncryptionKey.byteLength, 32);
assert.deepEqual(
  calendar.decodeAes256Key(Buffer.alloc(32, 7).toString('base64url')),
  new Uint8Array(32).fill(7),
);
for (const [environment, expectedReason] of [
  [
    {
      GOOGLE_CALENDAR_CLIENT_SECRET: 'calendar-client-secret-1234567890',
      GOOGLE_CALENDAR_OWNER_EMAIL: ownerEmail,
      GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY: encryptionKeyHex,
    },
    'missing-client-id',
  ],
  [
    {
      GOOGLE_CALENDAR_CLIENT_ID: 'calendar-client.apps.googleusercontent.com',
      GOOGLE_CALENDAR_CLIENT_SECRET: 'short',
      GOOGLE_CALENDAR_OWNER_EMAIL: ownerEmail,
      GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY: encryptionKeyHex,
    },
    'missing-client-secret',
  ],
  [
    {
      GOOGLE_CALENDAR_CLIENT_ID: 'calendar-client.apps.googleusercontent.com',
      GOOGLE_CALENDAR_CLIENT_SECRET: 'calendar-client-secret-1234567890',
      GOOGLE_CALENDAR_OWNER_EMAIL: 'not-an-email',
      GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY: encryptionKeyHex,
    },
    'invalid-owner-email',
  ],
  [
    {
      GOOGLE_CALENDAR_CLIENT_ID: 'calendar-client.apps.googleusercontent.com',
      GOOGLE_CALENDAR_CLIENT_SECRET: 'calendar-client-secret-1234567890',
      GOOGLE_CALENDAR_OWNER_EMAIL: ownerEmail,
      GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY: 'too-short',
    },
    'invalid-encryption-key',
  ],
] as const) {
  assert.throws(
    () => calendar.parseGoogleCalendarEnvironment(environment),
    (error: unknown) =>
      error instanceof calendar.GoogleCalendarConfigurationError &&
      error.reason === expectedReason,
  );
}
// OAuth starts with offline access, PKCE, the narrow owned-events scope, and owner hint.
const oauthState = 'state_'.padEnd(32, 'x');
const oauthRequest = await calendar.buildGoogleCalendarOAuthRequest({
  config,
  redirectUri: 'https://example.com/api/admin/google-calendar/callback',
  state: oauthState,
});
const authorizationUrl = new URL(oauthRequest.authorizationUrl);
assert.equal(authorizationUrl.hostname, 'accounts.google.com');
assert.equal(authorizationUrl.searchParams.get('access_type'), 'offline');
assert.equal(authorizationUrl.searchParams.get('prompt'), 'consent');
assert.equal(
  authorizationUrl.searchParams.has('include_granted_scopes'),
  false,
);
assert.equal(authorizationUrl.searchParams.get('login_hint'), ownerEmail);
assert.equal(authorizationUrl.searchParams.get('state'), oauthState);
assert.equal(
  authorizationUrl.searchParams.get('code_challenge_method'),
  'S256',
);
assert.match(
  authorizationUrl.searchParams.get('scope') ?? '',
  new RegExp(calendarScope.replaceAll('.', '\\.')),
);
assert.match(oauthRequest.codeVerifier, /^[A-Za-z0-9._~-]{43,128}$/);

// AES-GCM round trips while AAD binds each secret to its owner/application.
const encryptedRefreshToken = await calendar.encryptGoogleCalendarRefreshToken({
  refreshToken: 'refresh-token-only-for-tests',
  ownerMemberId,
  encryptionKey: config.tokenEncryptionKey,
});
assert.doesNotMatch(encryptedRefreshToken, /refresh-token-only-for-tests/);
assert.equal(
  await calendar.decryptGoogleCalendarRefreshToken({
    encryptedRefreshToken,
    ownerMemberId,
    encryptionKey: config.tokenEncryptionKey,
  }),
  'refresh-token-only-for-tests',
);
await expectGoogleCalendarError(
  calendar,
  () =>
    calendar.decryptGoogleCalendarRefreshToken({
      encryptedRefreshToken,
      ownerMemberId: 'different-owner',
      encryptionKey: config.tokenEncryptionKey,
    }),
  { code: 'invalid-encrypted-token' },
);

const encryptedMeetUrl = await calendar.encryptGoogleCalendarMeetUrl({
  meetUrl: expectedMeetUrl,
  applicationId,
  encryptionKey: config.tokenEncryptionKey,
});
assert.doesNotMatch(encryptedMeetUrl, /meet\.google\.com/);
assert.equal(
  await calendar.decryptGoogleCalendarMeetUrl({
    encryptedMeetUrl,
    applicationId,
    encryptionKey: config.tokenEncryptionKey,
  }),
  expectedMeetUrl,
);
await expectGoogleCalendarError(
  calendar,
  () =>
    calendar.decryptGoogleCalendarMeetUrl({
      encryptedMeetUrl,
      applicationId: otherApplicationId,
      encryptionKey: config.tokenEncryptionKey,
    }),
  { code: 'invalid-encrypted-meet-url' },
);
await expectGoogleCalendarError(
  calendar,
  () =>
    calendar.encryptGoogleCalendarMeetUrl({
      meetUrl: 'https://evil.example/steal',
      applicationId,
      encryptionKey: config.tokenEncryptionKey,
    }),
  { code: 'invalid-input' },
);

// Idempotency IDs are deterministic and remain valid for retries.
const expectedEventId = '123e4567e89b42d3a456426614174000';
assert.equal(
  calendar.googleCalendarEventIdForApplication(applicationId),
  expectedEventId,
);
assert.equal(
  calendar.googleCalendarEventIdForApplication(applicationId.toUpperCase()),
  expectedEventId,
);
assert.equal(
  calendar.googleMeetConferenceRequestIdForApplication(applicationId),
  `meet${expectedEventId}`,
);
assert.equal(
  calendar.googleMeetConferenceRequestIdForApplication(applicationId, 1),
  `meet${expectedEventId}r1`,
);
assert.notEqual(
  calendar.googleMeetConferenceRequestIdForApplication(applicationId, 2),
  calendar.googleMeetConferenceRequestIdForApplication(applicationId, 1),
  'a failed Meet request must be retryable with a new deterministic generation',
);
assert.throws(
  () => calendar.googleMeetConferenceRequestIdForApplication(applicationId, -1),
  (error: unknown) =>
    error instanceof calendar.GoogleCalendarError &&
    error.code === 'invalid-input',
);
assert.throws(
  () => calendar.googleCalendarEventIdForApplication('not-an-application-id'),
  (error: unknown) =>
    error instanceof calendar.GoogleCalendarError &&
    error.code === 'invalid-input',
);

// Service durations, Tokyo timezone, launch boundary, and self-study exclusion.
assert.equal(calendar.googleCalendarLessonDurationMinutes('online-tutor'), 50);
assert.equal(
  calendar.googleCalendarLessonDurationMinutes('in-person-tutor'),
  60,
);
assert.equal(calendar.googleCalendarLessonDurationMinutes('self-study'), null);
const launchAt = Date.parse('2026-10-01T00:00:00+09:00');
assert.equal(calendar.inPersonCalendarLaunchAt, launchAt);
assert.deepEqual(
  calendar.resolveGoogleCalendarLessonSchedule({
    serviceType: 'in-person-tutor',
    scheduledAt: launchAt - 1,
  }),
  { ok: false, reason: 'before-in-person-launch' },
);
const launchSchedule = calendar.resolveGoogleCalendarLessonSchedule({
  serviceType: 'in-person-tutor',
  scheduledAt: launchAt,
});
assert.equal(launchSchedule.ok, true);
if (launchSchedule.ok) {
  assert.equal(launchSchedule.durationMinutes, 60);
  assert.equal(launchSchedule.endAt - launchSchedule.startAt, 60 * 60_000);
  assert.equal(launchSchedule.timeZone, 'Asia/Tokyo');
}
const onlineSchedule = calendar.resolveGoogleCalendarLessonSchedule({
  serviceType: 'online-tutor',
  scheduledAt: Date.parse('2026-09-20T13:00:00+09:00'),
});
assert.equal(onlineSchedule.ok, true);
if (onlineSchedule.ok) {
  assert.equal(onlineSchedule.endAt - onlineSchedule.startAt, 50 * 60_000);
}
assert.deepEqual(
  calendar.resolveGoogleCalendarLessonSchedule({
    serviceType: 'self-study',
    scheduledAt: launchAt,
  }),
  { ok: false, reason: 'self-study-not-applicable' },
);
let selfStudyFetchCount = 0;
await expectGoogleCalendarError(
  calendar,
  () =>
    calendar.reconcileGoogleCalendarLessonEvent({
      accessToken: 'test-access-token',
      applicationId,
      serviceType: 'self-study',
      scheduledAt: launchAt,
      fetcher: async () => {
        selfStudyFetchCount += 1;
        return jsonResponse({});
      },
    }),
  { code: 'invalid-input', publicMessage: /対象外/ },
);
assert.equal(selfStudyFetchCount, 0, 'self-study must never call Google');

// OAuth code exchange verifies the exact, verified owner account and scope.
const verifier = 'v'.repeat(64);
const oauthFetchCalls: string[] = [];
const oauthFetcher: typeof fetch = async (input, init) => {
  const url = requestUrl(input);
  oauthFetchCalls.push(url);
  if (url === 'https://oauth2.googleapis.com/token') {
    assert.equal(init?.method, 'POST');
    assert.ok(init?.body instanceof URLSearchParams);
    assert.equal(init.body.get('code_verifier'), verifier);
    return jsonResponse({
      access_token: 'oauth-access-token',
      refresh_token: 'oauth-refresh-token',
      scope: `openid email ${calendarScope}`,
    });
  }
  assert.equal(url, 'https://openidconnect.googleapis.com/v1/userinfo');
  assert.equal(
    new Headers(init?.headers).get('authorization'),
    'Bearer oauth-access-token',
  );
  return jsonResponse({
    email: ownerEmail,
    email_verified: true,
    sub: 'google-subject-001',
  });
};
const oauthGrant = await calendar.exchangeGoogleCalendarAuthorizationCode({
  config,
  code: 'oauth-code',
  codeVerifier: verifier,
  redirectUri: 'https://example.com/api/admin/google-calendar/callback',
  expectedState: oauthState,
  returnedState: oauthState,
  fetcher: oauthFetcher,
});
assert.deepEqual(oauthFetchCalls, [
  'https://oauth2.googleapis.com/token',
  'https://openidconnect.googleapis.com/v1/userinfo',
]);
assert.equal(oauthGrant.ownerEmail, ownerEmail);
assert.equal(oauthGrant.ownerSubject, 'google-subject-001');
assert.equal(oauthGrant.refreshToken, 'oauth-refresh-token');
assert.ok(oauthGrant.grantedScopes.includes(calendarScope));

await expectGoogleCalendarError(
  calendar,
  () =>
    calendar.verifyGoogleCalendarOwner({
      accessToken: 'oauth-access-token',
      expectedOwnerEmail: ownerEmail,
      fetcher: async () =>
        jsonResponse({
          email: 'different-owner@example.com',
          email_verified: true,
          sub: 'different-subject',
        }),
    }),
  { code: 'owner-email-mismatch', status: 403 },
);
await expectGoogleCalendarError(
  calendar,
  () =>
    calendar.exchangeGoogleCalendarAuthorizationCode({
      config,
      code: 'oauth-code',
      codeVerifier: verifier,
      redirectUri: 'https://example.com/api/admin/google-calendar/callback',
      expectedState: oauthState,
      returnedState: oauthState,
      fetcher: async () =>
        jsonResponse({
          access_token: 'oauth-access-token',
          refresh_token: 'oauth-refresh-token',
          scope: 'openid email',
        }),
    }),
  { code: 'missing-calendar-scope', status: 403 },
);
const providerSecret = 'provider-debug-secret-98765';
await expectGoogleCalendarError(
  calendar,
  () =>
    calendar.exchangeGoogleCalendarAuthorizationCode({
      config,
      code: 'oauth-code',
      codeVerifier: verifier,
      redirectUri: 'https://example.com/api/admin/google-calendar/callback',
      expectedState: oauthState,
      returnedState: oauthState,
      fetcher: async () =>
        jsonResponse(
          { error: 'server_error', error_description: providerSecret },
          500,
        ),
    }),
  {
    code: 'oauth-exchange-failed',
    status: 500,
    retryable: true,
    publicMessage: /認証を完了できませんでした/,
    mustNotContain: providerSecret,
  },
);

// A new online lesson is inserted only into `primary`, with no attendees.
const insertCalls: Array<{ url: string; init: RequestInit }> = [];
const insertFetcher: typeof fetch = async (input, init = {}) => {
  insertCalls.push({ url: requestUrl(input), init });
  return jsonResponse(
    eventPayload(calendar, {
      videoEntryPointUrl: expectedMeetUrl,
      conferenceStatus: 'success',
      conferenceRequestId:
        calendar.googleMeetConferenceRequestIdForApplication(applicationId),
      etag: '"etag-created"',
    }),
  );
};
const scheduledAt = Date.parse('2026-10-15T19:00:00+09:00');
const inserted = await calendar.reconcileGoogleCalendarLessonEvent({
  accessToken: 'calendar-access-token',
  applicationId,
  serviceType: 'online-tutor',
  scheduledAt,
  fetcher: insertFetcher,
  sleep: async () => undefined,
});
assert.equal(inserted.operation, 'created');
assert.equal(inserted.meetStatus, 'ready');
assert.equal(inserted.meetUrl, expectedMeetUrl);
assert.equal(inserted.eventEtag, '"etag-created"');
assert.equal(insertCalls.length, 1);
const insertUrl = new URL(insertCalls[0].url);
assert.equal(insertUrl.pathname, '/calendar/v3/calendars/primary/events');
assert.equal(insertUrl.searchParams.get('conferenceDataVersion'), '1');
assert.equal(insertUrl.searchParams.get('sendUpdates'), 'none');
assert.equal(insertCalls[0].init.method, 'POST');
assert.equal(
  new Headers(insertCalls[0].init.headers).get('authorization'),
  'Bearer calendar-access-token',
);
const insertBody = calendarEventRequestBody(insertCalls[0].init);
assert.equal(insertBody.id, expectedEventId);
assert.equal('attendees' in insertBody, false);
assert.equal(insertBody.visibility, 'private');
assert.equal(insertBody.guestsCanInviteOthers, false);
assert.equal(insertBody.guestsCanModify, false);
assert.equal(insertBody.guestsCanSeeOtherGuests, false);
assert.doesNotMatch(
  insertBody.description,
  new RegExp(`${applicationId}|@`),
  'the visible event description must not contain an application id or member email',
);
assert.equal(insertBody.start.timeZone, 'Asia/Tokyo');
assert.equal(insertBody.end.timeZone, 'Asia/Tokyo');
assert.equal(
  Date.parse(insertBody.end.dateTime) - Date.parse(insertBody.start.dateTime),
  50 * 60_000,
);
assert.equal(
  insertBody.conferenceData.createRequest.requestId,
  calendar.googleMeetConferenceRequestIdForApplication(applicationId),
);
assert.equal(
  insertBody.conferenceData.createRequest.conferenceSolutionKey.type,
  'hangoutsMeet',
);
assert.deepEqual(insertBody.extendedProperties.private, {
  aijukuApplicationId: applicationId,
  aijukuManaged: 'v1',
});

// Google will not retry a failed Meet createRequest with the same request ID.
const failedRequestId =
  calendar.googleMeetConferenceRequestIdForApplication(applicationId);
const sameGenerationCalls: Array<{ url: string; init: RequestInit }> = [];
await expectGoogleCalendarError(
  calendar,
  () =>
    calendar.reconcileGoogleCalendarLessonEvent({
      accessToken: 'calendar-access-token',
      applicationId,
      serviceType: 'online-tutor',
      scheduledAt,
      conferenceRequestId: failedRequestId,
      fetcher: async (input, init = {}) => {
        sameGenerationCalls.push({ url: requestUrl(input), init });
        if (sameGenerationCalls.length === 1) {
          return new Response(null, { status: 409 });
        }
        if (sameGenerationCalls.length === 2) {
          return jsonResponse(
            eventPayload(calendar, {
              conferenceStatus: 'failure',
              conferenceRequestId: failedRequestId,
              etag: '"etag-failed-meet"',
            }),
          );
        }
        assert.fail('a failed Meet request ID must not be patched unchanged');
      },
      sleep: async () => undefined,
    }),
  { code: 'meet-creation-failed', retryable: true },
);
assert.deepEqual(
  sameGenerationCalls.map((call) => call.init.method),
  ['POST', 'GET'],
);

// A deterministic 409 is recovered by GET + PATCH. A failed Meet generation
// uses the next deterministic request ID because Google ignores reused IDs.
const retryRequestId = calendar.googleMeetConferenceRequestIdForApplication(
  applicationId,
  1,
);
const retryCalls: Array<{ url: string; init: RequestInit }> = [];
const retryFetcher: typeof fetch = async (input, init = {}) => {
  const call = { url: requestUrl(input), init };
  retryCalls.push(call);
  if (retryCalls.length === 1) return new Response(null, { status: 409 });
  if (retryCalls.length === 2) {
    return jsonResponse(
      eventPayload(calendar, {
        conferenceStatus: 'failure',
        conferenceRequestId: failedRequestId,
        etag: '"etag-before-update"',
      }),
    );
  }
  if (retryCalls.length === 3) {
    return jsonResponse(
      eventPayload(calendar, {
        hangoutLink: expectedMeetUrl,
        conferenceStatus: 'success',
        conferenceRequestId: retryRequestId,
        etag: '"etag-after-update"',
      }),
    );
  }
  assert.fail('409 recovery made an unexpected provider call');
};
const updated = await calendar.reconcileGoogleCalendarLessonEvent({
  accessToken: 'calendar-access-token',
  applicationId,
  serviceType: 'online-tutor',
  scheduledAt,
  conferenceRequestId: retryRequestId,
  fetcher: retryFetcher,
  sleep: async () => undefined,
});
assert.equal(updated.operation, 'updated');
assert.equal(updated.meetUrl, expectedMeetUrl);
assert.equal(updated.eventEtag, '"etag-after-update"');
assert.deepEqual(
  retryCalls.map((call) => call.init.method),
  ['POST', 'GET', 'PATCH'],
);
assert.equal(new URL(retryCalls[1].url).search, '');
const patchUrl = new URL(retryCalls[2].url);
assert.equal(patchUrl.pathname.endsWith(`/${expectedEventId}`), true);
assert.equal(patchUrl.searchParams.get('conferenceDataVersion'), '1');
assert.equal(patchUrl.searchParams.get('sendUpdates'), 'none');
assert.equal(
  new Headers(retryCalls[2].init.headers).get('if-match'),
  '"etag-before-update"',
);
const patchBody = calendarEventRequestBody(retryCalls[2].init);
assert.equal('id' in patchBody, false);
assert.equal('attendees' in patchBody, false);
assert.equal(patchBody.conferenceData.createRequest.requestId, retryRequestId);

// A provider-side edit is protected by ETag and becomes a safe 412 conflict.
const preconditionCalls: Array<{ url: string; init: RequestInit }> = [];
await expectGoogleCalendarError(
  calendar,
  () =>
    calendar.reconcileGoogleCalendarLessonEvent({
      accessToken: 'calendar-access-token',
      applicationId,
      serviceType: 'in-person-tutor',
      scheduledAt,
      fetcher: async (input, init = {}) => {
        preconditionCalls.push({ url: requestUrl(input), init });
        if (preconditionCalls.length === 1) {
          return new Response(null, { status: 409 });
        }
        if (preconditionCalls.length === 2) {
          return jsonResponse(
            eventPayload(calendar, { etag: '"etag-human-edit"' }),
          );
        }
        if (preconditionCalls.length === 3) {
          return new Response(null, { status: 412 });
        }
        assert.fail('a 412 conflict must stop without another provider call');
      },
    }),
  {
    code: 'calendar-event-conflict',
    status: 412,
    retryable: true,
    publicMessage: /自動更新を中止/,
  },
);
assert.deepEqual(
  preconditionCalls.map((call) => call.init.method),
  ['POST', 'GET', 'PATCH'],
);
assert.equal(
  new Headers(preconditionCalls[2].init.headers).get('if-match'),
  '"etag-human-edit"',
);

// Deletion first verifies the managed marker and protects the write with ETag.
const deleteCalls: Array<{ url: string; init: RequestInit }> = [];
const deleted = await calendar.deleteGoogleCalendarLessonEvent({
  accessToken: 'calendar-access-token',
  applicationId,
  fetcher: async (input, init = {}) => {
    deleteCalls.push({ url: requestUrl(input), init });
    if (deleteCalls.length === 1) {
      return jsonResponse(eventPayload(calendar, { etag: '"etag-delete"' }));
    }
    if (deleteCalls.length === 2) {
      return new Response(null, { status: 204 });
    }
    assert.fail('deletion made an unexpected provider call');
  },
});
assert.equal(deleted, 'deleted');
assert.deepEqual(
  deleteCalls.map((call) => call.init.method),
  ['GET', 'DELETE'],
);
const deleteUrl = new URL(deleteCalls[1].url);
assert.equal(deleteUrl.pathname.includes('/calendars/primary/events/'), true);
assert.equal(deleteUrl.searchParams.get('sendUpdates'), 'none');
assert.equal(
  new Headers(deleteCalls[1].init.headers).get('if-match'),
  '"etag-delete"',
);

// Meet creation may remain pending after bounded polling; this is not a fake URL.
const pendingCalls: Array<{ url: string; init: RequestInit }> = [];
const pendingSleeps: number[] = [];
const pendingFetcher: typeof fetch = async (input, init = {}) => {
  pendingCalls.push({ url: requestUrl(input), init });
  return jsonResponse(
    eventPayload(calendar, {
      conferenceStatus: 'pending',
      conferenceRequestId:
        calendar.googleMeetConferenceRequestIdForApplication(applicationId),
    }),
  );
};
const pending = await calendar.reconcileGoogleCalendarLessonEvent({
  accessToken: 'calendar-access-token',
  applicationId,
  serviceType: 'online-tutor',
  scheduledAt,
  fetcher: pendingFetcher,
  sleep: async (milliseconds) => {
    pendingSleeps.push(milliseconds);
  },
});
assert.equal(pending.operation, 'created');
assert.equal(pending.meetStatus, 'pending');
assert.equal(pending.meetUrl, null);
assert.ok(
  pendingSleeps.length >= 1 && pendingSleeps.length <= 8,
  'Meet polling must be bounded',
);
assert.equal(pendingCalls.length, pendingSleeps.length + 1);
assert.ok(
  pendingSleeps.every(
    (delay, index) =>
      delay > 0 && (index === 0 || delay >= pendingSleeps[index - 1]),
  ),
  'Meet polling delays must be positive and non-decreasing',
);
for (const call of pendingCalls.slice(1)) {
  assert.equal(call.init.method, 'GET');
  assert.equal(
    new URL(call.url).pathname.endsWith(`/${expectedEventId}`),
    true,
  );
}

// Provider/network details are normalized and never exposed to callers.
const networkSecret = 'raw-network-secret-12345';
await expectGoogleCalendarError(
  calendar,
  () =>
    calendar.reconcileGoogleCalendarLessonEvent({
      accessToken: 'calendar-access-token',
      applicationId,
      serviceType: 'in-person-tutor',
      scheduledAt,
      fetcher: async () => {
        throw new Error(networkSecret);
      },
    }),
  {
    code: 'calendar-api-failed',
    status: null,
    retryable: true,
    publicMessage: /接続できませんでした/,
    mustNotContain: networkSecret,
  },
);
await expectGoogleCalendarError(
  calendar,
  () =>
    calendar.reconcileGoogleCalendarLessonEvent({
      accessToken: 'calendar-access-token',
      applicationId,
      serviceType: 'online-tutor',
      scheduledAt,
      fetcher: async () =>
        jsonResponse(
          eventPayload(calendar, {
            conferenceStatus: 'failure',
            conferenceRequestId:
              calendar.googleMeetConferenceRequestIdForApplication(
                applicationId,
              ),
          }),
        ),
      sleep: async () => undefined,
    }),
  {
    code: 'meet-creation-failed',
    retryable: true,
    publicMessage: /再同期/,
  },
);
await expectGoogleCalendarError(
  calendar,
  () =>
    calendar.reconcileGoogleCalendarLessonEvent({
      accessToken: 'calendar-access-token',
      applicationId,
      serviceType: 'in-person-tutor',
      scheduledAt,
      fetcher: async () =>
        jsonResponse(eventPayload(calendar, { managedMarker: 'foreign' })),
    }),
  {
    code: 'calendar-event-conflict',
    status: 409,
    publicMessage: /自動更新を中止/,
  },
);

// Route/DB guardrails: owner-only OAuth, no demo writes, encrypted tokens, and
// stable provider IDs guarded by optimistic concurrency.
const connectRoute = await readFile(
  new URL('../app/api/admin/google-calendar/connect/route.ts', import.meta.url),
  'utf8',
);
const callbackRoute = await readFile(
  new URL(
    '../app/api/admin/google-calendar/callback/route.ts',
    import.meta.url,
  ),
  'utf8',
);
const disconnectRoute = await readFile(
  new URL(
    '../app/api/admin/google-calendar/disconnect/route.ts',
    import.meta.url,
  ),
  'utf8',
);
for (const [routeName, routeSource] of [
  ['connect', connectRoute],
  ['callback', callbackRoute],
  ['disconnect', disconnectRoute],
] as const) {
  assert.match(
    routeSource,
    /getAuthenticatedStaffPermissions\(user\)\.isOwner/,
  );
  assert.match(routeSource, /user\.isDemo/);
  assert.doesNotMatch(
    routeSource,
    /console\.(?:log|error)\([^\n]*(?:refreshToken|accessToken|meetUrl)/,
    `${routeName} route must not log Calendar secrets`,
  );
}
assert.match(connectRoute, /isSameOriginRequest\(request\)/);
assert.match(disconnectRoute, /isSameOriginRequest\(request\)/);
assert.match(callbackRoute, /exchangeGoogleCalendarAuthorizationCode/);
assert.match(callbackRoute, /googleOAuthStateMatches/);
assert.match(callbackRoute, /encryptGoogleCalendarRefreshToken/);
assert.match(callbackRoute, /upsertGoogleCalendarConnection/);
assert.match(callbackRoute, /clearedGoogleCalendarOauthCookieHeaders/);

const calendarDb = await readFile(
  new URL('../db/google-calendar.ts', import.meta.url),
  'utf8',
);
assert.match(
  calendarDb,
  /refresh_token_ciphertext = NULL,[\s\S]+status = 'reconnect_required'/,
  'an invalid grant must remove the unusable encrypted refresh token',
);
assert.match(
  calendarDb,
  /google_event_id = excluded\.google_event_id[\s\S]+conference_request_id IS excluded\.conference_request_id/,
  'a retry must retain both stable provider identifiers',
);
assert.match(
  calendarDb,
  /allowConferenceRequestIdRotation[\s\S]+sync_status = 'failed'[\s\S]+last_error_code = 'meet-creation-failed'/,
  'Meet request-id rotation must be limited to a recorded creation failure',
);
assert.match(
  calendarDb,
  /AND \? IS NOT NULL[\s\S]+application_calendar_events\.updated_at = \?/,
  'a caller that observed no sync row must not overwrite a concurrent insert',
);
assert.match(
  calendarDb,
  /expectedAttemptCount[\s\S]+sync_status = 'create_pending'[\s\S]+attempt_count = \?/,
  'provider success/failure writes must be bound to their in-flight attempt',
);
assert.doesNotMatch(
  calendarDb,
  /console\.(?:log|error)/,
  'secret-bearing Calendar DB records must not be logged',
);

console.log('Googleカレンダー・Meet連携検査: OK');
