import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrapWorker() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: false,
  });

  console.log('Worker application context started');

  const shutdown = async () => {
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void shutdown();
  });

  process.on('SIGTERM', () => {
    void shutdown();
  });
}

void bootstrapWorker();
