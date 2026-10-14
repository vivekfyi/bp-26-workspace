import { Module } from '@nestjs/common';
import { IngestionModule } from '../ingestion/ingestion.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { SourcesController } from './sources.controller.js';
import { SourcesService } from './sources.service.js';

@Module({
  imports: [IngestionModule, PrismaModule],
  controllers: [SourcesController],
  providers: [SourcesService],
})
export class SourcesModule {}
