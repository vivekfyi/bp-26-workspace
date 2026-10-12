import { DynamicModule, Module } from '@nestjs/common';

@Module({})
export class OtpModule {
  static register(enabled: boolean): DynamicModule {
    return {
      module: OtpModule,
      providers: [{ provide: 'OTP_MODULE_ENABLED', useValue: enabled }],
      exports: ['OTP_MODULE_ENABLED'],
    };
  }
}
