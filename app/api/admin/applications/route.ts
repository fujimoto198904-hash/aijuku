import {
  paidServicesEnabled,
  paidServiceUnavailable,
} from '@/lib/site-features';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import {
  applicationStatusValues,
  canAdminTransitionApplication,
  firstScheduledAtForService,
  getAdminApplicationById,
  type ApplicationStatus,
  updateAdminApplication,
} from '@/db/membership';
import {
  ApplicationCalendarSyncError,
  isGoogleCalendarManagedService,
  syncApplicationToGoogleCalendar,
} from '@/lib/application-calendar-sync';
import { cleanRequestText, isSameOriginRequest } from '@/lib/request-security';
import { rejectDemoWrite } from '@/lib/demo-access';
import { isVercelRuntime } from '@/lib/site-runtime';
import { getAuthenticatedStaffPermissions } from '@/lib/staff-permissions';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request) {
  if (!paidServicesEnabled) return paidServiceUnavailable();
  if (isVercelRuntime()) {
    return Response.json(
      { error: '申込管理は正規会員サイトで行ってください。' },
      { status: 503 },
    );
  }
  if (!isSameOriginRequest(request)) {
    return Response.json(
      { error: '送信元を確認できませんでした。' },
      { status: 403 },
    );
  }
  const user = await getChatGPTUser();
  if (!user) {
    return Response.json({ error: 'ログインが必要です。' }, { status: 401 });
  }
  const demoResponse = rejectDemoWrite(user);
  if (demoResponse) return demoResponse;
  if (!getAuthenticatedStaffPermissions(user).canManageApplications) {
    return Response.json(
      { error: '申込管理はオーナーだけが操作できます。' },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const applicationId = cleanRequestText(body.applicationId, 80);
    const status = cleanRequestText(body.status, 20) as ApplicationStatus;
    const expectedUpdatedAt = Number(body.expectedUpdatedAt);
    const memberMessage = cleanRequestText(body.memberMessage, 600) || null;
    const assignedInstructor =
      cleanRequestText(body.assignedInstructor, 120) || null;
    const deliveryDetails = cleanRequestText(body.deliveryDetails, 600) || null;
    const internalNote = cleanRequestText(body.internalNote, 1_000) || null;
    const scheduledAtValue = body.scheduledAt;
    const scheduledAt =
      scheduledAtValue === null || scheduledAtValue === ''
        ? null
        : Number(scheduledAtValue);

    if (
      !applicationId ||
      !applicationStatusValues.includes(status) ||
      !Number.isSafeInteger(expectedUpdatedAt) ||
      (scheduledAt !== null &&
        (!Number.isSafeInteger(scheduledAt) || scheduledAt <= 0))
    ) {
      return Response.json(
        { error: '更新内容を確認できませんでした。' },
        { status: 400 },
      );
    }

    const application = await getAdminApplicationById(applicationId);
    if (!application) {
      return Response.json(
        { error: '申込が見つかりません。' },
        { status: 404 },
      );
    }
    if (application.updatedAt !== expectedUpdatedAt) {
      return Response.json(
        {
          error:
            '別の操作で内容が更新されています。画面を再読み込みしてください。',
        },
        { status: 409 },
      );
    }
    if (!canAdminTransitionApplication(application.status, status)) {
      return Response.json(
        {
          error:
            'この対応状態には変更できません。確定・取消後の再開は新しい申込として受け付けてください。',
        },
        { status: 409 },
      );
    }
    if (status === 'confirmed' && (!assignedInstructor || !scheduledAt)) {
      return Response.json(
        {
          error: '確定するには、担当講師と実施日時が必要です。',
        },
        { status: 400 },
      );
    }
    if (
      status === 'confirmed' &&
      application.serviceType !== 'online-tutor' &&
      !deliveryDetails
    ) {
      return Response.json(
        {
          error:
            application.serviceType === 'in-person-tutor'
              ? '対面授業を確定するには、会場の案内が必要です。'
              : '自習式を確定するには、初回会場などの案内が必要です。',
        },
        { status: 400 },
      );
    }
    if (status === 'confirmed' && scheduledAt) {
      const minimumScheduledAt = firstScheduledAtForService(
        application.serviceType,
      );
      if (minimumScheduledAt !== null && scheduledAt < minimumScheduledAt) {
        return Response.json(
          {
            error:
              application.serviceType === 'in-person-tutor'
                ? '対面授業は2026年10月1日以降の日時を指定してください。'
                : '対面・教科書自習式は2026年11月1日17:00以降の日時を指定してください。',
          },
          { status: 400 },
        );
      }
      const scheduleChanged =
        application.status !== 'confirmed' ||
        application.scheduledAt !== scheduledAt;
      if (scheduleChanged && scheduledAt <= Date.now()) {
        return Response.json(
          { error: '実施日時は、現在より後の日時を指定してください。' },
          { status: 400 },
        );
      }
    }
    if (
      status === 'cancelled' &&
      (!memberMessage || memberMessage.length < 5)
    ) {
      return Response.json(
        { error: '取消理由または会員への案内を5文字以上で入力してください。' },
        { status: 400 },
      );
    }

    let calendarResult: {
      calendarSynced: true;
      meetReady: boolean;
    } | null = null;
    if (
      status === 'confirmed' &&
      scheduledAt &&
      isGoogleCalendarManagedService(application.serviceType)
    ) {
      try {
        calendarResult = await syncApplicationToGoogleCalendar({
          applicationId,
          ownerMemberId: user.userId,
          serviceType: application.serviceType,
          scheduledAt,
        });
      } catch (error) {
        if (error instanceof ApplicationCalendarSyncError) {
          const statusCode =
            error.code === 'calendar-not-configured'
              ? 503
              : error.code === 'calendar-sync-failed'
                ? 502
                : 409;
          return Response.json(
            {
              error: error.publicMessage,
              calendarStatus: error.code,
              retryable: error.retryable,
            },
            { status: statusCode },
          );
        }
        throw error;
      }
    }

    const result = await updateAdminApplication({
      applicationId,
      expectedUpdatedAt,
      status,
      memberMessage,
      assignedInstructor,
      scheduledAt,
      deliveryDetails,
      internalNote,
      actor: user,
    });
    if (result === 'not_found') {
      return Response.json(
        { error: '申込が見つかりません。' },
        { status: 404 },
      );
    }
    if (result === 'conflict') {
      return Response.json(
        {
          error:
            '別の操作で内容が更新されています。画面を再読み込みしてください。',
        },
        { status: 409 },
      );
    }
    if (result === 'invalid_transition') {
      return Response.json(
        {
          error:
            'この対応状態には変更できません。確定・取消後の再開は新しい申込として受け付けてください。',
        },
        { status: 409 },
      );
    }
    if (result === 'invalid_schedule') {
      return Response.json(
        { error: '確定する実施日時は、現在より後の日時を指定してください。' },
        { status: 400 },
      );
    }
    return Response.json({
      ok: true,
      updatedAt: result,
      calendarSynced: calendarResult?.calendarSynced ?? false,
      meetReady: calendarResult?.meetReady ?? false,
    });
  } catch (error) {
    console.error('admin application update failed', error);
    return Response.json(
      { error: '申込管理を保存できませんでした。' },
      { status: 500 },
    );
  }
}
