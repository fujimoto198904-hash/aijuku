export function requestClientAddress(request: Request): string {
  const cloudflareAddress = request.headers.get('cf-connecting-ip')?.trim();
  if (cloudflareAddress) return cloudflareAddress.slice(0, 80);
  const forwarded = request.headers
    .get('x-forwarded-for')
    ?.split(',')[0]
    ?.trim();
  return (forwarded || 'unknown').slice(0, 80);
}

export function noStoreJson(
  body: Record<string, unknown>,
  init?: ResponseInit,
): Response {
  const headers = new Headers(init?.headers);
  headers.set('Cache-Control', 'private, no-store, max-age=0');
  headers.set('Pragma', 'no-cache');
  return Response.json(body, { ...init, headers });
}
