import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import { RedisService } from '../redis/redis.service.js';
import { ARTICLE_PROCESSING_QUEUE, INGESTION_SYNC_QUEUE } from './pipeline.constants.js';

@Injectable()
export class PipelineQueueService implements OnModuleDestroy {
  private readonly syncQueueInstance: Queue;
  private readonly articleQueueInstance: Queue;

  constructor(@Inject(RedisService) private readonly redisService: RedisService) {
    this.syncQueueInstance = new Queue(INGESTION_SYNC_QUEUE, {
      connection: this.redisService.duplicate(),
    });

    this.articleQueueInstance = new Queue(ARTICLE_PROCESSING_QUEUE, {
      connection: this.redisService.duplicate(),
    });
  }

  get syncQueue(): Queue {
    return this.syncQueueInstance;
  }

  get articleQueue(): Queue {
    return this.articleQueueInstance;
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([this.syncQueueInstance.close(), this.articleQueueInstance.close()]);
  }
}
