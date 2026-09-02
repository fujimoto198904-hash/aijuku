import { env } from "cloudflare:workers";

export type StaffPermissions = {
  isOwner: boolean;
  canManageApplications: boolean;
  canReviewEvidence: boolean;
  canModerateReviews: boolean;
};

function configuredEmails(value: string | undefined): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
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
  const isModerator = configuredEmails(env.REVIEW_MODERATOR_EMAILS).has(
    normalizedEmail,
  );

  return {
    isOwner,
    canManageApplications: isOwner,
    canReviewEvidence: isOwner || isInstructor,
    canModerateReviews: isOwner || isModerator,
  };
}

export function hasStaffAccess(permissions: StaffPermissions): boolean {
  return (
    permissions.canManageApplications ||
    permissions.canReviewEvidence ||
    permissions.canModerateReviews
  );
}
