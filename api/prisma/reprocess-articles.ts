import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ArticleStatus } from '../src/generated/prisma/enums.js';
import { AppModule } from '../src/app.module.js';
import { PipelineQueueService } from '../src/pipeline/pipeline-queue.service.js';
import { PROCESS_ARTICLE_JOB } from '../src/pipeline/pipeline.constants.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const prismaService = app.get(PrismaService);
  const pipelineQueueService = app.get(PipelineQueueService);
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

    await pipelineQueueService.articleQueue.add(
      PROCESS_ARTICLE_JOB,
      {
        articleId: article.id,
        sourceCategory: article.source.category,
        sourceTopics: article.source.topics.map((sourceTopic) => sourceTopic.topic.slug),
        sourceLicenseType: article.source.licenseType,
        sourceLanguage: article.source.language,
        rssContent: null,
      },
      {
        removeOnComplete: 200,
        removeOnFail: 300,
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );
  }

  console.log(`Queued ${articles.length} article(s) for full-content reprocessing.`);
  await app.close();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
