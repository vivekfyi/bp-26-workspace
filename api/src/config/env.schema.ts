import { z } from 'zod';

const booleanFromString = z.preprocess((value) => {
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  return value;
}, z.boolean());

const numberFromString = z.preprocess((value) => {
  if (typeof value === 'string') {
    return Number(value);
  }

  return value;
}, z.number().int().positive());

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: numberFromString.default(3000),
  API_PREFIX: z.string().default('api'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  FEED_SYNC_INTERVAL_MINUTES: numberFromString.default(30),
  ARTICLE_EXTRACTION_TIMEOUT_MS: numberFromString.default(15000),
  CORS_ORIGIN: z.string().default('*'),
  LOG_LEVEL: z.string().default('info'),
  RATE_LIMIT_TTL: numberFromString.default(60),
  RATE_LIMIT_LIMIT: numberFromString.default(100),
  SWAGGER_ENABLED: booleanFromString.default(true),
  SENTRY_ENABLED: booleanFromString.default(false),
  SENTRY_DSN: z.string().optional(),

  AUTH_ENABLED: booleanFromString.default(false),
  AUTH_JWT_SECRET: z.string().default('change-me'),
  AUTH_JWT_ACCESS_TTL: z.string().default('15m'),
  AUTH_JWT_REFRESH_TTL: z.string().default('7d'),

  MAIL_ENABLED: booleanFromString.default(false),
  OTP_ENABLED: booleanFromString.default(false),
  STORAGE_ENABLED: booleanFromString.default(false),
  WORKER_ENABLED: booleanFromString.default(false),
  REALTIME_ENABLED: booleanFromString.default(false),
  API_KEYS_ENABLED: booleanFromString.default(false),
  PUSH_ENABLED: booleanFromString.default(false),
});

export type EnvironmentVariables = z.infer<typeof envSchema>;

export function validateEnvironment(config: Record<string, unknown>): EnvironmentVariables {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    throw new Error(`Environment validation failed: ${result.error.message}`);
  }

  const env = result.data;

  if (env.AUTH_ENABLED && env.AUTH_JWT_SECRET === 'change-me') {
    throw new Error('Environment validation failed: AUTH_JWT_SECRET must be set when AUTH_ENABLED=true');
  }

  return env;
}
