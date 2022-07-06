import { Inject, Injectable } from '@nestjs/common';
import { User } from '../models/user/entities/user.entity';
import { compare } from 'bcrypt';
import { UserService } from '../models/user/user.service';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuid } from 'uuid';
import { GetUserResponse } from '../types/user/response';
import { config } from '../config';

@Injectable()
export class AuthService {
  constructor(
    @Inject(UserService) private userService: User,
    @Inject(JwtService) private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await User.findOne({ where: { username } });

    if (user) {
      const hashCompareResult = await compare(password, user.hashPwd);

      if (hashCompareResult) {
        return user;
      }
    }

    return null;
  }

  async login(user: User, res: Response): Promise<GetUserResponse> {
    if (user.jwtId) {
      const payload = { jwtId: user.jwtId };
      res.cookie('access_token', this.jwtService.sign(payload), {
        secure: false,
        httpOnly: true,
        maxAge: config.jwtCookieTimeToExpire,
        domain: config.jwtCookieDomain,
      });
    } else {
      user.jwtId = uuid();
      await user.save();

      const payload = { jwtId: user.jwtId };
      res.cookie('access_token', this.jwtService.sign(payload), {
        secure: false,
        httpOnly: true,
        maxAge: config.jwtCookieTimeToExpire,
        domain: config.jwtCookieDomain,
      });
    }

    const { jwtId, ...userResponse } = user;

    return userResponse;
  }

  async logout(res: Response) {
    res.clearCookie('access_token', {
      secure: false,
      httpOnly: true,
      maxAge: config.jwtCookieTimeToExpire,
      domain: config.jwtCookieDomain,
    });

    return { ok: true };
  }

  async logoutAll(user: User, res: Response) {
    if (!user?.jwtId) return { ok: false };

    user.jwtId = null;
    await user.save();

    res.clearCookie('access_token', {
      secure: false,
      httpOnly: true,
      maxAge: config.jwtCookieTimeToExpire,
      domain: config.jwtCookieDomain,
    });

    return { ok: true };
  }
}
