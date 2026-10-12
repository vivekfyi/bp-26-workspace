import { DynamicModule, Module } from '@nestjs/common';

@Module({})
export class UsersModule {
  static register(enabled: boolean): DynamicModule {
    return {
      module: UsersModule,
      providers: [
        {
          provide: 'USERS_MODULE_ENABLED',
          useValue: enabled,
        },
      ],
      exports: ['USERS_MODULE_ENABLED'],
    };
  }
}
