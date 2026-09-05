import { getChatGPTUser } from '@/app/chatgpt-auth';
import { beginGoogleFlow, googleCookieHeader } from '@/lib/google-signin';
import { canonicalPublicPath } from '@/lib/site-paths';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    const linking = new URL(request.url).searchParams.get('mode') === 'link';
    const user = linking ? await getChatGPTUser() : null;
    if (linking && (!user || user.isDemo))
      return Response.redirect(canonicalPublicPath('/login'), 303);
    const flow = await beginGoogleFlow(user?.userId ?? null);
    return new Response(null, {
      status: 303,
      headers: {
        Location: flow.url,
        'Set-Cookie': googleCookieHeader(
          flow.cookie,
          new URL(request.url).protocol === 'https:',
        ),
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
      },
    });
  } catch {
    return Response.redirect(
      canonicalPublicPath('/login?error=google-unavailable'),
      303,
    );
  }
}
