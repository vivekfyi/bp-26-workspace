import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RssIngestionService } from '../ingestion/rss-ingestion.service.js';

@Injectable()
export class WorkerRuntimeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkerRuntimeService.name);
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(RssIngestionService) private readonly rssIngestionService: RssIngestionService,
  ) {}

  async onModuleInit(): Promise<void> {
    const workerEnabled = this.configService.get<boolean>('worker.enabled', false);

    if (!workerEnabled) {
      this.logger.log('Worker runtime disabled (WORKER_ENABLED=false)');
      return;
    }

    const intervalMinutes = this.configService.get<number>('ingestion.syncIntervalMinutes', 30);
    const intervalMs = Math.max(1, intervalMinutes) * 60 * 1000;

    this.syncInterval = setInterval(() => {
      void this.rssIngestionService.syncAllSources().catch((error) => {
        this.logger.warn(`Scheduled sync failed: ${(error as Error).message}`);
      });
    }, intervalMs);

    void this.rssIngestionService.syncAllSources().catch((error) => {
      this.logger.warn(`Initial sync failed; scheduler will retry: ${(error as Error).message}`);
    });
    this.logger.log(`Direct scheduler started. Sync interval: ${intervalMinutes} minutes`);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

  }
}
