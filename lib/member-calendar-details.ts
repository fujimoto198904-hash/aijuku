import {
  listApplicationCalendarEvents,
  type ApplicationCalendarSyncStatus,
} from '@/db/google-calendar';
import {
  decryptGoogleCalendarMeetUrl,
  getGoogleCalendarConfig,
} from '@/lib/google-calendar';

export type MemberApplicationCalendarDetails = {
  syncStatus: ApplicationCalendarSyncStatus;
  meetUrl: string | null;
};

/**
 * Reads calendar details only for application ids already authorized by the
 * caller. This helper never accepts a member id from a browser request.
 */
export async function getMemberApplicationCalendarDetails(
  applicationIds: readonly string[],
): Promise<Map<string, MemberApplicationCalendarDetails>> {
  const uniqueIds = Array.from(new Set(applicationIds)).slice(0, 100);
  if (uniqueIds.length === 0) return new Map();

  const rows = await listApplicationCalendarEvents(uniqueIds);
  let config: ReturnType<typeof getGoogleCalendarConfig> | null = null;
  try {
    config = getGoogleCalendarConfig();
  } catch {
    // A missing deployment secret must not expose or corrupt stored data.
  }

  const result = new Map<string, MemberApplicationCalendarDetails>();
  for (const row of rows) {
    let meetUrl: string | null = null;
    if (config && row.syncStatus === 'active' && row.meetUrlCiphertext) {
      try {
        meetUrl = await decryptGoogleCalendarMeetUrl({
          encryptedMeetUrl: row.meetUrlCiphertext,
          applicationId: row.applicationId,
          encryptionKey: config.tokenEncryptionKey,
        });
      } catch {
        // The member receives no secret value when integrity verification fails.
      }
    }
    result.set(row.applicationId, {
      syncStatus: row.syncStatus,
      meetUrl,
    });
  }
  return result;
}
