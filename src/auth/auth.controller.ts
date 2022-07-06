import { Controller, Post, UseGuards, Inject, Response } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response as Res } from 'express';
import { AuthService } from './auth.service';
import { User as UserEntity } from '../models/user/entities/user.entity';
import { User } from '../common/decorators/user.decorator';

@Controller('/api/auth')
export class AuthController {
  constructor(@Inject(AuthService) private authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('/login')
  async login(
    @Response({ passthrough: true }) res: Res,
    @User() user: UserEntity,
  ) {
    return this.authService.login(user, res);
  }
}
