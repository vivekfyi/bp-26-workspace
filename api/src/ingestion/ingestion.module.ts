import { Module } from '@nestjs/common';
import { EnrichmentModule } from '../enrichment/enrichment.module.js';
import { ExtractionModule } from '../extraction/extraction.module.js';
import { RssIngestionService } from './rss-ingestion.service.js';

@Module({
  imports: [EnrichmentModule, ExtractionModule],
  providers: [RssIngestionService],
  exports: [RssIngestionService],
})
export class IngestionModule {}
