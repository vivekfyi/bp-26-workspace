import { INestApplication, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { AppController } from '../src/app.controller.js';
import { AppService } from '../src/app.service.js';

@Module({
  controllers: [AppController],
  providers: [AppService],
})
class E2ETestAppModule {}

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await NestFactory.create(E2ETestAppModule, { logger: false });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((response) => {
        expect(response.body.name).toBe('api-boilerplate');
      });
  });
});
