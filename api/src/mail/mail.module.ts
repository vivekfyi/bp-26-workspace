import { DynamicModule, Module } from '@nestjs/common';

@Module({})
export class MailModule {
  static register(enabled: boolean): DynamicModule {
    return {
      module: MailModule,
      providers: [{ provide: 'MAIL_MODULE_ENABLED', useValue: enabled }],
      exports: ['MAIL_MODULE_ENABLED'],
    };
  }
}
