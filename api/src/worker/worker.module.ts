import { DynamicModule, Module } from '@nestjs/common';

@Module({})
export class WorkerModule {
  static register(enabled: boolean): DynamicModule {
    return {
      module: WorkerModule,
      providers: [{ provide: 'WORKER_MODULE_ENABLED', useValue: enabled }],
      exports: ['WORKER_MODULE_ENABLED'],
    };
  }
}
