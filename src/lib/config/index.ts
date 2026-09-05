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
    provider: env.AI_PROVIDER,
    chatBaseUrl: env.AI_CHAT_BASE_URL,
    chatModel: env.AI_CHAT_MODEL,
    timeoutMs: env.AI_TIMEOUT_MS,
    openaiKey: env.OPENAI_API_KEY,
    anthropicKey: env.ANTHROPIC_API_KEY,
    openrouter: {
      apiKey: env.OPENROUTER_API_KEY,
      model: env.OPENROUTER_MODEL,
      baseUrl: env.OPENROUTER_BASE_URL,
    },
    ollama: {
      baseUrl: env.OLLAMA_BASE_URL,
      model: env.OLLAMA_MODEL,
    },
  },
  storage: {
    bucket: env.S3_BUCKET,
    region: env.S3_REGION,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    supabaseUrl: env.SUPABASE_URL,
    supabaseServiceKey: env.SUPABASE_SERVICE_ROLE_KEY,
    docsBucket: env.SUPABASE_DOCS_BUCKET,
  },
  notifications: {
    resendApiKey: env.RESEND_API_KEY,
    from: env.EMAIL_FROM,
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
