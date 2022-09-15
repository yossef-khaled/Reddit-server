declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      REDIS_URL: string;
      PORT: string;
      SESSION_SECRET: string;
      CORS_ORIGIN_1: string;
      CORS_ORIGIN_2: string;
      MAILTRAP_USERNAME: string;
      MAILTRAP_PASSWORD: string;
      GMAIL_SMTP_PASSWORD: string;
    }
  }
}

export {}
