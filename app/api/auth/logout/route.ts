import {
  legacyChatGPTSignOutPath,
  safeRelativeReturnPath,
} from '@/app/chatgpt-auth';
import { revokePasswordSession } from '@/db/member-auth';
import { noStoreJson } from '@/lib/auth-request';
import {
  appendClearedSessionCookies,
  readMemberSessionToken,
} from '@/lib/member-session-cookie';

export const dynamic = 'force-dynamic';

const authenticatedUserIdHeader = 'oai-authenticated-user-id';

async function logout(request: Request): Promise<Response> {
  const token = await readMemberSessionToken();
  if (token) {
    try {
      await revokePasswordSession(token);
    } catch (error) {
      console.error('session revocation failed', error);
      return new Response(
        'ログアウトを完了できませんでした。通信状態を確認し、もう一度お試しください。',
        {
          status: 503,
          headers: {
            'Cache-Control': 'private, no-store, max-age=0',
            'Content-Type': 'text/plain; charset=utf-8',
          },
        },
      );
    }
  }
  const url = new URL(request.url);
  const returnTo = safeRelativeReturnPath(
    url.searchParams.get('return_to') || '/',
  );
  const hasChatGPTSession = Boolean(
    request.headers.get(authenticatedUserIdHeader),
  );
  const location = hasChatGPTSession
    ? legacyChatGPTSignOutPath(returnTo)
    : returnTo;
  const headers = new Headers({ Location: location });
  appendClearedSessionCookies(headers);
  headers.set('Cache-Control', 'private, no-store, max-age=0');
  return new Response(null, { status: 303, headers });
}

export async function GET(request: Request) {
  return logout(request);
}

export async function POST(request: Request) {
  if (!request.headers.get('origin')) {
    return noStoreJson(
      { error: '送信元を確認できませんでした。' },
      { status: 403 },
    );
  }
  return logout(request);
}
