import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { ArticlesService } from './articles.service.js';
import { ListArticlesDto } from './dto/list-articles.dto.js';

@Controller('articles')
export class ArticlesController {
  constructor(@Inject(ArticlesService) private readonly articlesService: ArticlesService) {}

  @Get()
  listProcessed(@Query() query: ListArticlesDto) {
    return this.articlesService.listProcessedArticles(query);
  }

  @Get(':id')
  getProcessed(@Param('id') id: string) {
    return this.articlesService.getProcessedArticle(id);
  }
}
