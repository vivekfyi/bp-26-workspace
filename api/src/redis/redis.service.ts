import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis as RedisClass, type Redis as RedisClient } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redisClient: RedisClient;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('redis.url');

    if (!redisUrl) {
      throw new Error('REDIS_URL is required for RedisService');
    }

    this.redisClient = new RedisClass(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
  }

  get client(): RedisClient {
    return this.redisClient;
  }

  duplicate(): RedisClient {
    return this.redisClient.duplicate();
  }

  async ping(): Promise<string> {
    return this.redisClient.ping();
  }

  async onModuleDestroy(): Promise<void> {
    await this.redisClient.quit();
  }
}
