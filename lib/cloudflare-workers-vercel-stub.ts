// Vercel serves the public mirror only. Member routes redirect to the canonical
// Sites deployment before D1 is accessed. This stub keeps that mirror buildable
// without pretending Vercel owns a second member database.
export const env = {
  DB: undefined,
  ADMIN_EMAILS: undefined,
  INSTRUCTOR_EMAILS: undefined,
  REVIEW_MODERATOR_EMAILS: undefined,
} as unknown as Cloudflare.Env;
