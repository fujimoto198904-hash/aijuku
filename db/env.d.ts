declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    ADMIN_EMAILS?: string;
    INSTRUCTOR_EMAILS?: string;
    REVIEW_MODERATOR_EMAILS?: string;
  }
}
