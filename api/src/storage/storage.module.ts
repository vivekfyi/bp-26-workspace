import { DynamicModule, Module } from '@nestjs/common';

@Module({})
export class StorageModule {
  static register(enabled: boolean): DynamicModule {
    return {
      module: StorageModule,
      providers: [{ provide: 'STORAGE_MODULE_ENABLED', useValue: enabled }],
      exports: ['STORAGE_MODULE_ENABLED'],
    };
  }
}
