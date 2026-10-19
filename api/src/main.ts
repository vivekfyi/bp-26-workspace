import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express from 'express';
import helmet from 'helmet';
import next from 'next';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './filters/http-exception.filter.js';
import { PrismaService } from './prisma/prisma.service.js';

type NextApplication = {
  prepare: () => Promise<void>;
  getRequestHandler: () => (request: express.Request, response: express.Response) => void;
};

type NextFactory = (options: { dev: boolean; dir: string }) => NextApplication;

async function bootstrap() {
  const webServer = express();
  const createNextApp = next as unknown as NextFactory;
  const nextApp = createNextApp({
    dev: process.env.NODE_ENV !== 'production',
    dir: resolve(process.cwd(), 'web'),
  });

  await nextApp.prepare();

  const app = await NestFactory.create(AppModule, new ExpressAdapter(webServer), {
    bufferLogs: true,
  });

  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  const configService = app.get(ConfigService);

  const isDevelopment = process.env.NODE_ENV !== 'production';
  const clerkOrigins = [
    'https://*.clerk.accounts.dev',
    'https://clerk.scroll0.com',
    'https://accounts.scroll0.com',
    'https://clerk-telemetry.com',
    'https://*.clerk-telemetry.com',
    'https://*.protect.clerk.com',
    'https://*.protect.clerk.com:*',
    'https://challenges.cloudflare.com',
  ];

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          connectSrc: ["'self'", ...clerkOrigins, ...(isDevelopment ? ['ws:', 'http:'] : [])],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          formAction: ["'self'"],
          frameAncestors: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:', 'https://img.clerk.com'],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'", "'unsafe-inline'", ...clerkOrigins, ...(isDevelopment ? ["'unsafe-eval'"] : [])],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          frameSrc: ["'self'", ...clerkOrigins],
          workerSrc: ["'self'", 'blob:'],
          upgradeInsecureRequests: null,
        },
      },
    }),
  );

  app.enableCors({
    origin: configService.get<string>('app.corsOrigin') ?? '*',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidUnknownValues: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const apiPrefix = configService.get<string>('app.apiPrefix') ?? 'api';
  app.setGlobalPrefix(apiPrefix);

  const swaggerEnabled = configService.get<boolean>('app.swaggerEnabled') ?? true;

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('API Boilerplate')
      .setDescription('NestJS 12 + Prisma 7 reusable boilerplate')
      .setVersion('0.1.0')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
  }

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  const port = configService.get<number>('app.port') ?? 3000;
  const handleNextRequest = nextApp.getRequestHandler();

  await app.init();

  webServer.use((request, response) => handleNextRequest(request, response));

  await new Promise<void>((resolveServer) => {
    createServer(webServer).listen(port, resolveServer);
  });
}

bootstrap();
