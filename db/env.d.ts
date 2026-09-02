declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    ADMIN_EMAILS?: string;
    INSTRUCTOR_EMAILS?: string;
    AUTH_PASSWORD_PEPPER?: string;
    AUTH_OWNER_LOGIN_ID?: string;
  }
}
