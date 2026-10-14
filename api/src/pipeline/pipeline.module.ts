import { Module } from '@nestjs/common';
import { PipelineQueueService } from './pipeline-queue.service.js';

@Module({
  providers: [PipelineQueueService],
  exports: [PipelineQueueService],
})
export class PipelineModule {}
