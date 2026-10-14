import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

type SeedTopic = {
  slug: string;
  name: string;
  description: string;
};

type SeedSource = {
  name: string;
  feedUrl: string;
  siteUrl: string;
  category: string;
  language?: string;
  trustScore: number;
  licenseType:
    | 'PUBLIC_DOMAIN'
    | 'CC0'
    | 'CC_BY'
    | 'CC_BY_SA'
    | 'CC_BY_NC'
    | 'CC_BY_NC_SA'
    | 'CC_BY_ND'
    | 'OPEN_GOV'
    | 'MIXED_UNKNOWN';
  topicSlugs: string[];
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required for seeding');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const TOPICS: SeedTopic[] = [
  { slug: 'open-knowledge', name: 'Open Knowledge', description: 'Open licenses, open culture, and commons projects.' },
  { slug: 'open-source', name: 'Open Source', description: 'Open-source foundations, projects, and communities.' },
  { slug: 'ai', name: 'AI', description: 'Artificial intelligence research, engineering, and industry.' },
  { slug: 'software-engineering', name: 'Software Engineering', description: 'Engineering practices, architecture, and platform work.' },
  { slug: 'web-dev', name: 'Web Development', description: 'Frontend, UX engineering, and web standards.' },
  { slug: 'cloud-devops', name: 'Cloud & DevOps', description: 'Cloud infra, deployment, and reliability operations.' },
  { slug: 'security', name: 'Security', description: 'Cybersecurity trends, advisories, and secure engineering.' },
  { slug: 'science', name: 'Science', description: 'Scientific discoveries, journals, and research stories.' },
  { slug: 'health-biotech', name: 'Health & Biotech', description: 'Medicine, public health, and biotech developments.' },
  { slug: 'policy-gov', name: 'Policy & Government', description: 'Regulation, institutions, and public-sector updates.' },
  { slug: 'world-news', name: 'World News', description: 'Global events and geopolitics.' },
  { slug: 'business-finance', name: 'Business & Finance', description: 'Markets, macroeconomics, and company strategy.' },
  { slug: 'media-culture', name: 'Media & Culture', description: 'Culture, ideas, media commentary, and analysis.' },
  { slug: 'education', name: 'Education', description: 'Learning systems, higher ed, and open learning.' },
  { slug: 'space-climate', name: 'Space & Climate', description: 'Space science, climate, and environmental reporting.' },
  { slug: 'research-papers', name: 'Research Papers', description: 'Academic paper streams and primary research feeds.' },
];

