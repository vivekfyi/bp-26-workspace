export type ProcessArticleJobData = {
  articleId: string;
  sourceCategory: string;
  sourceTopics?: string[];
  sourceLicenseType?: string;
  sourceLanguage?: string;
  rssContent?: string | null;
};

export type SyncSummary = {
  totalSources: number;
  totalItems: number;
  enqueued: number;
  skippedExisting: number;
  erroredSources: number;
};

export type ExtractedArticle = {
  fullText: string;
  author: string | null;
  leadImageUrl: string | null;
  readingTimeMinutes: number;
};

export type EnrichedArticle = {
  summaryShort: string;
  summaryBullets: string[];
  tags: string[];
};
