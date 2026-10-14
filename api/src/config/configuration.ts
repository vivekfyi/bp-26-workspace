import type { EnvironmentVariables } from './env.schema.js';

export function buildConfiguration(env: EnvironmentVariables) {
  return {
    app: {
      nodeEnv: env.NODE_ENV,
      port: env.PORT,
      apiPrefix: env.API_PREFIX,
      corsOrigin: env.CORS_ORIGIN,
      logLevel: env.LOG_LEVEL,
      swaggerEnabled: env.SWAGGER_ENABLED,
    },
    database: {
      url: env.DATABASE_URL,
    },
    ai: {
      provider: 'openai',
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL,
    },
    ingestion: {
      syncIntervalMinutes: env.FEED_SYNC_INTERVAL_MINUTES,
      extractionTimeoutMs: env.ARTICLE_EXTRACTION_TIMEOUT_MS,
    },
    rateLimit: {
      ttl: env.RATE_LIMIT_TTL,
      limit: env.RATE_LIMIT_LIMIT,
    },
    observability: {
      sentryEnabled: env.SENTRY_ENABLED,
      sentryDsn: env.SENTRY_DSN,
    },
    auth: {
      enabled: env.AUTH_ENABLED,
      jwtSecret: env.AUTH_JWT_SECRET,
      accessTtl: env.AUTH_JWT_ACCESS_TTL,
      refreshTtl: env.AUTH_JWT_REFRESH_TTL,
    },
    mail: {
      enabled: env.MAIL_ENABLED,
    },
    otp: {
      enabled: env.OTP_ENABLED,
    },
    storage: {
      enabled: env.STORAGE_ENABLED,
    },
    worker: {
      enabled: env.WORKER_ENABLED,
    },
    realtime: {
      enabled: env.REALTIME_ENABLED,
    },
    apiKeys: {
      enabled: env.API_KEYS_ENABLED,
    },
    push: {
      enabled: env.PUSH_ENABLED,
    },
  };
}

export type AppConfig = ReturnType<typeof buildConfiguration>;
