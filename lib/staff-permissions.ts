import { env } from 'cloudflare:workers';

export type StaffPermissions = {
  isOwner: boolean;
  canManageApplications: boolean;
  canReviewEvidence: boolean;
};

function configuredEmails(value: string | undefined): Set<string> {
  return new Set(
    (value ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function getStaffPermissions(email: string): StaffPermissions {
  const normalizedEmail = email.trim().toLowerCase();
  const isOwner = configuredEmails(env.ADMIN_EMAILS).has(normalizedEmail);
  const isInstructor = configuredEmails(env.INSTRUCTOR_EMAILS).has(
    normalizedEmail,
  );

  return {
    isOwner,
    canManageApplications: isOwner,
    canReviewEvidence: isOwner || isInstructor,
  };
}

export function hasStaffAccess(permissions: StaffPermissions): boolean {
  return permissions.canManageApplications || permissions.canReviewEvidence;
}

export function configuredOwnerLoginId(email: string): string | null {
  if (!getStaffPermissions(email).isOwner) return null;
  const loginId = env.AUTH_OWNER_LOGIN_ID?.trim().toLowerCase() ?? '';
  return loginId || null;
}
