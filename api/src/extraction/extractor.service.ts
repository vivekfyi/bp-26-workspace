import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { extract } from '@extractus/article-extractor';
import { ExtractedArticle } from '../pipeline/pipeline.types.js';

const FALLBACK_USER_AGENT =
  'Mozilla/5.0 (compatible; ScrollZeroBot/1.0; +https://scrollzero.local)';

@Injectable()
export class ExtractorService {
  private readonly timeoutMs: number;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    this.timeoutMs = this.configService.get<number>('ingestion.extractionTimeoutMs', 15000);
  }

  async extractArticle(
    url: string,
    fallbackText?: string | null,
    fallbackAuthor?: string | null,
  ): Promise<ExtractedArticle> {
    let extractedContent = '';
    let extractedAuthor: string | null = fallbackAuthor ?? null;
    let extractedLeadImage: string | null = null;

    try {
      const article = await extract(
        url,
        {
          contentLengthThreshold: 200,
        },
        {
          headers: {
            'user-agent': FALLBACK_USER_AGENT,
          },
          signal: AbortSignal.timeout(this.timeoutMs),
        },
      );

      extractedContent = this.normalizeText(article?.content ?? article?.description ?? '');
      extractedAuthor = article?.author ?? extractedAuthor;
      extractedLeadImage = article?.image ?? null;
    } catch {
      extractedContent = '';
    }

    const normalizedFallback = this.normalizeText(fallbackText ?? '');

    const fullText = extractedContent.length >= normalizedFallback.length ? extractedContent : normalizedFallback;

    if (!fullText) {
      throw new Error('Unable to extract article content');
    }

    return {
      fullText,
      author: extractedAuthor,
      leadImageUrl: extractedLeadImage,
      readingTimeMinutes: this.calculateReadingTime(fullText),
    };
  }

  private calculateReadingTime(text: string): number {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    if (words === 0) {
      return 1;
    }

    return Math.max(1, Math.ceil(words / 220));
  }

  private normalizeText(raw: string): string {
    return raw
      .replace(/<br\s*\/?>(\s*)/gi, '\n')
      .replace(/<\/(p|div|h[1-6]|li|blockquote|article|section)>/gi, '\n\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/[ \t]+/g, ' ')
      .replace(/[ \t]*\n[ \t]*/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
