// 有料サービスを再開するときは docs/AISTOCK_MIGRATION.md の手順を確認する。
export const paidServicesEnabled: boolean = false;

export function paidServiceUnavailable(): Response {
  return Response.json(
    {
      error: '現在、有料サービスの受付は行っていません。',
      code: 'PAID_SERVICES_DISABLED',
    },
    { status: 410, headers: { 'Cache-Control': 'no-store' } },
  );
}
