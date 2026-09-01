import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production"]).default("development"),
  NEXT_PUBLIC_APP_NAME: z.string().default("tulsi"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  DATABASE_URL: z.string().url(),

  AUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().default("http://localhost:3000"),

  OPENAI_API_KEY: z.string().optional().default(""),
  ANTHROPIC_API_KEY: z.string().optional().default(""),

  S3_BUCKET: z.string().optional().default(""),
  S3_REGION: z.string().optional().default(""),
  S3_ACCESS_KEY_ID: z.string().optional().default(""),
  S3_SECRET_ACCESS_KEY: z.string().optional().default(""),

  RESEND_API_KEY: z.string().optional().default(""),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),

  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
