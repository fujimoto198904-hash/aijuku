export type StaffPermissions = {
  isOwner: boolean;
  canManageApplications: boolean;
  canReviewEvidence: boolean;
};

export type AuthenticatedStaffIdentity = {
  userId: string;
  authMethod: 'chatgpt' | 'password';
  email: string;
  loginId: string;
  isDemo: boolean;
};

type StaffPermissionConfiguration = {
  adminEmails?: string;
  instructorEmails?: string;
  ownerLoginId?: string;
  ownerMemberId?: string;
};

function configuredEmails(value: string | undefined): Set<string> {
  return new Set(
    (value ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function noStaffAccess(): StaffPermissions {
  return {
    isOwner: false,
    canManageApplications: false,
    canReviewEvidence: false,
  };
}

export function emailStaffPermissions(
  email: string,
  configuration: Pick<
    StaffPermissionConfiguration,
    'adminEmails' | 'instructorEmails'
  >,
): StaffPermissions {
  const normalizedEmail = email.trim().toLowerCase();
  const isOwner = configuredEmails(configuration.adminEmails).has(
    normalizedEmail,
  );
  const isInstructor = configuredEmails(configuration.instructorEmails).has(
    normalizedEmail,
  );

  return {
    isOwner,
    canManageApplications: isOwner,
    canReviewEvidence: isOwner || isInstructor,
  };
}

export function authenticatedStaffPermissions(
  user: AuthenticatedStaffIdentity,
  configuration: StaffPermissionConfiguration,
): StaffPermissions {
  if (user.isDemo) return noStaffAccess();

  if (user.authMethod === 'chatgpt') {
    return emailStaffPermissions(user.email, configuration);
  }

  const ownerLoginId = configuration.ownerLoginId?.trim().toLowerCase() ?? '';
  const ownerMemberId = configuration.ownerMemberId?.trim() ?? '';
  const isPasswordOwner =
    Boolean(ownerLoginId) &&
    Boolean(ownerMemberId) &&
    user.userId.trim() === ownerMemberId &&
    user.loginId.trim().toLowerCase() === ownerLoginId;
  const isPasswordInstructor = configuredEmails(
    configuration.instructorEmails,
  ).has(user.email.trim().toLowerCase());

  return {
    isOwner: isPasswordOwner,
    canManageApplications: isPasswordOwner,
    canReviewEvidence: isPasswordOwner || isPasswordInstructor,
  };
}