const SOURCES: SeedSource[] = [
  {
    name: 'Creative Commons',
    feedUrl: 'https://creativecommons.org/feed/',
    siteUrl: 'https://creativecommons.org',
    category: 'Open Knowledge',
    trustScore: 93,
    licenseType: 'CC_BY',
    topicSlugs: ['open-knowledge', 'policy-gov'],
  },
  {
    name: 'Wikimedia Diff',
    feedUrl: 'https://diff.wikimedia.org/feed/',
    siteUrl: 'https://diff.wikimedia.org',
    category: 'Open Knowledge',
    trustScore: 91,
    licenseType: 'CC_BY_SA',
    topicSlugs: ['open-knowledge', 'education'],
  },
  {
    name: 'Wikimedia Commons Picture of the Day',
    feedUrl: 'https://commons.wikimedia.org/w/api.php?action=featuredfeed&feed=potd&feedformat=rss&language=en',
    siteUrl: 'https://commons.wikimedia.org',
    category: 'Media',
    trustScore: 90,
    licenseType: 'CC_BY_SA',
    topicSlugs: ['open-knowledge', 'media-culture'],
  },
  {
    name: 'Open Source Initiative',
    feedUrl: 'https://opensource.org/feed',
    siteUrl: 'https://opensource.org',
    category: 'Open Source',
    trustScore: 92,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['open-source', 'policy-gov'],
  },
  {
    name: 'Opensource.com',
    feedUrl: 'https://opensource.com/feed',
    siteUrl: 'https://opensource.com',
    category: 'Open Source',
    trustScore: 82,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['open-source', 'software-engineering'],
  },
  {
    name: 'SPDX',
    feedUrl: 'https://spdx.dev/feed/',
    siteUrl: 'https://spdx.dev',
    category: 'Open Source',
    trustScore: 89,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['open-source', 'policy-gov'],
  },
  {
    name: 'Linux Foundation Blog',
    feedUrl: 'https://www.linuxfoundation.org/blog/rss.xml',
    siteUrl: 'https://www.linuxfoundation.org/blog',
    category: 'Open Source',
    trustScore: 88,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['open-source', 'software-engineering'],
  },
  {
    name: 'Linux Foundation Press',
    feedUrl: 'https://www.linuxfoundation.org/press/rss.xml',
    siteUrl: 'https://www.linuxfoundation.org/press',
    category: 'Open Source',
    trustScore: 84,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['open-source', 'business-finance'],
  },
  {
    name: 'ccMixter Remix Feed',
    feedUrl: 'https://ccmixter.org/rss/remix',
    siteUrl: 'https://ccmixter.org',
    category: 'Culture',
    trustScore: 80,
    licenseType: 'CC_BY',
    topicSlugs: ['open-knowledge', 'media-culture'],
  },
  {
    name: 'Internet Archive Blog',
    feedUrl: 'https://blog.archive.org/feed/',
    siteUrl: 'https://blog.archive.org',
    category: 'Open Knowledge',
    trustScore: 86,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['open-knowledge', 'education'],
  },
  {
    name: 'Internet Archive Open Source Audio',
    feedUrl: 'https://archive.org/services/collection-rss.php?collection=opensource_audio',
    siteUrl: 'https://archive.org',
    category: 'Culture',
    trustScore: 81,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['open-knowledge', 'media-culture'],
  },
  {
    name: 'PLOS ONE',
    feedUrl: 'https://journals.plos.org/plosone/feed/atom',
    siteUrl: 'https://journals.plos.org/plosone',
    category: 'Science',
    trustScore: 95,
    licenseType: 'CC_BY',
    topicSlugs: ['science', 'research-papers'],
  },
  {
    name: 'PLOS Biology',
    feedUrl: 'https://journals.plos.org/plosbiology/feed/atom',
    siteUrl: 'https://journals.plos.org/plosbiology',
    category: 'Science',
    trustScore: 95,
    licenseType: 'CC_BY',
    topicSlugs: ['science', 'research-papers'],
  },
  {
    name: 'PLOS Medicine',
    feedUrl: 'https://journals.plos.org/plosmedicine/feed/atom',
    siteUrl: 'https://journals.plos.org/plosmedicine',
    category: 'Health',
    trustScore: 95,
    licenseType: 'CC_BY',
    topicSlugs: ['health-biotech', 'research-papers'],
  },
  {
    name: 'PLOS Genetics',
    feedUrl: 'https://journals.plos.org/plosgenetics/feed/atom',
    siteUrl: 'https://journals.plos.org/plosgenetics',
    category: 'Science',
    trustScore: 94,
    licenseType: 'CC_BY',
    topicSlugs: ['science', 'research-papers'],
  },
  {
    name: 'PLOS Pathogens',
    feedUrl: 'https://journals.plos.org/plospathogens/feed/atom',
    siteUrl: 'https://journals.plos.org/plospathogens',
    category: 'Health',
    trustScore: 93,
    licenseType: 'CC_BY',
    topicSlugs: ['health-biotech', 'research-papers'],
  },
  {
    name: 'PLOS Neglected Tropical Diseases',
    feedUrl: 'https://journals.plos.org/plosntds/feed/atom',
    siteUrl: 'https://journals.plos.org/plosntds',
    category: 'Health',
    trustScore: 92,
    licenseType: 'CC_BY',
    topicSlugs: ['health-biotech', 'research-papers'],
  },
  {
    name: 'PLOS Computational Biology',
    feedUrl: 'https://journals.plos.org/ploscompbiol/feed/atom',
    siteUrl: 'https://journals.plos.org/ploscompbiol',
    category: 'Science',
    trustScore: 93,
    licenseType: 'CC_BY',
    topicSlugs: ['science', 'research-papers', 'ai'],
  },
  {
    name: 'The Conversation US - All',
    feedUrl: 'https://theconversation.com/us/articles.atom',
    siteUrl: 'https://theconversation.com/us',
    category: 'News',
    trustScore: 88,
    licenseType: 'CC_BY_ND',
    topicSlugs: ['world-news', 'education'],
  },
  {
    name: 'The Conversation Global',
    feedUrl: 'https://theconversation.com/global/articles.atom',
    siteUrl: 'https://theconversation.com/global',
    category: 'News',
    trustScore: 88,
    licenseType: 'CC_BY_ND',
    topicSlugs: ['world-news', 'policy-gov'],
  },
  {
    name: 'The Conversation US - Politics',
    feedUrl: 'https://theconversation.com/us/politics/articles.atom',
    siteUrl: 'https://theconversation.com/us/politics',
    category: 'Politics',
    trustScore: 88,
    licenseType: 'CC_BY_ND',
    topicSlugs: ['policy-gov', 'world-news'],
  },
  {
    name: 'The Conversation US - Technology',
    feedUrl: 'https://theconversation.com/us/technology/articles.atom',
    siteUrl: 'https://theconversation.com/us/technology',
    category: 'Tech',
    trustScore: 87,
    licenseType: 'CC_BY_ND',
    topicSlugs: ['ai', 'software-engineering'],
  },
  {
    name: 'The Conversation US - Health',
    feedUrl: 'https://theconversation.com/us/health/articles.atom',
    siteUrl: 'https://theconversation.com/us/health',
    category: 'Health',
    trustScore: 88,
    licenseType: 'CC_BY_ND',
    topicSlugs: ['health-biotech'],
  },
  {
    name: 'The Conversation US - Environment',
    feedUrl: 'https://theconversation.com/us/environment/articles.atom',
    siteUrl: 'https://theconversation.com/us/environment',
    category: 'Environment',
    trustScore: 87,
    licenseType: 'CC_BY_ND',
    topicSlugs: ['space-climate', 'policy-gov'],
  },
  {
    name: 'The Conversation US - Education',
    feedUrl: 'https://theconversation.com/us/education/articles.atom',
    siteUrl: 'https://theconversation.com/us/education',
    category: 'Education',
    trustScore: 87,
    licenseType: 'CC_BY_ND',
    topicSlugs: ['education', 'policy-gov'],
  },
  {
    name: 'The Conversation US - Arts',
    feedUrl: 'https://theconversation.com/us/arts/articles.atom',
    siteUrl: 'https://theconversation.com/us/arts',
    category: 'Culture',
    trustScore: 86,
    licenseType: 'CC_BY_ND',
    topicSlugs: ['media-culture'],
  },
  {
    name: 'The Conversation US - World',
    feedUrl: 'https://theconversation.com/us/world/articles.atom',
    siteUrl: 'https://theconversation.com/us/world',
    category: 'News',
    trustScore: 88,
    licenseType: 'CC_BY_ND',
    topicSlugs: ['world-news'],
  },
  {
    name: 'NASA Image of the Day',
    feedUrl: 'https://www.nasa.gov/rss/dyn/lg_image_of_the_day.rss',
    siteUrl: 'https://www.nasa.gov/image-of-the-day/',
    category: 'Science',
    trustScore: 90,
    licenseType: 'OPEN_GOV',
    topicSlugs: ['space-climate', 'science'],
  },
  {
    name: 'NASA Breaking News',
    feedUrl: 'https://www.nasa.gov/rss/dyn/breaking_news.rss',
    siteUrl: 'https://www.nasa.gov/news/',
    category: 'Science',
    trustScore: 90,
    licenseType: 'OPEN_GOV',
    topicSlugs: ['space-climate', 'policy-gov'],
  },
  {
    name: 'Hacker News Frontpage',
    feedUrl: 'https://hnrss.org/frontpage',
    siteUrl: 'https://news.ycombinator.com',
    category: 'Tech',
    trustScore: 80,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['ai', 'software-engineering'],
  },
  {
    name: 'Lobsters',
    feedUrl: 'https://lobste.rs/rss',
    siteUrl: 'https://lobste.rs',
    category: 'Tech',
    trustScore: 82,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['software-engineering', 'open-source'],
  },
  {
    name: 'GitHub Blog',
    feedUrl: 'https://github.blog/feed/',
    siteUrl: 'https://github.blog',
    category: 'Tech',
    trustScore: 86,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['software-engineering', 'open-source'],
  },
  {
    name: 'Stack Overflow Blog',
    feedUrl: 'https://stackoverflow.blog/feed/',
    siteUrl: 'https://stackoverflow.blog',
    category: 'Tech',
    trustScore: 84,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['software-engineering', 'ai'],
  },
  {
    name: 'AWS News Blog',
    feedUrl: 'https://aws.amazon.com/blogs/aws/feed/',
    siteUrl: 'https://aws.amazon.com/blogs/aws/',
    category: 'Cloud',
    trustScore: 85,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['cloud-devops', 'ai'],
  },
  {
    name: 'Cloudflare Blog',
    feedUrl: 'https://blog.cloudflare.com/rss/',
    siteUrl: 'https://blog.cloudflare.com',
    category: 'Cloud',
    trustScore: 88,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['cloud-devops', 'security'],
  },
  {
    name: 'Netflix Tech Blog',
    feedUrl: 'https://netflixtechblog.com/feed',
    siteUrl: 'https://netflixtechblog.com',
    category: 'Engineering',
    trustScore: 86,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['software-engineering', 'cloud-devops'],
  },
  {
    name: 'Docker Blog',
    feedUrl: 'https://www.docker.com/blog/feed/',
    siteUrl: 'https://www.docker.com/blog/',
    category: 'DevOps',
    trustScore: 84,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['cloud-devops', 'software-engineering'],
  },
  {
    name: 'Kubernetes Blog',
    feedUrl: 'https://kubernetes.io/feed.xml',
    siteUrl: 'https://kubernetes.io/blog/',
    category: 'DevOps',
    trustScore: 87,
    licenseType: 'CC_BY_SA',
    topicSlugs: ['cloud-devops', 'open-source'],
  },
  {
    name: 'Mozilla Hacks',
    feedUrl: 'https://hacks.mozilla.org/feed/',
    siteUrl: 'https://hacks.mozilla.org',
    category: 'Web',
    trustScore: 86,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['web-dev', 'open-source'],
  },
  {
    name: 'web.dev',
    feedUrl: 'https://web.dev/feed.xml',
    siteUrl: 'https://web.dev',
    category: 'Web',
    trustScore: 86,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['web-dev'],
  },
  {
    name: 'CSS-Tricks',
    feedUrl: 'https://css-tricks.com/feed/',
    siteUrl: 'https://css-tricks.com',
    category: 'Web',
    trustScore: 83,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['web-dev'],
  },
  {
    name: 'Smashing Magazine',
    feedUrl: 'https://www.smashingmagazine.com/feed/',
    siteUrl: 'https://www.smashingmagazine.com',
    category: 'Web',
    trustScore: 82,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['web-dev', 'media-culture'],
  },
  {
    name: 'Meta Engineering',
    feedUrl: 'https://engineering.fb.com/feed/',
    siteUrl: 'https://engineering.fb.com',
    category: 'Engineering',
    trustScore: 83,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['software-engineering', 'ai'],
  },
  {
    name: 'arXiv Computer Science',
    feedUrl: 'https://rss.arxiv.org/rss/cs',
    siteUrl: 'https://arxiv.org/archive/cs',
    category: 'Research',
    trustScore: 91,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['research-papers', 'ai'],
  },
  {
    name: 'arXiv Statistics',
    feedUrl: 'https://rss.arxiv.org/rss/stat',
    siteUrl: 'https://arxiv.org/archive/stat',
    category: 'Research',
    trustScore: 90,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['research-papers', 'ai'],
  },
  {
    name: 'Nature',
    feedUrl: 'https://www.nature.com/nature.rss',
    siteUrl: 'https://www.nature.com',
    category: 'Science',
    trustScore: 93,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['science', 'research-papers'],
  },
  {
    name: 'The Guardian World',
    feedUrl: 'https://www.theguardian.com/world/rss',
    siteUrl: 'https://www.theguardian.com/world',
    category: 'News',
    trustScore: 84,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['world-news', 'policy-gov'],
  },
  {
    name: 'The Guardian Technology',
    feedUrl: 'https://www.theguardian.com/technology/rss',
    siteUrl: 'https://www.theguardian.com/technology',
    category: 'Tech',
    trustScore: 83,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['ai', 'policy-gov'],
  },
  {
    name: 'Al Jazeera All',
    feedUrl: 'https://www.aljazeera.com/xml/rss/all.xml',
    siteUrl: 'https://www.aljazeera.com',
    category: 'News',
    trustScore: 83,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['world-news', 'policy-gov'],
  },
  {
    name: 'NPR News',
    feedUrl: 'https://feeds.npr.org/1001/rss.xml',
    siteUrl: 'https://www.npr.org',
    category: 'News',
    trustScore: 86,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['world-news', 'media-culture'],
  },
  {
    name: 'BBC World',
    feedUrl: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    siteUrl: 'https://www.bbc.com/news/world',
    category: 'News',
    trustScore: 87,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['world-news'],
  },
  {
    name: 'ProPublica',
    feedUrl: 'https://www.propublica.org/feeds/propublica/main',
    siteUrl: 'https://www.propublica.org',
    category: 'Investigations',
    trustScore: 89,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['policy-gov', 'world-news'],
  },
  {
    name: 'PBS NewsHour Headlines',
    feedUrl: 'https://www.pbs.org/newshour/feeds/rss/headlines',
    siteUrl: 'https://www.pbs.org/newshour',
    category: 'News',
    trustScore: 85,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['world-news', 'policy-gov'],
  },
  {
    name: 'Ars Technica',
    feedUrl: 'http://feeds.arstechnica.com/arstechnica/index',
    siteUrl: 'https://arstechnica.com',
    category: 'Tech',
    trustScore: 84,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['ai', 'software-engineering'],
  },
  {
    name: 'The Verge',
    feedUrl: 'https://www.theverge.com/rss/index.xml',
    siteUrl: 'https://www.theverge.com',
    category: 'Tech',
    trustScore: 80,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['ai', 'media-culture'],
  },
  {
    name: 'Wired',
    feedUrl: 'https://www.wired.com/feed/rss',
    siteUrl: 'https://www.wired.com',
    category: 'Tech',
    trustScore: 82,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['ai', 'media-culture'],
  },
  {
    name: 'MarketWatch Top Stories',
    feedUrl: 'https://feeds.marketwatch.com/marketwatch/topstories/',
    siteUrl: 'https://www.marketwatch.com',
    category: 'Finance',
    trustScore: 80,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['business-finance'],
  },
  {
    name: 'Federal Reserve Press Releases',
    feedUrl: 'https://www.federalreserve.gov/feeds/press_all.xml',
    siteUrl: 'https://www.federalreserve.gov/newsevents.htm',
    category: 'Finance',
    trustScore: 94,
    licenseType: 'OPEN_GOV',
    topicSlugs: ['business-finance', 'policy-gov'],
  },
  {
    name: 'Open Culture',
    feedUrl: 'https://www.openculture.com/feed',
    siteUrl: 'https://www.openculture.com',
    category: 'Culture',
    trustScore: 80,
    licenseType: 'MIXED_UNKNOWN',
    topicSlugs: ['media-culture', 'education'],
  },
];

