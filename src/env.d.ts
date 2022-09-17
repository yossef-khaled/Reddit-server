declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      REDIS_URL: string;
      PORT: string;
      SESSION_SECRET: string;
      CORS_ORIGIN_1: string;
      CORS_ORIGIN_2: string;
      GMAIL_SMTP_PASSWORD: string;
      GMAIL_SMTP_USERNAME: string;
    }
  }
}

export {}
