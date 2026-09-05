import { env } from 'cloudflare:workers';
export function registrationAvailability() {
  return {
    username: Boolean(
      env.DB && (env.AUTH_PASSWORD_PEPPER?.trim().length ?? 0) >= 32,
    ),
    google: Boolean(env.AUTH_GOOGLE_CLIENT_ID && env.AUTH_GOOGLE_CLIENT_SECRET),
    email: Boolean(env.AUTH_EMAIL_API_KEY && env.AUTH_EMAIL_FROM),
  };
}
