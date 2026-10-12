import { DynamicModule, Module } from '@nestjs/common';

@Module({})
export class AuthModule {
  static register(enabled: boolean): DynamicModule {
    return {
      module: AuthModule,
      providers: [
        {
          provide: 'AUTH_MODULE_ENABLED',
          useValue: enabled,
        },
      ],
      exports: ['AUTH_MODULE_ENABLED'],
    };
  }
}
