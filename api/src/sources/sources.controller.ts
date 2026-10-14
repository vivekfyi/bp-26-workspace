import { Controller, Get, Post, Query } from '@nestjs/common';
import { SourcesService } from './sources.service.js';
import { ListSourcesDto } from './dto/list-sources.dto.js';

@Controller('sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get()
  listSources(@Query() query: ListSourcesDto) {
    return this.sourcesService.listSources(query);
  }

  @Post('sync')
  triggerSync() {
    return this.sourcesService.triggerSync();
  }
}
