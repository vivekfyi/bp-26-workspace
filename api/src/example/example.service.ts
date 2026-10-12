import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateExampleDto } from './dto/create-example.dto.js';

type ExampleItem = {
  id: string;
  name: string;
  createdAt: string;
};

@Injectable()
export class ExampleService {
  private readonly items = new Map<string, ExampleItem>();

  create(payload: CreateExampleDto): ExampleItem {
    const id = crypto.randomUUID();
    const item: ExampleItem = {
      id,
      name: payload.name,
      createdAt: new Date().toISOString(),
    };

    this.items.set(id, item);
    return item;
  }

  findAll(): ExampleItem[] {
    return [...this.items.values()];
  }

  findOne(id: string): ExampleItem {
    const item = this.items.get(id);

    if (!item) {
      throw new NotFoundException(`Example item ${id} not found`);
    }

    return item;
  }
}
