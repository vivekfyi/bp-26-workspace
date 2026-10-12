import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

export function createWinstonOptions(level: string): WinstonModuleOptions {
  return {
    level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
    transports: [new winston.transports.Console()],
  };
}
