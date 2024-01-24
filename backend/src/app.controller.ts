import { Controller, Get, Post, Put } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('app')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('list')
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('create')
  create(): string {
    return this.appService.postHello();
  }

  @Get('user_*')
  getUer() {
    return 'Get_User';
  }

  @Put('list/:id')
  update() {
    return 'update test';
  }
}
