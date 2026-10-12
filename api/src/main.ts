import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './filters/http-exception.filter.js';
import { PrismaService } from './prisma/prisma.service.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  const configService = app.get(ConfigService);

  app.use(helmet());

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
  await app.listen(port);
}

bootstrap();
