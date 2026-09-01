export { env } from "./env";

import { env } from "./env";

export const config = {
  app: {
    name: env.NEXT_PUBLIC_APP_NAME,
    url: env.NEXT_PUBLIC_APP_URL,
    isDev: env.NODE_ENV === "development",
    isStaging: env.NODE_ENV === "staging",
    isProd: env.NODE_ENV === "production",
    env: env.NODE_ENV,
  },
  auth: {
    secret: env.AUTH_SECRET,
  },
  db: {
    url: env.DATABASE_URL,
  },
  ai: {
    openaiKey: env.OPENAI_API_KEY,
    anthropicKey: env.ANTHROPIC_API_KEY,
  },
  storage: {
    bucket: env.S3_BUCKET,
    region: env.S3_REGION,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
  notifications: {
    resendApiKey: env.RESEND_API_KEY,
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  },
  logging: {
    level: env.LOG_LEVEL,
  },
} as const;
