import {
  getApplicationCalendarEvent,
  getGoogleCalendarConnection,
  markApplicationCalendarEventActive,
  markApplicationCalendarEventFailed,
  markGoogleCalendarConnectionReconnectRequired,
  upsertPendingApplicationCalendarEvent,
} from '@/db/google-calendar';
import type { ServiceType } from '@/db/membership';
import {
  decryptGoogleCalendarRefreshToken,
  encryptGoogleCalendarMeetUrl,
  getGoogleCalendarConfig,
  googleCalendarEventIdForApplication,
  googleMeetConferenceRequestIdForApplication,
  GoogleCalendarConfigurationError,
  GoogleCalendarError,
  reconcileGoogleCalendarLessonEvent,
  refreshGoogleCalendarAccessToken,
  resolveGoogleCalendarLessonSchedule,
} from '@/lib/google-calendar';

export type ApplicationCalendarSyncErrorCode =
  | 'calendar-not-configured'
  | 'calendar-not-connected'
  | 'calendar-reconnect-required'
  | 'calendar-sync-conflict'
  | 'calendar-sync-failed'
  | 'meet-pending';

export class ApplicationCalendarSyncError extends Error {
  constructor(
    public readonly publicMessage: string,
    public readonly code: ApplicationCalendarSyncErrorCode,
    public readonly retryable = false,
  ) {
    super(code);
    this.name = 'ApplicationCalendarSyncError';
  }
}

export type ApplicationCalendarSyncResult = {
  calendarSynced: true;
  meetReady: boolean;
};

export function isGoogleCalendarManagedService(
  serviceType: ServiceType,
): serviceType is Exclude<ServiceType, 'self-study'> {
  return serviceType === 'online-tutor' || serviceType === 'in-person-tutor';
}

function normalizeGoogleCalendarFailure(
  error: unknown,
): ApplicationCalendarSyncError {
  if (error instanceof ApplicationCalendarSyncError) return error;
  if (error instanceof GoogleCalendarConfigurationError) {
    return new ApplicationCalendarSyncError(
      'Googleカレンダーの初期設定が完了していません。管理画面の連携設定を確認してください。',
      'calendar-not-configured',
    );
  }
  if (error instanceof GoogleCalendarError) {
    if (
      error.code === 'oauth-invalid-grant' ||
      error.code === 'missing-calendar-scope' ||
      error.code === 'invalid-encrypted-token' ||
      error.status === 401
    ) {
      return new ApplicationCalendarSyncError(
        'Googleカレンダーとの接続が切れています。管理画面から再接続してください。',
        'calendar-reconnect-required',
      );
    }
    if (error.code === 'calendar-event-conflict') {
      return new ApplicationCalendarSyncError(
        '同じ申込の予定を安全に更新できませんでした。Googleカレンダーの予定を確認してください。',
        'calendar-sync-conflict',
      );
    }
    return new ApplicationCalendarSyncError(
      error.publicMessage,
      'calendar-sync-failed',
      error.retryable,
    );
  }
  return new ApplicationCalendarSyncError(
    'Googleカレンダーへ予定を保存できませんでした。時間をおいて、もう一度お試しください。',
    'calendar-sync-failed',
    true,
  );
}

/**
 * Reconciles one application with the owner's primary calendar.
 *
 * This function deliberately does not accept a calendar id or attendees. The
 * provider adapter always writes to `primary`, and a member is never invited.
 */
