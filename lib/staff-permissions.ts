import { env } from 'cloudflare:workers';

import {
  authenticatedStaffPermissions,
  emailStaffPermissions,
  type AuthenticatedStaffIdentity,
  type StaffPermissions,
} from '@/lib/staff-permission-policy';

export type { StaffPermissions } from '@/lib/staff-permission-policy';

export function getStaffPermissions(email: string): StaffPermissions {
  return emailStaffPermissions(email, {
    adminEmails: env.ADMIN_EMAILS,
    instructorEmails: env.INSTRUCTOR_EMAILS,
  });
}

export function getAuthenticatedStaffPermissions(
  user: AuthenticatedStaffIdentity,
): StaffPermissions {
  return authenticatedStaffPermissions(user, {
    adminEmails: env.ADMIN_EMAILS,
    instructorEmails: env.INSTRUCTOR_EMAILS,
    ownerLoginId: env.AUTH_OWNER_LOGIN_ID,
    ownerMemberId: env.AUTH_OWNER_MEMBER_ID,
  });
}

export function hasStaffAccess(permissions: StaffPermissions): boolean {
  return permissions.canManageApplications || permissions.canReviewEvidence;
}

export function configuredOwnerLoginId(email: string): string | null {
  if (!getStaffPermissions(email).isOwner) return null;
  const loginId = env.AUTH_OWNER_LOGIN_ID?.trim().toLowerCase() ?? '';
  return loginId || null;
}
