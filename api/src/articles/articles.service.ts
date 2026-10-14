import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ArticleStatus } from '../generated/prisma/enums.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ListArticlesDto } from './dto/list-articles.dto.js';

@Injectable()
export class ArticlesService {
  constructor(@Inject(PrismaService) private readonly prismaService: PrismaService) {}

  async listProcessedArticles(query: ListArticlesDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const sourceFilter: Prisma.SourceWhereInput = {};

    if (query.category) {
      sourceFilter.category = query.category;
    }

    if (query.licenseType) {
      sourceFilter.licenseType = query.licenseType;
    }

    if (query.topic) {
      sourceFilter.topics = {
        some: {
          topic: {
            slug: query.topic,
          },
        },
      };
    }

    const where: Prisma.ArticleWhereInput = {
      status: ArticleStatus.PROCESSED,
      ...(Object.keys(sourceFilter).length > 0 ? { source: sourceFilter } : {}),
    };

    const [items, total] = await Promise.all([
      this.prismaService.article.findMany({
        where,
        select: {
          id: true,
          sourceId: true,
          originalUrl: true,
          title: true,
          author: true,
          publishedAt: true,
          leadImageUrl: true,
          summaryShort: true,
          summaryBullets: true,
          tags: true,
          readingTimeMinutes: true,
          status: true,
          source: {
            select: {
              id: true,
              name: true,
              category: true,
              licenseType: true,
              language: true,
              trustScore: true,
              siteUrl: true,
              feedUrl: true,
              topics: {
                select: {
                  topic: {
                    select: {
                      slug: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prismaService.article.count({
        where,
      }),
    ]);

    return {
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
      items: items.map((item) => ({
        ...item,
        source: {
          ...item.source,
          topics: item.source.topics.map((sourceTopic) => sourceTopic.topic),
        },
      })),
    };
  }

  async getProcessedArticle(id: string) {
    const article = await this.prismaService.article.findFirst({
      where: {
        id,
        status: ArticleStatus.PROCESSED,
      },
      include: {
        source: {
          select: {
            id: true,
            name: true,
            category: true,
            licenseType: true,
            language: true,
            trustScore: true,
            siteUrl: true,
            feedUrl: true,
            topics: {
              select: {
                topic: {
                  select: {
                    slug: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!article) {
      throw new NotFoundException('Processed article not found');
    }

    return {
      ...article,
      source: {
        ...article.source,
        topics: article.source.topics.map((sourceTopic) => sourceTopic.topic),
      },
    };
  }
}
