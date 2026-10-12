import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { buildConfiguration } from './configuration.js';
import { validateEnvironment } from './env.schema.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
      load: [() => buildConfiguration(validateEnvironment(process.env))],
    }),
  ],
})
export class AppConfigModule {}
