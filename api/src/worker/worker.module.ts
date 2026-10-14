import { DynamicModule, Module } from '@nestjs/common';
import { EnrichmentModule } from '../enrichment/enrichment.module.js';
import { ExtractionModule } from '../extraction/extraction.module.js';
import { IngestionModule } from '../ingestion/ingestion.module.js';
import { WorkerRuntimeService } from './worker-runtime.service.js';

@Module({})
export class WorkerModule {
  static register(enabled: boolean): DynamicModule {
    if (!enabled) {
      return {
        module: WorkerModule,
        providers: [{ provide: 'WORKER_MODULE_ENABLED', useValue: false }],
        exports: ['WORKER_MODULE_ENABLED'],
      };
    }

    return {
      module: WorkerModule,
      imports: [IngestionModule, ExtractionModule, EnrichmentModule],
      providers: [
        { provide: 'WORKER_MODULE_ENABLED', useValue: true },
        WorkerRuntimeService,
      ],
      exports: ['WORKER_MODULE_ENABLED'],
    };
  }
}
