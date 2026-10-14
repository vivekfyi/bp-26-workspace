import { Module } from '@nestjs/common';
import { ExtractorService } from './extractor.service.js';

@Module({
  providers: [ExtractorService],
  exports: [ExtractorService],
})
export class ExtractionModule {}
