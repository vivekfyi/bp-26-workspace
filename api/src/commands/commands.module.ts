import { DynamicModule, Module } from '@nestjs/common';

@Module({})
export class CommandsModule {
  static register(enabled: boolean): DynamicModule {
    return {
      module: CommandsModule,
      providers: [{ provide: 'COMMANDS_MODULE_ENABLED', useValue: enabled }],
      exports: ['COMMANDS_MODULE_ENABLED'],
    };
  }
}
