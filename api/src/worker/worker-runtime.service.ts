import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Worker } from 'bullmq';
import { ArticleStatus } from '../generated/prisma/client.js';
import { RssIngestionService } from '../ingestion/rss-ingestion.service.js';
import { ProcessArticleJobData } from '../pipeline/pipeline.types.js';
import {
  ARTICLE_PROCESSING_QUEUE,
  INGESTION_SYNC_QUEUE,
  PROCESS_ARTICLE_JOB,
  SYNC_ALL_SOURCES_JOB,
} from '../pipeline/pipeline.constants.js';
import { RedisService } from '../redis/redis.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ExtractorService } from '../extraction/extractor.service.js';
import { AiEnrichmentService } from '../enrichment/ai-enrichment.service.js';

@Injectable()
export class WorkerRuntimeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkerRuntimeService.name);
  private syncWorker: Worker | null = null;
  private articleWorker: Worker | null = null;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(
    @Inject(RedisService) private readonly redisService: RedisService,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(RssIngestionService) private readonly rssIngestionService: RssIngestionService,
    @Inject(PrismaService) private readonly prismaService: PrismaService,
    @Inject(ExtractorService) private readonly extractorService: ExtractorService,
    @Inject(AiEnrichmentService) private readonly aiEnrichmentService: AiEnrichmentService,
  ) {}

  async onModuleInit(): Promise<void> {
    const workerEnabled = this.configService.get<boolean>('worker.enabled', false);

    if (!workerEnabled) {
      this.logger.log('Worker runtime disabled (WORKER_ENABLED=false)');
      return;
    }

    this.syncWorker = new Worker(
      INGESTION_SYNC_QUEUE,
      async (job) => {
        if (job.name !== SYNC_ALL_SOURCES_JOB) {
          return null;
        }

        return this.rssIngestionService.syncAllSources();
      },
      {
        connection: this.redisService.duplicate(),
      },
    );

    this.articleWorker = new Worker(
      ARTICLE_PROCESSING_QUEUE,
      async (job: Job<ProcessArticleJobData>) => {
        if (job.name !== PROCESS_ARTICLE_JOB) {
          return null;
        }

        return this.processArticle(job.data);
      },
      {
        connection: this.redisService.duplicate(),
        concurrency: 3,
      },
    );

    this.syncWorker.on('failed', (job, error) => {
      this.logger.warn(`Sync worker job ${job?.id ?? 'unknown'} failed: ${error.message}`);
    });

    this.articleWorker.on('failed', (job, error) => {
      this.logger.warn(`Article job ${job?.id ?? 'unknown'} failed: ${error.message}`);
    });

    const intervalMinutes = this.configService.get<number>('ingestion.syncIntervalMinutes', 30);
    const intervalMs = Math.max(1, intervalMinutes) * 60 * 1000;

    this.syncInterval = setInterval(() => {
      void this.rssIngestionService.triggerSync().catch((error) => {
        this.logger.warn(`Failed to enqueue interval sync: ${(error as Error).message}`);
      });
    }, intervalMs);

    void this.rssIngestionService.triggerSync();
    this.logger.log(`Worker runtime started. Sync interval: ${intervalMinutes} minutes`);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    await Promise.all([
      this.syncWorker?.close() ?? Promise.resolve(),
      this.articleWorker?.close() ?? Promise.resolve(),
    ]);
  }

  private async processArticle(payload: ProcessArticleJobData): Promise<{ articleId: string }> {
    const article = await this.prismaService.article.findUnique({
      where: { id: payload.articleId },
      include: { source: true },
    });

    if (!article) {
      return { articleId: payload.articleId };
    }

    try {
      const extracted = await this.extractorService.extractArticle(
        article.originalUrl,
        payload.rssContent,
        article.author,
      );

      const enriched = await this.aiEnrichmentService.enrichArticle(
        extracted.fullText,
        this.buildEnrichmentContext(payload),
      );

      await this.prismaService.article.update({
        where: { id: article.id },
        data: {
          author: extracted.author,
          leadImageUrl: extracted.leadImageUrl,
          fullText: extracted.fullText,
          summaryShort: enriched.summaryShort,
          summaryBullets: enriched.summaryBullets,
          tags: enriched.tags,
          readingTimeMinutes: extracted.readingTimeMinutes,
          status: ArticleStatus.PROCESSED,
        },
      });
    } catch (error) {
      await this.prismaService.article.update({
        where: { id: article.id },
        data: {
          status: ArticleStatus.FAILED,
        },
      });

      throw error;
    }

    return { articleId: article.id };
  }

  private buildEnrichmentContext(payload: ProcessArticleJobData): string {
    const contextParts: string[] = [payload.sourceCategory];

    if (payload.sourceTopics && payload.sourceTopics.length > 0) {
      contextParts.push(...payload.sourceTopics);
    }

    if (payload.sourceLicenseType) {
      contextParts.push(`license:${payload.sourceLicenseType}`);
    }

    if (payload.sourceLanguage) {
      contextParts.push(`language:${payload.sourceLanguage}`);
    }

    return contextParts.join(', ');
  }
}
