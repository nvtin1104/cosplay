interface Env {
  DB: D1Database;
  MEDIA?: R2Bucket;
  CORS_ORIGIN?: string;
  APP_URL?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
}
