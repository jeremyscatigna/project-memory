import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    POLAR_ACCESS_TOKEN: z.string().optional(),
    POLAR_PRODUCT_ID: z.string().optional(),
    POLAR_SUCCESS_URL: z.string().url().optional(),
    CORS_ORIGIN: z.url(),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),

    // OAuth providers (optional)
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),

    // Email (Resend)
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().email().optional(),

    // AI providers (optional)
    AI_PROVIDER: z
      .enum(["openai", "anthropic", "google", "groq"])
      .default("google"),
    OPENAI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
    GROQ_API_KEY: z.string().optional(),
    TAVILY_API_KEY: z.string().optional(),

    // Observability (optional)
    LANGFUSE_SECRET_KEY: z.string().optional(),
    LANGFUSE_PUBLIC_KEY: z.string().optional(),
    LANGFUSE_HOST: z.string().url().optional(),

    // Sentry (optional)
    SENTRY_DSN: z.string().url().optional(),
    SENTRY_ENVIRONMENT: z.string().default("development"),

    // Trigger.dev (optional)
    TRIGGER_SECRET_KEY: z.string().optional(),

    // Redis (optional, for rate limiting & caching)
    REDIS_URL: z.string().optional(),

    // S3/R2 Storage (optional)
    S3_ENDPOINT: z.string().url().optional(),
    S3_REGION: z.string().default("auto"),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    S3_BUCKET: z.string().optional(),
    S3_PUBLIC_URL: z.string().url().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
