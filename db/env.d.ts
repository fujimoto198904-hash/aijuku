declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    ADMIN_EMAILS?: string;
    INSTRUCTOR_EMAILS?: string;
    AUTH_PASSWORD_PEPPER?: string;
    AUTH_OWNER_LOGIN_ID?: string;
    AUTH_OWNER_MEMBER_ID?: string;
    GOOGLE_CALENDAR_CLIENT_ID?: string;
    GOOGLE_CALENDAR_CLIENT_SECRET?: string;
    GOOGLE_CALENDAR_OWNER_EMAIL?: string;
    GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY?: string;
    STRIPE_ACCOUNT_ID?: string;
    STRIPE_BILLING_MODE?: string;
    STRIPE_SECRET_KEY?: string;
    STRIPE_WEBHOOK_SECRET?: string;
  }
}
