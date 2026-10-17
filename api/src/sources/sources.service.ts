import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { RssIngestionService } from '../ingestion/rss-ingestion.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ListSourcesDto } from './dto/list-sources.dto.js';
import { CreateSourceDto } from './dto/create-source.dto.js';
import { UpdateSourceDto } from './dto/update-source.dto.js';

@Injectable()
export class SourcesService {
  constructor(
    @Inject(RssIngestionService) private readonly rssIngestionService: RssIngestionService,
    @Inject(PrismaService) private readonly prismaService: PrismaService,
  ) {}

  async listSources(query: ListSourcesDto) {
    const where: Prisma.SourceWhereInput = {
      category: query.category,
      isActive: query.isActive,
      licenseType: query.licenseType,
      topics: query.topic
        ? {
            some: {
              topic: {
                slug: query.topic,
              },
            },
          }
        : undefined,
    };

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prismaService.source.findMany({
        where,
        include: {
          topics: {
            include: {
              topic: {
                select: {
                  slug: true,
                  name: true,
                },
              },
            },
          },
          _count: { select: { articles: true } },
        },
        orderBy: [{ trustScore: 'desc' }, { name: 'asc' }],
        skip,
        take: limit,
      }),
      this.prismaService.source.count({ where }),
    ]);

    return {
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      items: items.map((source) => ({
        ...source,
        topics: source.topics.map((sourceTopic) => sourceTopic.topic),
      })),
    };
  }

  async listTopics() {
    return this.prismaService.topic.findMany({
      where: { isActive: true },
      select: { slug: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  async createSource(input: CreateSourceDto) {
    const topicIds = await this.resolveTopicIds(input.topicSlugs);
    return this.prismaService.source.create({
      data: {
        name: input.name.trim(),
        feedUrl: input.feedUrl.trim(),
        siteUrl: input.siteUrl.trim(),
        category: input.category.trim(),
        language: input.language?.trim() || 'en',
        trustScore: input.trustScore ?? 50,
        licenseType: input.licenseType ?? 'MIXED_UNKNOWN',
        topics: { create: topicIds.map((topicId) => ({ topicId })) },
      },
      include: { topics: { include: { topic: { select: { slug: true, name: true } } } } },
    });
  }

  async updateSource(id: string, input: UpdateSourceDto) {
    const topicIds = input.topicSlugs === undefined ? undefined : await this.resolveTopicIds(input.topicSlugs);
    const updated = await this.prismaService.$transaction(async (tx) => {
      const existing = await tx.source.findUnique({ where: { id }, select: { id: true } });
      if (!existing) throw new NotFoundException('Source not found');

      if (topicIds !== undefined) {
        await tx.sourceTopic.deleteMany({ where: { sourceId: id } });
        if (topicIds.length > 0) {
          await tx.sourceTopic.createMany({ data: topicIds.map((topicId) => ({ sourceId: id, topicId })) });
        }
      }

      return tx.source.update({
        where: { id },
        data: {
          name: input.name?.trim(),
          feedUrl: input.feedUrl?.trim(),
          siteUrl: input.siteUrl?.trim(),
          category: input.category?.trim(),
          language: input.language?.trim(),
          trustScore: input.trustScore,
          licenseType: input.licenseType,
          isActive: input.isActive,
        },
        include: { topics: { include: { topic: { select: { slug: true, name: true } } } } },
      });
    });
    return updated;
  }

  async deleteSource(id: string) {
    return this.prismaService.$transaction(async (tx) => {
      const existing = await tx.source.findUnique({ where: { id }, select: { id: true } });
      if (!existing) throw new NotFoundException('Source not found');
      await tx.article.deleteMany({ where: { sourceId: id } });
      await tx.source.delete({ where: { id } });
      return { deleted: true, id };
    });
  }

  private async resolveTopicIds(slugs: string[]) {
    const topics = await this.prismaService.topic.findMany({
      where: { slug: { in: slugs } },
      select: { id: true, slug: true },
    });
    const found = new Set(topics.map((topic) => topic.slug));
    const missing = slugs.filter((slug) => !found.has(slug));
    if (missing.length > 0) throw new NotFoundException(`Unknown topic(s): ${missing.join(', ')}`);
    return topics.map((topic) => topic.id);
  }

  async triggerSync() {
    const summary = await this.rssIngestionService.triggerSync();

    return {
      status: 'completed',
      summary,
      timestamp: new Date().toISOString(),
    };
  }
}
