import {
  registrationUsername,
  reservedRegistrationUsername,
} from './username-registration';

export function publicUserId(value: unknown) {
  const id = registrationUsername(value);
  return id && !reservedRegistrationUsername(id) ? id : '';
}

export function profileUserId(profile: {
  handle: string;
  publicId?: string | null;
}) {
  return profile.publicId || profile.handle;
}

export function avatarMediaId(avatar: string | null | undefined) {
  return /^media:[a-f0-9-]{36}$/.test(avatar ?? '') ? avatar!.slice(6) : null;
}

export class ProfileInputError extends Error {
  constructor(
    message: string,
    public status = 409,
  ) {
    super(message);
  }
}
