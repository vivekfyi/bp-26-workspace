import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class HealthService {
  constructor(private readonly prismaService: PrismaService) {}

  async check() {
    const startedAt = Date.now();

    await this.prismaService.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      database: 'up',
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    };
  }
}
