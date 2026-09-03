import {
  getBillingAuthenticatedUser,
  getChatGPTUser,
  type ChatGPTUser,
} from '@/app/chatgpt-auth';
import {
  getMember,
  hasCurrentMembershipConsent,
  type MemberProfile,
} from '@/db/membership';
import { rejectDemoWrite } from '@/lib/demo-access';
import { isSameOriginRequest } from '@/lib/request-security';
import { isVercelRuntime } from '@/lib/site-runtime';

type BillingMemberResult =
  | { user: ChatGPTUser; member: MemberProfile }
  | { response: Response };

export async function requireBillingMember(
  request: Request,
): Promise<BillingMemberResult> {
  return requireBillingIdentity(request, false);
}

export async function requireBillingPortalMember(
  request: Request,
): Promise<BillingMemberResult> {
  return requireBillingIdentity(request, true);
}

async function requireBillingIdentity(
  request: Request,
  allowInactiveMember: boolean,
): Promise<BillingMemberResult> {
  if (isVercelRuntime()) {
    return {
      response: Response.json(
        { error: 'お支払いは藤本実学塾の正規会員サイトから行ってください。' },
        { status: 503 },
      ),
    };
  }
  if (!isSameOriginRequest(request)) {
    return {
      response: Response.json(
        { error: '送信元を確認できませんでした。' },
        { status: 403 },
      ),
    };
  }

  const user = allowInactiveMember
    ? await getBillingAuthenticatedUser()
    : await getChatGPTUser();
  if (!user) {
    return {
      response: Response.json(
        { error: 'ログインが必要です。' },
        { status: 401 },
      ),
    };
  }
  const demoResponse = rejectDemoWrite(user);
  if (demoResponse) return { response: demoResponse };

  const member = await getMember(user.userId);
  if (!member) {
    return {
      response: Response.json(
        { error: '会員情報を確認できませんでした。' },
        { status: 403 },
      ),
    };
  }
  if (
    !allowInactiveMember &&
    (member.status !== 'active' || !hasCurrentMembershipConsent(member))
  ) {
    return {
      response: Response.json(
        { error: '先に無料会員登録と現行規約への同意を完了してください。' },
        { status: 403 },
      ),
    };
  }

  return { user, member };
}

export function noStoreBillingJson(
  body: Record<string, unknown>,
  init?: ResponseInit,
): Response {
  const headers = new Headers(init?.headers);
  headers.set('Cache-Control', 'private, no-store, max-age=0');
  headers.set('Pragma', 'no-cache');
  return Response.json(body, { ...init, headers });
}
