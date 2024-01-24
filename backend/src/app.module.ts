import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostsModule } from './posts/posts.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { material_info } from './posts/materail.entity';
import { attr_info } from './posts/attribute.entity';

@Module({
  imports: [
    PostsModule,
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'cluster01.proxysql.staging.internal',
      port: 6032,
      username: 'gifshow_15632_v1_rw',
      password: 'Kv1cGagPLDhBC6jYflv4WwkN2M9xZmXF',
      database: 'gifshow',
      entities: [material_info, attr_info],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([material_info, attr_info]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
