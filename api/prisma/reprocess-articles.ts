import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ArticleStatus } from '../src/generated/prisma/enums.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { ExtractorService } from '../src/extraction/extractor.service.js';
import { AiEnrichmentService } from '../src/enrichment/ai-enrichment.service.js';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const prismaService = app.get(PrismaService);
  const extractorService = app.get(ExtractorService);
  const aiEnrichmentService = app.get(AiEnrichmentService);
  const limit = Number(process.env.REPROCESS_LIMIT ?? 100);

  const articles = await prismaService.article.findMany({
    where: { fullText: null },
    include: {
      source: {
        include: {
          topics: {
            include: { topic: true },
          },
        },
      },
    },
    orderBy: { publishedAt: 'desc' },
    take: Number.isFinite(limit) && limit > 0 ? limit : 100,
  });

  for (const article of articles) {
    await prismaService.article.update({
      where: { id: article.id },
      data: { status: ArticleStatus.PENDING },
    });

    try {
      const extracted = await extractorService.extractArticle(article.originalUrl, null, article.author);
      const enriched = await aiEnrichmentService.enrichArticle(
        extracted.fullText,
        [article.source.category, ...article.source.topics.map((sourceTopic) => sourceTopic.topic.slug)].join(', '),
      );
      await prismaService.article.update({
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
      await prismaService.article.update({ where: { id: article.id }, data: { status: ArticleStatus.FAILED } });
      console.error(`Failed to reprocess ${article.id}:`, error);
    }
  }

  console.log(`Reprocessed ${articles.length} article(s).`);
  await app.close();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
