import {
  Controller,
  Get,
  Post,
  Request,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
  Inject,
} from '@nestjs/common';

import { AuthService } from './auth/auth.service';
import { BasicAuthGuard } from './auth/guards/bacis-auth.guard';

import { AppRequest } from './shared';
import { User } from './users/models';

@Controller()
export class AppController {
  constructor(@Inject(AuthService) private authService: AuthService) {}

  @Get(['', 'ping'])
  healthCheck() {
    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
    };
  }

  @Post('api/auth/register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() body: User) {
    return this.authService.register(body);
  }

  @UseGuards(BasicAuthGuard)
  @Get('api/profile')
  getProfile(@Request() req: AppRequest) {
    return {
      user: req.user,
    };
  }
}
