import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required for seeding');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  await prisma.$transaction(async (tx) => {
    // Articles reference sources with onDelete: Restrict, so remove them first.
    await tx.article.deleteMany();
    await tx.source.deleteMany();

    const topics = await tx.topic.findMany({
      where: { slug: { in: ['world-news', 'software-engineering', 'web-dev'] } },
      select: { id: true, slug: true },
    });

    const topicIdBySlug = new Map(topics.map((topic) => [topic.slug, topic.id]));
    const source = await tx.source.create({
      data: {
        name: 'The Verge',
        feedUrl: 'https://www.theverge.com/rss/index.xml',
        siteUrl: 'https://www.theverge.com',
        category: 'Technology',
        language: 'en',
        trustScore: 82,
        licenseType: 'MIXED_UNKNOWN',
        isActive: true,
      },
      select: { id: true },
    });

    const topicIds = ['world-news', 'software-engineering', 'web-dev']
      .map((slug) => topicIdBySlug.get(slug))
      .filter((id): id is string => Boolean(id));

    if (topicIds.length > 0) {
      await tx.sourceTopic.createMany({
        data: topicIds.map((topicId) => ({ sourceId: source.id, topicId })),
      });
    }
  });

  console.log('Replaced all sources with The Verge.');
}

main()
  .catch((error) => {
    console.error('Verge seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
