import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AppConfigModule } from './config/config.module.js';
import { createWinstonOptions } from './common/logging/winston.config.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RedisModule } from './redis/redis.module.js';
import { HealthModule } from './health/health.module.js';
import { ExampleModule } from './example/example.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { MailModule } from './mail/mail.module.js';
import { OtpModule } from './otp/otp.module.js';
import { StorageModule } from './storage/storage.module.js';
import { WorkerModule } from './worker/worker.module.js';
import { CommandsModule } from './commands/commands.module.js';
import { PipelineModule } from './pipeline/pipeline.module.js';
import { IngestionModule } from './ingestion/ingestion.module.js';
import { SourcesModule } from './sources/sources.module.js';
import { ArticlesModule } from './articles/articles.module.js';

function envFlag(name: string): boolean {
  return process.env[name]?.toLowerCase() === 'true';
}

@Module({
  imports: [
    AppConfigModule,
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createWinstonOptions(configService.get<string>('app.logLevel') ?? 'info'),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('rateLimit.ttl', 60) * 1000,
          limit: configService.get<number>('rateLimit.limit', 100),
        },
      ],
    }),
    PrismaModule,
    RedisModule,
    PipelineModule,
    IngestionModule,
    HealthModule,
    SourcesModule,
    ArticlesModule,
    ExampleModule,
    AuthModule.register(envFlag('AUTH_ENABLED')),
    UsersModule.register(envFlag('AUTH_ENABLED')),
    MailModule.register(envFlag('MAIL_ENABLED')),
    OtpModule.register(envFlag('OTP_ENABLED')),
    StorageModule.register(envFlag('STORAGE_ENABLED')),
    WorkerModule.register(envFlag('WORKER_ENABLED')),
    CommandsModule.register(envFlag('WORKER_ENABLED')),
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule {}
