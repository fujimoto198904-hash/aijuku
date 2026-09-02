import { noStoreJson } from '@/lib/auth-request';

export const dynamic = 'force-dynamic';

/**
 * The one-time production bootstrap finished on 2026-09-03.
 *
 * Keep this route as an explicit tombstone so an old deployment secret or an
 * accidentally emptied database can never reactivate account creation.
 */
export async function POST() {
  return noStoreJson({ error: 'Not found.' }, { status: 404 });
}
