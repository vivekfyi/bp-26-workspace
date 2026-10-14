import { Module } from '@nestjs/common';
import { AiEnrichmentService } from './ai-enrichment.service.js';

@Module({
  providers: [AiEnrichmentService],
  exports: [AiEnrichmentService],
})
export class EnrichmentModule {}
