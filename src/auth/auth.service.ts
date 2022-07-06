import { Inject, Injectable } from '@nestjs/common';
import { User } from '../models/user/entities/user.entity';
import { compare } from 'bcrypt';
import { UserService } from '../models/user/user.service';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuid } from 'uuid';
import { GetUserResponse } from '../types/user/response';

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
      res.cookie('access_token', this.jwtService.sign(payload));
    } else {
      user.jwtId = uuid();
      await user.save();

      const payload = { jwtId: user.jwtId };
      res.cookie('access_token', this.jwtService.sign(payload));
    }

    const { jwtId, ...userResponse } = user;

    return userResponse;
  }
}
