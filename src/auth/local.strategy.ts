import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from './auth.service';
import { UserSaveData } from '../types';
import { forwardRef, Inject, UnauthorizedException } from '@nestjs/common';

export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(forwardRef(() => AuthService)) private authService: AuthService) {
    super();
  }

  async validate(username: string, password: string): Promise<UserSaveData> {
    const user = await this.authService.validateUser(username, password);

    if (!user) throw new UnauthorizedException();

    return user;
  }
}
