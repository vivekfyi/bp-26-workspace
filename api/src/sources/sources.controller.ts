import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ClerkAdminGuard } from '../auth/clerk-auth.guard.js';
import { CreateSourceDto } from './dto/create-source.dto.js';
import { SourcesService } from './sources.service.js';
import { ListSourcesDto } from './dto/list-sources.dto.js';
import { UpdateSourceDto } from './dto/update-source.dto.js';

@Controller('sources')
export class SourcesController {
  constructor(@Inject(SourcesService) private readonly sourcesService: SourcesService) {}

  @Get()
  listSources(@Query() query: ListSourcesDto) {
    return this.sourcesService.listSources(query);
  }

  @Get('topics')
  listTopics() {
    return this.sourcesService.listTopics();
  }

  @Post()
  @UseGuards(ClerkAdminGuard)
  createSource(@Body() body: CreateSourceDto) {
    return this.sourcesService.createSource(body);
  }

  @Patch(':id')
  @UseGuards(ClerkAdminGuard)
  updateSource(@Param('id') id: string, @Body() body: UpdateSourceDto) {
    return this.sourcesService.updateSource(id, body);
  }

  @Delete(':id')
  @UseGuards(ClerkAdminGuard)
  deleteSource(@Param('id') id: string) {
    return this.sourcesService.deleteSource(id);
  }

  @Post('sync')
  @UseGuards(ClerkAdminGuard)
  triggerSync() {
    return this.sourcesService.triggerSync();
  }

  @Post(':id/reprocess')
  @UseGuards(ClerkAdminGuard)
  reprocessSource(@Param('id') id: string) {
    return this.sourcesService.reprocessSource(id);
  }
}
