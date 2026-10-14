import { Module } from '@nestjs/common';
import { PipelineModule } from '../pipeline/pipeline.module.js';
import { RssIngestionService } from './rss-ingestion.service.js';

@Module({
  imports: [PipelineModule],
  providers: [RssIngestionService],
  exports: [RssIngestionService],
})
export class IngestionModule {}