async function main() {
  const seedUserEmail = process.env.SEED_USER_EMAIL;

  if (seedUserEmail) {
    await prisma.user.upsert({
      where: { email: seedUserEmail },
      update: {},
      create: {
        email: seedUserEmail,
        passwordHash: null,
      },
    });
  }

  const topicIdBySlug = new Map<string, string>();

  for (const topic of TOPICS) {
    const saved = await prisma.topic.upsert({
      where: { slug: topic.slug },
      update: {
        name: topic.name,
        description: topic.description,
        isActive: true,
      },
      create: {
        slug: topic.slug,
        name: topic.name,
        description: topic.description,
        isActive: true,
      },
      select: { id: true, slug: true },
    });

    topicIdBySlug.set(saved.slug, saved.id);
  }

  for (const source of SOURCES) {
    const savedSource = await prisma.source.upsert({
      where: { feedUrl: source.feedUrl },
      update: {
        name: source.name,
        siteUrl: source.siteUrl,
        category: source.category,
        language: source.language ?? 'en',
        trustScore: source.trustScore,
        licenseType: source.licenseType,
        isActive: true,
      },
      create: {
        name: source.name,
        feedUrl: source.feedUrl,
        siteUrl: source.siteUrl,
        category: source.category,
        language: source.language ?? 'en',
        trustScore: source.trustScore,
        licenseType: source.licenseType,
        isActive: true,
      },
      select: { id: true },
    });

    const topicIds = source.topicSlugs
      .map((slug) => topicIdBySlug.get(slug))
      .filter((id): id is string => Boolean(id));

    await prisma.sourceTopic.deleteMany({
      where: {
        sourceId: savedSource.id,
        topicId: { notIn: topicIds.length > 0 ? topicIds : ['00000000-0000-0000-0000-000000000000'] },
      },
    });

    if (topicIds.length > 0) {
      await prisma.sourceTopic.createMany({
        data: topicIds.map((topicId) => ({
          sourceId: savedSource.id,
          topicId,
        })),
        skipDuplicates: true,
      });
    }
  }

  console.log(`Seeded ${TOPICS.length} topics and ${SOURCES.length} sources.`);
}

main()
  .catch((error) => {
    console.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