export async function syncApplicationToGoogleCalendar(input: {
  applicationId: string;
  ownerMemberId: string;
  serviceType: Exclude<ServiceType, 'self-study'>;
  scheduledAt: number;
}): Promise<ApplicationCalendarSyncResult> {
  const schedule = resolveGoogleCalendarLessonSchedule({
    serviceType: input.serviceType,
    scheduledAt: input.scheduledAt,
  });
  if (!schedule.ok) {
    const message =
      schedule.reason === 'before-in-person-launch'
        ? '対面授業は2026年10月1日以降の日時を指定してください。'
        : '授業の実施日時を確認してください。';
    throw new ApplicationCalendarSyncError(message, 'calendar-sync-failed');
  }

  let connection: Awaited<ReturnType<typeof getGoogleCalendarConnection>> =
    null;
  let pending: Awaited<
    ReturnType<typeof upsertPendingApplicationCalendarEvent>
  > = null;

  try {
    const config = getGoogleCalendarConfig();
    connection = await getGoogleCalendarConnection(input.ownerMemberId);
    if (
      !connection ||
      connection.status !== 'active' ||
      !connection.refreshTokenCiphertext
    ) {
      throw new ApplicationCalendarSyncError(
        connection?.status === 'reconnect_required'
          ? 'Googleカレンダーとの接続が切れています。管理画面から再接続してください。'
          : '申込を確定する前に、管理画面でGoogleカレンダーを接続してください。',
        connection?.status === 'reconnect_required'
          ? 'calendar-reconnect-required'
          : 'calendar-not-connected',
      );
    }
    if (connection.googleEmail.trim().toLowerCase() !== config.ownerEmail) {
      await markGoogleCalendarConnectionReconnectRequired({
        ownerMemberId: input.ownerMemberId,
        expectedGoogleSubject: connection.googleSubject,
        expectedUpdatedAt: connection.updatedAt,
        errorCode: 'calendar-reconnect-required',
      });
      throw new ApplicationCalendarSyncError(
        '接続中のGoogleアカウントが予定保存先と一致しません。管理画面から再接続してください。',
        'calendar-reconnect-required',
      );
    }

    const existing = await getApplicationCalendarEvent(input.applicationId);
    const googleEventId = googleCalendarEventIdForApplication(
      input.applicationId,
    );
    const rotateFailedMeetRequest =
      input.serviceType === 'online-tutor' &&
      existing?.syncStatus === 'failed' &&
      existing.lastErrorCode === 'meet-creation-failed';
    const conferenceRequestId =
      input.serviceType === 'online-tutor'
        ? rotateFailedMeetRequest
          ? googleMeetConferenceRequestIdForApplication(
              input.applicationId,
              existing.attemptCount + 1,
            )
          : (existing?.conferenceRequestId ??
            googleMeetConferenceRequestIdForApplication(input.applicationId))
        : null;
    pending = await upsertPendingApplicationCalendarEvent({
      applicationId: input.applicationId,
      ownerMemberId: input.ownerMemberId,
      googleEventId,
      conferenceRequestId,
      startAt: schedule.startAt,
      endAt: schedule.endAt,
      timezone: schedule.timeZone,
      expectedUpdatedAt: existing?.updatedAt ?? null,
      allowConferenceRequestIdRotation: rotateFailedMeetRequest,
    });
    if (!pending) {
      throw new ApplicationCalendarSyncError(
        '同じ申込を別の画面で更新しています。画面を読み込み直してください。',
        'calendar-sync-conflict',
      );
    }

    const refreshToken = await decryptGoogleCalendarRefreshToken({
      encryptedRefreshToken: connection.refreshTokenCiphertext,
      ownerMemberId: input.ownerMemberId,
      encryptionKey: config.tokenEncryptionKey,
    });
    const access = await refreshGoogleCalendarAccessToken({
      config,
      refreshToken,
    });
    const reconciled = await reconcileGoogleCalendarLessonEvent({
      accessToken: access.accessToken,
      applicationId: input.applicationId,
      serviceType: input.serviceType,
      scheduledAt: input.scheduledAt,
      conferenceRequestId: pending.conferenceRequestId,
    });

    if (
      input.serviceType === 'online-tutor' &&
      (reconciled.meetStatus !== 'ready' || !reconciled.meetUrl)
    ) {
      throw new ApplicationCalendarSyncError(
        'Google Meetを準備しています。同じ申込でもう一度「確定」を押してください。',
        'meet-pending',
        true,
      );
    }

    const meetUrlCiphertext = reconciled.meetUrl
      ? await encryptGoogleCalendarMeetUrl({
          meetUrl: reconciled.meetUrl,
          applicationId: input.applicationId,
          encryptionKey: config.tokenEncryptionKey,
        })
      : null;
    const active = await markApplicationCalendarEventActive({
      applicationId: input.applicationId,
      ownerMemberId: input.ownerMemberId,
      googleEventId,
      expectedAttemptCount: pending.attemptCount,
      googleEventEtag: reconciled.eventEtag,
      meetUrlCiphertext,
    });
    if (!active) {
      throw new ApplicationCalendarSyncError(
        '同じ申込を別の画面で更新しています。画面を読み込み直してください。',
        'calendar-sync-conflict',
      );
    }
    return {
      calendarSynced: true,
      meetReady:
        input.serviceType !== 'online-tutor' || Boolean(reconciled.meetUrl),
    };
  } catch (error) {
    const normalized = normalizeGoogleCalendarFailure(error);
    if (pending) {
      const reconnectRequired =
        normalized.code === 'calendar-reconnect-required';
      const storageErrorCode =
        error instanceof GoogleCalendarError &&
        error.code === 'meet-creation-failed'
          ? error.code
          : normalized.code;
      await markApplicationCalendarEventFailed({
        applicationId: input.applicationId,
        ownerMemberId: input.ownerMemberId,
        googleEventId: pending.googleEventId,
        expectedAttemptCount: pending.attemptCount,
        errorCode: storageErrorCode,
        reconnectRequired,
      });
      if (reconnectRequired && connection) {
        await markGoogleCalendarConnectionReconnectRequired({
          ownerMemberId: input.ownerMemberId,
          expectedGoogleSubject: connection.googleSubject,
          expectedUpdatedAt: connection.updatedAt,
          errorCode: normalized.code,
        });
      }
    }
    throw normalized;
  }
}
