import {
  Controller,
  Post,
  UseGuards,
  Inject,
  Res,
  Delete,
  HttpCode,
  Get,
  forwardRef,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { User as User } from '../user/entities/user.entity';
import { UserObj } from '../common/decorators/user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  GetUserFromTokenResponse,
  LoginResponse,
  LogoutAllResponse,
  LogoutResponse,
} from '../types';
import { UserService } from '../user/user.service';

@Controller('/api/auth')
export class AuthController {
  constructor(
    @Inject(forwardRef(() => AuthService)) private authService: AuthService,
    @Inject(forwardRef(() => UserService)) private userService: UserService,
  ) {}

  @Post('/login')
  @UseGuards(AuthGuard('local'))
  @HttpCode(200)
  async login(
    @Res({ passthrough: true }) res: Response,
    @UserObj() user: User,
  ): Promise<LoginResponse> {
    return this.authService.login(user, res);
  }

  @Delete('/logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Res({ passthrough: true }) res: Response): Promise<LogoutResponse> {
    return this.authService.logout(res);
  }

  @Delete('/logout-all')
  @UseGuards(JwtAuthGuard)
  async logoutAll(
    @UserObj() user: User,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutAllResponse> {
    return this.authService.logoutAll(user, res);
  }

  @Get('/user')
  @UseGuards(JwtAuthGuard)
  async getAuthUser(@UserObj() user: User): Promise<GetUserFromTokenResponse> {
    return this.userService.findOne(user.id);
  }
}
