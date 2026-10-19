import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { EnrichedArticle } from '../pipeline/pipeline.types.js';

@Injectable()
export class AiEnrichmentService {
  private readonly logger = new Logger(AiEnrichmentService.name);
  private readonly openaiClient: OpenAI | null;
  private readonly model: string;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ai.apiKey');
    this.model = this.configService.get<string>('ai.model', 'gpt-4o-mini');

    this.openaiClient = apiKey ? new OpenAI({ apiKey }) : null;
  }

  async enrichArticle(fullText: string, sourceCategory: string): Promise<EnrichedArticle> {
    const articleText = this.removeLeadingMetadata(fullText);

    if (!this.openaiClient) {
      return this.fallbackEnrichment(articleText, sourceCategory);
    }

    const prompt = [
      'You are enriching the article body for a curation app.',
      'Summarize the article topic and substance, not the author or publication metadata.',
      'Ignore bylines, author biographies, credentials, introductions about the writer, and promotional text.',
      'Focus on the main claim, important facts, events, evidence, decisions, technical details, and implications.',
      'Return strict JSON with keys: summary_short, summary_bullets, tags.',
      'summary_short: around 50 words explaining what the article is actually about and why it matters.',
      'summary_bullets: exactly 3 concise, specific takeaways from the article content.',
      'tags: 3-6 short lowercase tags.',
      `Primary category context: ${sourceCategory}`,
    ].join('\n');

    const response = await this.openaiClient.chat.completions.create({
      model: this.model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: prompt },
        {
          role: 'user',
          content: `Article body:\n${articleText.slice(0, 12000)}`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    let parsed: Partial<EnrichedArticle> = {};

    try {
      parsed = JSON.parse(raw) as Partial<EnrichedArticle>;
    } catch {
      this.logger.warn('OpenAI returned non-JSON payload; using fallback enrichment');
      return this.fallbackEnrichment(articleText, sourceCategory);
    }

    const summaryBullets = Array.isArray(parsed.summaryBullets)
      ? parsed.summaryBullets.filter((item): item is string => typeof item === 'string').slice(0, 3)
      : [];

    const tags = Array.isArray(parsed.tags)
      ? parsed.tags
          .filter((item): item is string => typeof item === 'string')
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 6)
      : [];

    const summaryShort = typeof parsed.summaryShort === 'string' ? parsed.summaryShort.trim() : '';

    if (!summaryShort || summaryBullets.length < 3 || tags.length < 3) {
      return this.fallbackEnrichment(articleText, sourceCategory);
    }

    return {
      summaryShort,
      summaryBullets,
      tags,
    };
  }

  private removeLeadingMetadata(fullText: string): string {
    const paragraphs = fullText
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

    while (paragraphs.length > 1) {
      const first = paragraphs[0];
      if (!first) break;
      const isByline = /^by\s+[A-Z]/i.test(first);
      const isAuthorBio =
        /\b(?:is|was)\s+(?:the\s+)?(?:\w+\s+){0,3}(?:editor|writer|reporter|journalist|correspondent|author)\b/i.test(first) ||
        /\bcovered\s+(?:the\s+)?(?:tech|technology|industry|news)\b.{0,80}\b(?:years?|decades?)\b/i.test(first) ||
        /\bknows?\s+a\s+thing\s+or\s+two\s+about\b/i.test(first);

      if (!isByline && !isAuthorBio) break;
      paragraphs.shift();
    }

    return paragraphs.join('\n\n') || fullText;
  }

  private fallbackEnrichment(fullText: string, sourceCategory: string): EnrichedArticle {
    const sentences = fullText
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);

    const summaryShort = this.toWordCount(sentences.join(' '), 50);
    const summaryBullets = [
      sentences[0] ?? summaryShort,
      sentences[1] ?? 'Additional context is discussed in detail in the article.',
      sentences[2] ?? 'Practical implications and conclusions are highlighted for readers.',
    ].map((line) => this.toWordCount(line, 20));

    const tokens = fullText
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 4);

    const frequency = new Map<string, number>();
    for (const token of tokens) {
      frequency.set(token, (frequency.get(token) ?? 0) + 1);
    }

    const topKeywords = [...frequency.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4)
      .map(([keyword]) => keyword);

    const tags = [sourceCategory.toLowerCase(), ...topKeywords]
      .filter(Boolean)
      .slice(0, 6);

    while (tags.length < 3) {
      tags.push('curated');
    }

    return {
      summaryShort,
      summaryBullets,
      tags,
    };
  }

  private toWordCount(text: string, wordCount: number): string {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length <= wordCount) {
      return words.join(' ');
    }

    return `${words.slice(0, wordCount).join(' ')}…`;
  }
}
