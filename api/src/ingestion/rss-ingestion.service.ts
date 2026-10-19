import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import Parser from 'rss-parser';
import { Prisma, ArticleStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SyncSummary } from '../pipeline/pipeline.types.js';
import { ExtractorService } from '../extraction/extractor.service.js';
import { AiEnrichmentService } from '../enrichment/ai-enrichment.service.js';

@Injectable()
export class RssIngestionService {
  private readonly logger = new Logger(RssIngestionService.name);
  private readonly parser = new Parser<Record<string, never>, Record<string, unknown>>();

  constructor(
    @Inject(PrismaService) private readonly prismaService: PrismaService,
    @Inject(ExtractorService) private readonly extractorService: ExtractorService,
    @Inject(AiEnrichmentService) private readonly aiEnrichmentService: AiEnrichmentService,
  ) {}

  async triggerSync(): Promise<SyncSummary> {
    return this.syncAllSources();
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

          await this.processArticle({
            articleId: article.id,
            sourceCategory: source.category,
            sourceTopics: source.topics.map((sourceTopic) => sourceTopic.topic.slug),
            sourceLicenseType: source.licenseType,
            sourceLanguage: source.language,
            rssContent: this.resolveSnippet(entry),
            rssImageUrl: this.resolveImageUrl(entry),
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

  async reprocessSourceArticles(sourceId: string) {
    const source = await this.prismaService.source.findUnique({
      where: { id: sourceId },
      include: {
        topics: { include: { topic: { select: { slug: true } } } },
        articles: { select: { id: true }, orderBy: { publishedAt: 'desc' } },
      },
    });

    if (!source) throw new NotFoundException('Source not found');

    let processed = 0;
    let failed = 0;
    for (const article of source.articles) {
      await this.prismaService.article.update({ where: { id: article.id }, data: { status: ArticleStatus.PENDING } });
      await this.processArticle({
        articleId: article.id,
        sourceCategory: source.category,
        sourceTopics: source.topics.map((sourceTopic) => sourceTopic.topic.slug),
        sourceLicenseType: source.licenseType,
        sourceLanguage: source.language,
        rssContent: null,
        rssImageUrl: null,
      });
      const result = await this.prismaService.article.findUnique({ where: { id: article.id }, select: { status: true } });
      if (result?.status === ArticleStatus.PROCESSED) processed += 1;
      else failed += 1;
    }

    return { sourceId, total: source.articles.length, processed, failed };
  }

  private async processArticle(payload: {
    articleId: string;
    sourceCategory: string;
    sourceTopics: string[];
    sourceLicenseType: string;
    sourceLanguage: string;
    rssContent: string | null;
    rssImageUrl: string | null;
  }): Promise<void> {
    const article = await this.prismaService.article.findUnique({
      where: { id: payload.articleId },
      include: { source: true },
    });

    if (!article) return;

    try {
      const extracted = await this.extractorService.extractArticle(
        article.originalUrl,
        payload.rssContent,
        article.author,
      );
      const enriched = await this.aiEnrichmentService.enrichArticle(
        extracted.fullText,
        [payload.sourceCategory, ...payload.sourceTopics, `license:${payload.sourceLicenseType}`, `language:${payload.sourceLanguage}`].join(', '),
      );
      await this.prismaService.article.update({
        where: { id: article.id },
        data: {
          author: extracted.author,
          leadImageUrl: extracted.leadImageUrl ?? article.leadImageUrl ?? payload.rssImageUrl,
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
        data: { status: ArticleStatus.FAILED },
      });
      this.logger.warn(`Failed processing article ${article.id}: ${(error as Error).message}`);
    }
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

  private resolveImageUrl(entry: Record<string, unknown>): string | null {
    const candidates: unknown[] = [entry.image, entry['media:content'], entry['media:thumbnail'], entry.enclosure, entry['itunes:image']];
    for (const candidate of candidates) {
      for (const value of Array.isArray(candidate) ? candidate : [candidate]) {
        const url = typeof value === 'string'
          ? value
          : value && typeof value === 'object'
            ? this.safeString((value as Record<string, unknown>).url) ?? this.safeString((value as Record<string, unknown>).href) ?? this.safeString((value as Record<string, unknown>)['@_url'])
            : null;
        if (!url) continue;
        try {
          const parsed = new URL(url);
          if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.toString();
        } catch {
          // Ignore malformed feed image values.
        }
      }
    }

    const imageMatch = this.resolveSnippet(entry)?.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imageMatch?.[1]) {
      try {
        const parsed = new URL(imageMatch[1]);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.toString();
      } catch {
        // Ignore malformed HTML image values.
      }
    }
    return null;
  }

  private safeString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
  }
}
