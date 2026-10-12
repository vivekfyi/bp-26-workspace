import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateExampleDto } from './dto/create-example.dto.js';
import { ExampleService } from './example.service.js';

@Controller('examples')
export class ExampleController {
  constructor(private readonly exampleService: ExampleService) {}

  @Post()
  create(@Body() payload: CreateExampleDto) {
    return this.exampleService.create(payload);
  }

  @Get()
  findAll() {
    return this.exampleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.exampleService.findOne(id);
  }
}
