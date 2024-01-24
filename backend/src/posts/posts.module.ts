import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { material_info } from './materail.entity';
import { attr_info } from './attribute.entity';

@Module({
  imports: [TypeOrmModule.forFeature([material_info, attr_info])],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
