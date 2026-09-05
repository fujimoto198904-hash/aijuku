import { getChatGPTUser } from '@/app/chatgpt-auth';
import { readCommunityMedia } from '@/db/community-media';
export const dynamic = 'force-dynamic';
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const headers = {
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox",
  };
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/.test(id))
    return new Response(null, { status: 404, headers });
  const user = await getChatGPTUser();
  const file = await readCommunityMedia(id, user?.userId);
  if (!file) return new Response(null, { status: 404, headers });
  return new Response(file.body, {
    headers: { ...headers, 'Content-Type': 'image/png' },
  });
}
