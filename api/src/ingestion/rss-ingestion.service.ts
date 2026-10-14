import { Inject, Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import Parser from 'rss-parser';
import { Prisma, ArticleStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PipelineQueueService } from '../pipeline/pipeline-queue.service.js';
import {
  PROCESS_ARTICLE_JOB,
  SYNC_ALL_SOURCES_JOB,
} from '../pipeline/pipeline.constants.js';
import {
  ProcessArticleJobData,
  SyncSummary,
} from '../pipeline/pipeline.types.js';

@Injectable()
export class RssIngestionService {
  private readonly logger = new Logger(RssIngestionService.name);
  private readonly parser = new Parser<Record<string, never>, Record<string, unknown>>();

  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
    @Inject(PipelineQueueService) private readonly pipelineQueueService: PipelineQueueService,
  ) {}

  async triggerSync(): Promise<Job> {
    return this.pipelineQueueService.syncQueue.add(
      SYNC_ALL_SOURCES_JOB,
      {},
      {
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    );
  }

  async syncAllSources(): Promise<SyncSummary> {
    const sources = await this.prismaService.source.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      include: {
        topics: {
          include: {
            topic: {
              select: {
                slug: true,
              },
            },
          },
        },
      },
    });

    const summary: SyncSummary = {
      totalSources: sources.length,
      totalItems: 0,
      enqueued: 0,
      skippedExisting: 0,
      erroredSources: 0,
    };

    for (const source of sources) {
      try {
        const feed = await this.parser.parseURL(source.feedUrl);
        const entries = feed.items ?? [];

        summary.totalItems += entries.length;

        for (const entry of entries) {
          const originalUrl = this.resolveOriginalUrl(entry);

          if (!originalUrl) {
            continue;
          }

          const existing = await this.prismaService.article.findUnique({
            where: { originalUrl },
            select: { id: true },
          });

          if (existing) {
            summary.skippedExisting += 1;
            continue;
          }

          const article = await this.createPendingArticle({
            sourceId: source.id,
            originalUrl,
            title: this.safeString(entry.title) || originalUrl,
            author: this.resolveAuthor(entry),
            publishedAt: this.resolvePublishedAt(entry),
          });

          if (!article) {
            summary.skippedExisting += 1;
            continue;
          }

          const jobPayload: ProcessArticleJobData = {
            articleId: article.id,
            sourceCategory: source.category,
            sourceTopics: source.topics.map((sourceTopic) => sourceTopic.topic.slug),
            sourceLicenseType: source.licenseType,
            sourceLanguage: source.language,
            rssContent: this.resolveSnippet(entry),
          };

          await this.pipelineQueueService.articleQueue.add(PROCESS_ARTICLE_JOB, jobPayload, {
            removeOnComplete: 200,
            removeOnFail: 300,
            attempts: 2,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
          });

          summary.enqueued += 1;
        }

        await this.prismaService.source.update({
          where: { id: source.id },
          data: { lastPolledAt: new Date() },
        });
      } catch (error) {
        summary.erroredSources += 1;
        this.logger.warn(`Failed syncing source ${source.feedUrl}: ${(error as Error).message}`);
      }
    }

    return summary;
  }

  private async createPendingArticle(input: {
    sourceId: string;
    originalUrl: string;
    title: string;
    author: string | null;
    publishedAt: Date;
  }) {
    try {
      return await this.prismaService.article.create({
        data: {
          sourceId: input.sourceId,
          originalUrl: input.originalUrl,
          title: input.title,
          author: input.author,
          publishedAt: input.publishedAt,
          status: ArticleStatus.PENDING,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return null;
      }

      throw error;
    }
  }

  private resolveOriginalUrl(entry: Record<string, unknown>): string | null {
    const candidates = [
      this.safeString(entry.link),
      this.safeString(entry.guid),
      this.safeString(entry.id),
    ].filter(Boolean);

    for (const value of candidates) {
      if (!value) {
        continue;
      }

      try {
        return new URL(value).toString();
      } catch {
        continue;
      }
    }

    return null;
  }

  private resolveAuthor(entry: Record<string, unknown>): string | null {
    return (
      this.safeString(entry.creator) ??
      this.safeString(entry.author) ??
      this.safeString(entry['dc:creator']) ??
      null
    );
  }

  private resolvePublishedAt(entry: Record<string, unknown>): Date {
    const candidates = [
      this.safeString(entry.isoDate),
      this.safeString(entry.pubDate),
      this.safeString(entry.published),
    ].filter(Boolean);

    for (const value of candidates) {
      if (!value) {
        continue;
      }

      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }

    return new Date();
  }

  private resolveSnippet(entry: Record<string, unknown>): string | null {
    return (
      this.safeString(entry['content:encoded']) ??
      this.safeString(entry.content) ??
      this.safeString(entry.contentSnippet) ??
      this.safeString(entry.summary) ??
      null
    );
  }

  private safeString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
  }
}
