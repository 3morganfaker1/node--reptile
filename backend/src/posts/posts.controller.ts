import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PostsService, materialDataOptions } from './posts.service';

@Controller()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  async create(@Body() materialData: materialDataOptions) {
    await this.postsService.createMaterial(materialData);
  }

  @Get(':id')
  async get(@Param('id') id: number) {
    const material = await this.postsService.getMaterial(+id);
    return material;
  }
}
