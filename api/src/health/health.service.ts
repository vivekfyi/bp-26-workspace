import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';

@Injectable()
export class HealthService {
  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
    @Inject(RedisService) private readonly redisService: RedisService,
  ) {}

  async check() {
    const startedAt = Date.now();

    await this.prismaService.$queryRaw`SELECT 1`;
    const redisPong = await this.redisService.ping();

    return {
      status: 'ok',
      database: 'up',
      redis: redisPong === 'PONG' ? 'up' : 'down',
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    };
  }
}
