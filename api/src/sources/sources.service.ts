import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { RssIngestionService } from '../ingestion/rss-ingestion.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ListSourcesDto } from './dto/list-sources.dto.js';

@Injectable()
export class SourcesService {
  constructor(
    private readonly rssIngestionService: RssIngestionService,
    private readonly prismaService: PrismaService,
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

    const skip = (query.page - 1) * query.limit;

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
        },
        orderBy: [{ trustScore: 'desc' }, { name: 'asc' }],
        skip,
        take: query.limit,
      }),
      this.prismaService.source.count({ where }),
    ]);

    return {
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
      items: items.map((source) => ({
        ...source,
        topics: source.topics.map((sourceTopic) => sourceTopic.topic),
      })),
    };
  }

  async triggerSync() {
    const job = await this.rssIngestionService.triggerSync();

    return {
      status: 'queued',
      queue: job.queueName,
      jobId: job.id,
      jobName: job.name,
      timestamp: new Date().toISOString(),
    };
  }
}
